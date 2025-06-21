export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { message, history } = req.body;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          ...(history || []).slice(-10),
          { role: "user", content: message }
        ],
        temperature: 0.7
      })
    });

    const json = await openaiRes.json();

    if (openaiRes.ok && json.choices?.length > 0) {
      return res.status(200).json({ reply: json.choices[0].message.content });
    } else {
      console.error("OpenAI API error:", json);
      return res.status(500).json({ reply: "Something went wrong with OpenAI." });
    }
  } catch (error) {
    console.error("API handler error:", error);
    return res.status(500).json({ reply: "Internal server error." });
  }
}
