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
    "website", "design", "development", "SEO", "WordPress", "branding", "marketing", "support",
    "hosting", "services", "MVP", "software", "AI", "AI agent", "workflow", "application"
  ];

  const bookingKeywords = ["book", "meeting", "appointment", "schedule", "call"];

  const messageLower = message.toLowerCase();
  const isServiceRelated = serviceKeywords.some((kw) => messageLower.includes(kw));
  const wantsToBook = bookingKeywords.some((kw) => messageLower.includes(kw));

  const userMessages = history.filter((m) => m.role === "user");
  const recentNonServiceMessages = userMessages
    .slice(-3)
    .filter((m) => !serviceKeywords.some((kw) => m.content.toLowerCase().includes(kw)));

  const tooManyIrrelevant = recentNonServiceMessages.length >= 2;
  const shouldSuggestMeeting = userMessages.length >= 3 || wantsToBook;

  const systemPrompt = {
    role: "system",
    content: `You are Karin, a helpful, polite assistant for programmetic.com. You can answer any general questions briefly and respectfully. But your main job is to guide users toward the company's services: website design, development, SEO, hosting, MVPs, software development, AI agents, AI workflows, and AI applications.

If a user asks 2–3 unrelated questions, politely redirect them back to what they need and how you can help. Mention the booking link after a few interactions or if they mention booking.`,
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
        temperature: 0.7,
      }),
    });

    const json = await openaiRes.json();
    let reply = json.choices?.[0]?.message?.content?.trim() || "❌ No reply received from AI.";

    if (tooManyIrrelevant) {
      reply += "\n\n🙏 By the way, I'm best at helping with our services like design, development, SEO, AI solutions, and more. Let me know how I can assist you.";
    }

    if (shouldSuggestMeeting) {
      reply += "\n\n📅 Want to talk to us? Book a meeting here: https://calendly.com/hello-programmetic";
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("OpenAI API error:", err);
    return res.status(500).json({ reply: "❌ Error: Could not reach AI server." });
  }
}
