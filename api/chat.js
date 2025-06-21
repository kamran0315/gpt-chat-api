export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // switch to gpt-4 if needed
        messages: history || [{ role: 'user', content: message }],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('OpenAI API error:', data.error);
      return res.status(500).json({ error: data.error.message || 'AI error' });
    }

    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      console.error('Empty AI response:', data);
      return res.status(500).json({ error: 'No reply received from AI.' });
    }

    res.status(200).json({ reply: reply.trim() });
  } catch (error) {
    console.error('Fetch failed:', error);
    res.status(500).json({ error: 'Failed to fetch from OpenAI.' });
  }
}
