export default async function handler(req, res) {
  // ✅ Setup CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ❌ Reject other methods
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  const { message, history } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ reply: "OpenAI API key is missing." });
  }

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          ...(history || []).slice(-10),
          { role: "user", content: message }
        ],
        temperature: 0.7,
      }),
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok || !data.choices) {
      console.error("OpenAI error:", data);
      return res.status(500).json({ reply: "OpenAI API error." });
    }

    return res.status(200).json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ reply: "Internal server error." });
  }
}
