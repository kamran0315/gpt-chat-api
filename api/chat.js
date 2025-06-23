export const config = {
  runtime: 'edge',
};

const systemPrompt = `
You are Karin, a helpful and friendly AI assistant for Programmetic.com.
You assist users with questions related to the company’s services such as:
- AI chatbot deployment
- Workflow automation
- API integration
- Digital transformation
- Streamlining business processes

If a question is unrelated, kindly steer the user back to these services.

After 2–3 replies, suggest booking a free consultation with:
https://calendly.com/hello-programmetic

Be professional, brief, and informative. Never pretend to be human — you're Karin, the AI from Programmetic.
`;

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Only POST method is supported', {
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const { message, history } = await req.json();

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: message },
    ];

    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
      }),
    });

    const data = await completion.json();

    if (!data || !data.choices || !data.choices[0]?.message?.content) {
      return new Response(JSON.stringify({ reply: "❌ No reply received from AI." }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ reply: data.choices[0].message.content }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    return new Response(JSON.stringify({ reply: "❌ Error: Could not reach AI server." }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 500,
    });
  }
}
