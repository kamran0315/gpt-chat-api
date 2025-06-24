export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST method is supported" });
  }

  const { message, history = [] } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ reply: "❌ Missing OpenAI API key." });
  }

  const serviceKeywords = [
    "website", "design", "development", "seo", "wordpress", "branding",
    "support", "hosting", "site", "web", "online", "services"
  ];

  const bookingKeywords = [
    "book", "booking", "appointment", "schedule", "call", "meet", "talk", "demo"
  ];

  const messageLower = message.toLowerCase();
  const isServiceRelated = serviceKeywords.some((kw) => messageLower.includes(kw));
  const wantsToBook = bookingKeywords.some((kw) => messageLower.includes(kw));
  const shouldSuggestMeeting =
    history.filter((m) => m.role === "user").length >= 3 || wantsToBook;

  if (!isServiceRelated && !wantsToBook) {
    const apologyMessage =
      "🙏 I'm Karin, your assistant for website services at Programmetic.com. I can help with design, development, SEO, hosting, MVP, software development, AI agent, AI workflows, AI applications and more. Could you ask something about those services?";
    return res.status(200).json({ reply: apologyMessage });
  }

  const systemPrompt = {
    role: "system",
    content:
      "You are Karin, a helpful assistant for programmetic.com. Only answer questions related to our website services (like web design, WordPress, SEO, branding, hosting, mvp, software development, ai agent, ai workflows, ai applications or support). Politely reject questions that are not related to these. Detect and reply in the user's language to make them feel at home — especially if it's Swedish, German, French, Arabic, Urdu, etc. Always be friendly and helpful.",
  };

  const updatedHistory = [systemPrompt, ...history.slice(-10), { role: "user", content: message }];

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: updatedHistory,
        temperature: 0.6,
      }),
    });

    const json = await openaiRes.json();
    let reply = json.choices?.[0]?.message?.content?.trim() || "❌ No reply received from AI.";

    if (shouldSuggestMeeting) {
      reply += "\n\n📅 Would you like to discuss your project? You can book a free meeting here: [Book Now](https://calendly.com/hello-programmetic)";
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("OpenAI API error:", err);
    return res.status(500).json({ reply: "❌ Error: Could not reach AI server." });
  }
}
