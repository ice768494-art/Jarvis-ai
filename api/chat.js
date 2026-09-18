import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is missing in Vercel."
      });
    }

    const { message, tasks = [], notes = [] } = req.body || {};

    if (!message) {
      return res.status(400).json({
        error: "Message is required."
      });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await client.responses.create({
      model: "gpt-5.6",
      instructions:
        "You are JARVIS, a helpful personal AI assistant. " +
        "Be concise, friendly and useful. " +
        "The user's current tasks and notes are provided as context.",
      input: `
User message:
${message}

Current tasks:
${JSON.stringify(tasks)}

Current notes:
${JSON.stringify(notes)}
`
    });

    return res.status(200).json({
      reply: response.output_text || "I couldn't generate a response."
    });

  } catch (error) {
    console.error("JARVIS ERROR:", error);

    return res.status(500).json({
      error: error?.message || "AI request failed."
    });
  }
}
