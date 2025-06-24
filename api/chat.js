export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST method is supported" });

  const { message, history = [] } = req.body;

  if (!process.env.OPENAI_API_KEY)
    return res.status(500).json({ reply: "❌ Missing OpenAI API key." });

  const serviceKeywords = [
    "website", "design", "development", "seo", "wordpress", "branding",
    "hosting", "mvp", "software", "ai", "agent", "workflows", "applications",
    "support", "services"
  ];

  const bookingKeywords = ["book", "meeting", "appointment", "schedule", "call"];

  const messageLower = message.toLowerCase();
  const isServiceRelated = serviceKeywords.some((kw) => messageLower.includes(kw));
  const wantsToBook = bookingKeywords.some((kw) => messageLower.includes(kw));

  const userMessages = history.filter((m) => m.role === "user");
  const offTopicCount = userMessages.filter(m => !serviceKeywords.some(kw => m.content.toLowerCase().includes(kw))).length;

  const systemPrompt = {
    role: "system",
    content:
      "You are Karin, a friendly, intelligent voice assistant for Programmetic.com. You speak all major languages fluently and automatically respond in the user language. Your main goal is to guide users toward the best digital solution for their needs, such as: Website and app development, Custom software, AI agents and automation, MVPs and SaaS platforms, AI-powered workflows. Always respond in a polite, conversational tone. Encourage users to describe their business, goal, or challenge. If they ask unrelated questions (e.g., about weather or personal topics), gently redirect them toward relevant services after 2–3 messages. When appropriate — or when users ask about “booking,” “meeting,” “talk,” or similar — invite them to book a free consultation: https://calendly.com/hello-programmetic Be concise, supportive, and proactive — your mission is to understand the user need and connect them to the right tech solution."
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
      })
    });

    const json = await openaiRes.json();
    let reply = json.choices?.[0]?.message?.content?.trim() || "❌ No reply received from AI.";

    if (offTopicCount >= 2 && !isServiceRelated && !wantsToBook) {
      reply += "\n\n🙏 Just a reminder: I specialize in services like web design, SEO, development, and AI workflows. Feel free to ask about those!";
    }

    if ((userMessages.length >= 3 || wantsToBook) && !reply.includes("calendly.com")) {
      reply += "\n\n📅 Want to talk to us? Book a meeting here: https://calendly.com/hello-programmetic";
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("OpenAI API error:", err);
    return res.status(500).json({ reply: "❌ Error: Could not reach AI server." });
  }
}