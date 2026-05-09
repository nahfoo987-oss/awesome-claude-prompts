// Non-streaming AI calls for short tasks (reflections, roadmaps, memory extraction)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { prompt, system, model, apiKey } = req.body

  try {
    if (model === 'claude' || !model) {
      const key = process.env.ANTHROPIC_API_KEY || apiKey
      if (!key) return res.status(400).json({ error: 'No Claude API key.' })
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'claude-opus-4-7', max_tokens: 800, messages: [{ role: 'user', content: prompt }], ...(system && { system }) }),
      })
      const d = await r.json()
      if (d.error) return res.status(400).json({ error: d.error.message })
      return res.json({ text: d.content[0].text })
    }

    if (model === 'gpt') {
      const key = process.env.OPENAI_API_KEY || apiKey
      if (!key) return res.status(400).json({ error: 'No OpenAI API key.' })
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }),
      })
      const d = await r.json()
      if (d.error) return res.status(400).json({ error: d.error.message })
      return res.json({ text: d.choices[0].message.content })
    }

    if (model === 'gemini') {
      const key = process.env.GOOGLE_API_KEY || apiKey
      if (!key) return res.status(400).json({ error: 'No Google API key.' })
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      })
      const d = await r.json()
      if (d.error) return res.status(400).json({ error: d.error.message })
      return res.json({ text: d.candidates[0].content.parts[0].text })
    }

    return res.status(400).json({ error: 'Unknown model.' })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
