// Cloudflare Pages Function (Workers runtime): POST /api/claude
// The only place the OpenRouter key lives. The app sends an Anthropic Messages-style body
// { system, messages, max_tokens } and expects { content: [{ type: 'text', text }] } back.
// This translates to OpenRouter chat completions, forces the model, caps output and checks the password.
//
// Env (Pages → Settings → Variables and Secrets, or app/.dev.vars locally):
//   OPENROUTER_API_KEY  secret, required
//   APP_PASSWORD        secret, required (shared friend password; requests without it get 401)
//   MODEL               optional, default anthropic/claude-haiku-5.5 (anthropic/claude-sonnet-5.5 = ~20x pricier)
//   MAX_TOKENS          optional output cap per call, default 300 (testing); hard ceiling 4000
//   OPENROUTER_BASE_URL optional, for testing against a mock

// Haiku: ~20x cheaper than Sonnet. Set MODEL=anthropic/claude-sonnet-5.5 to try Sonnet without a code change.
const DEFAULT_MODEL = 'anthropic/claude-haiku-5.5';
// Kept very low while testing (cost safety). Real questions need ~1000–1500; raise via the MAX_TOKENS env var
// (e.g. 2000) once we go live — no code change needed.
const DEFAULT_MAX_TOKENS_CAP = 300;
const MAX_INPUT_CHARS = 60000; // system + all messages; the app's biggest prompts are well under this
const MAX_MESSAGES = 40;

const json = (status, obj) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

// Anthropic content can be a string or an array of blocks; the app only sends text.
const textOf = c => typeof c === 'string' ? c
  : Array.isArray(c) ? c.map(b => (b && typeof b.text === 'string' ? b.text : '')).join('')
  : '';

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function onRequestPost({ request, env }) {
  if (!env.APP_PASSWORD || !env.OPENROUTER_API_KEY) {
    return json(500, { error: 'Server not configured (APP_PASSWORD / OPENROUTER_API_KEY missing)' });
  }
  if (!safeEqual(request.headers.get('x-app-password') || '', env.APP_PASSWORD)) {
    return json(401, { error: 'Wrong or missing password' });
  }

  let body;
  try { body = await request.json(); } catch { return json(400, { error: 'Invalid JSON' }); }
  if (!body || !Array.isArray(body.messages) || !body.messages.length) {
    return json(400, { error: 'messages[] is required' });
  }
  if (body.messages.length > MAX_MESSAGES) return json(413, { error: 'Too many messages' });

  const messages = [];
  const system = textOf(body.system);
  if (system) messages.push({ role: 'system', content: system });
  for (const m of body.messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) return json(400, { error: 'Bad message role' });
    messages.push({ role: m.role, content: textOf(m.content) });
  }
  if (messages.reduce((n, m) => n + m.content.length, 0) > MAX_INPUT_CHARS) {
    return json(413, { error: 'Prompt too long' });
  }

  // The client's model / max_tokens are ignored beyond the cap — friends can't pick an expensive model.
  const cap = Math.min(Number(env.MAX_TOKENS) || DEFAULT_MAX_TOKENS_CAP, 4000);
  const payload = {
    model: env.MODEL || DEFAULT_MODEL,
    max_tokens: Math.min(Math.max(Number(body.max_tokens) || 1000, 1), cap),
    messages,
  };

  const base = (env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api').replace(/\/$/, '');
  let upstream, data;
  try {
    upstream = await fetch(base + '/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ' + env.OPENROUTER_API_KEY,
        'X-Title': 'Quizant',
      },
      body: JSON.stringify(payload),
    });
    data = await upstream.json().catch(() => null);
  } catch (err) {
    return json(502, { error: 'Upstream request failed', detail: String(err) });
  }

  if (!upstream.ok || !data) {
    // Pass the status through (429 = rate/credit limit) but never echo upstream headers or the key.
    const msg = (data && data.error && (data.error.message || data.error)) || 'Upstream error';
    return json(upstream.ok ? 502 : upstream.status, { error: String(msg).slice(0, 300) });
  }
  const choice = data.choices && data.choices[0];
  if (!choice || !choice.message) {
    return json(502, { error: 'No completion returned', detail: data.error ? String(data.error.message || data.error).slice(0, 300) : undefined });
  }

  const u = data.usage || {};
  return json(200, {
    type: 'message',
    role: 'assistant',
    model: data.model || payload.model,
    content: [{ type: 'text', text: String(choice.message.content || '') }],
    stop_reason: choice.finish_reason === 'length' ? 'max_tokens' : 'end_turn',
    usage: { input_tokens: u.prompt_tokens || 0, output_tokens: u.completion_tokens || 0 },
  });
}

export const onRequest = () => json(405, { error: 'Method not allowed' });
