// api/chat.js
export default async function handler(req, res) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const { message, history } = req.body;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
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

    const data = await openaiRes.json();

    if (data?.choices?.[0]?.message?.content) {
      res.status(200).json({ reply: data.choices[0].message.content });
    } else {
      res.status(500).json({ reply: "Cannot process your request." });
    }
  } catch (err) {
    console.error("Error from OpenAI API:", err);
    res.status(500).json({ reply: "Server error occurred." });
  }
}