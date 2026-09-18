import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(request) {
  // Only allow POST
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed"
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "OPENAI_API_KEY is not configured."
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const body = await request.json();

    const message = body.message;
    const tasks = Array.isArray(body.tasks) ? body.tasks : [];
    const notes = Array.isArray(body.notes) ? body.notes : [];

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({
          error: "Message is required."
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const taskSummary = tasks
      .slice(0, 30)
      .map((task, index) => {
        return `${index + 1}. ${
          task.completed ? "[completed]" : "[active]"
        } ${task.text}`;
      })
      .join("\n");

    const noteSummary = notes
      .slice(0, 20)
      .map((note, index) => {
        return `${index + 1}. ${note.text}`;
      })
      .join("\n");

    const systemPrompt = `
You are JARVIS, a friendly personal productivity assistant.

Your job is to help the user with:
- Tasks
- Notes
- Planning
- Productivity
- Simple questions
- Organizing their day

Be concise, helpful and natural.

The user's current tasks are:

${taskSummary || "No tasks."}

The user's saved notes are:

${noteSummary || "No notes."}

Important:
- Do not claim that you changed a task or note.
- The browser application handles actual task and note changes.
- If the user asks to add, delete, complete or modify a task, clearly explain what action should be taken.
- If the user asks a normal question, answer normally.
`;

    const response = await client.responses.create({
      model: "gpt-5",
      instructions: systemPrompt,
      input: message
    });

    return new Response(
      JSON.stringify({
        reply: response.output_text
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  } catch (error) {
    console.error("JARVIS API error:", error);

    return new Response(
      JSON.stringify({
        error: "JARVIS could not process that request."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}
