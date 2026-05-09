// Streaming Claude endpoint — proxies to Anthropic so the API key never touches the browser
export const config = { api: { bodyParser: true, responseLimit: false } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { prompt, system, apiKey } = req.body
  const key = process.env.ANTHROPIC_API_KEY || apiKey
  if (!key) return res.status(400).json({ error: 'No Claude API key configured. Add ANTHROPIC_API_KEY to .env.local or enter it in Config.' })

  const body = {
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    stream: true,
    messages: [{ role: 'user', content: prompt }],
    ...(system && { system }),
  }

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!upstream.ok) {
    const err = await upstream.json()
    return res.status(upstream.status).json({ error: err.error?.message || 'Anthropic API error' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  const reader = upstream.body.getReader()
  const dec = new TextDecoder()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(dec.decode(value))
    }
  } finally {
    res.end()
  }
}
