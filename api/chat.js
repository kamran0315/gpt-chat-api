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
    "website",
    "design",
    "development",
    "SEO",
    "WordPress",
    "branding",
    "marketing",
    "support",
    "hosting",
    "services"
  ];

  const bookingKeywords = ["book", "meeting", "appointment", "schedule", "call"];

  const messageLower = message.toLowerCase();

  const isServiceRelated = serviceKeywords.some((kw) => messageLower.includes(kw));
  const wantsToBook = bookingKeywords.some((kw) => messageLower.includes(kw));

  // After 3 interactions or explicit booking intent
  const shouldSuggestMeeting = history.filter((m) => m.role === "user").length >= 3 || wantsToBook;

  if (!isServiceRelated && !wantsToBook) {
    const apologyMessage =
      "🙏 I'm here to help with our website services like design, development, SEO, and support. Please ask me about those!";
    return res.status(200).json({ reply: apologyMessage });
  }

  const systemPrompt = {
    role: "system",
    content:
      "You are Karin, a helpful assistant for programmetic.com. Only answer questions related to our website services (like web design, WordPress, SEO, branding, hosting, or support). For anything else, kindly apologize and guide users back. Be friendly and helpful.",
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
      reply += "\n\n📅 Want to talk to us? Book a meeting here: https://calendly.com/hello-programmetic";
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("OpenAI API error:", err);
    return res.status(500).json({ reply: "❌ Error: Could not reach AI server." });
  }
}
