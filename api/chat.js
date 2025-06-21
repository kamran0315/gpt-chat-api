export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is supported' });
  }

  const { message, history } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing OpenAI API key' });
  }

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required and must be a string' });
  }

  try {
    const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: history || [{ role: 'user', content: message }],
        temperature: 0.7
      })
    });

    const data = await apiRes.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      return res.status(500).json({ error: 'AI returned no response' });
    }

    return res.status(200).json({ reply: data.choices[0].message.content.trim() });

  } catch (err) {
    console.error('AI fetch error:', err);
    return res.status(500).json({ error: 'Failed to reach AI server' });
  }
}
