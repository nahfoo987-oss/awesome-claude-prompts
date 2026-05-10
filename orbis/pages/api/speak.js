// ElevenLabs TTS — streams audio back to the browser
export const config = { api: { responseLimit: false } }

// Adam voice — deep, authoritative British male (JARVIS-style)
const DEFAULT_VOICE = 'pNInz6obpgDQGcFmaJgB'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { text, voiceId, apiKey } = req.body
  if (!text) return res.status(400).json({ error: 'No text provided.' })

  const key = process.env.ELEVENLABS_API_KEY || apiKey
  if (!key) return res.status(400).json({ error: 'No ElevenLabs API key.' })

  const voice = voiceId || DEFAULT_VOICE

  const upstream = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2',
      voice_settings: { stability: 0.65, similarity_boost: 0.88, style: 0.12, use_speaker_boost: true },
    }),
  })

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({}))
    return res.status(upstream.status).json({ error: err.detail?.message || 'ElevenLabs error' })
  }

  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Cache-Control', 'no-cache')
  const reader = upstream.body.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(Buffer.from(value))
    }
  } finally {
    res.end()
  }
}
