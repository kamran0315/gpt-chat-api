// api/chat.js
export default async function handler(req, res) {
  // ✅ CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, history } = req.body;

  if (!message || !Array.isArray(history)) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  try {
    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are Karin, a helpful assistant for Programmetic.com. Answer questions clearly and help users book a meeting if needed." },
          ...history,
          { role: "user", content: message },
        ],
        temperature: 0.7,
      }),
    });

    const data = await apiRes.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "❌ No reply received from AI.";

    res.status(200).json({ reply });
  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ reply: "❌ Error: Could not reach AI server." });
  }
}
