// File: api/chat.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is supported' });
  }

  const { message, history } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing OpenAI API key' });
  }

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: history || [{ role: 'user', content: message }],
        temperature: 0.7
      })
    });

    const json = await apiRes.json();

    if (!json.choices || !json.choices[0]?.message?.content) {
      return res.status(500).json({ error: 'AI returned no response' });
    }

    return res.status(200).json({ reply: json.choices[0].message.content.trim() });

  } catch (err) {
    console.error('AI fetch error:', err);
    return res.status(500).json({ error: 'Failed to reach AI server' });
  }
}
