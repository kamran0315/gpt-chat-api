export default async function handler(req, res) {
  // ✅ Always set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Respond to preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ reply: "No message provided" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          ...(history || []).slice(-10),
          { role: "user", content: message },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!data || !data.choices || !data.choices.length) {
      return res.status(500).json({ reply: "Error from OpenAI." });
    }

    res.status(200).json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ reply: "Internal error." });
  }
}
