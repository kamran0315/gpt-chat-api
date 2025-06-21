// api/chat.js
export default async function handler(req, res) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const { message, history } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          ...(history || []),
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    const reply = data.choices?.[0]?.message?.content || "Sorry, no reply from the bot.";
    res.status(200).json({ reply });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ reply: "Server error occurred." });
  }
}
