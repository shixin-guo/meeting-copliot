import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

/**
 * Calls OpenRouter's chat completion API with JSON mode to extract todos from meeting input.
 * @param {string} input - The meeting input text
 * @returns {Promise<string[]>} - Array of todo items
 */
export async function extractTodosWithOpenRouter(input) {
  const systemPrompt = `You are a helpful assistant that extracts a todo list from meeting notes. Return only the todo items as a JSON array of strings, nothing else.`;
  const userPrompt = `Extract the top 5 todo list from the following meeting input. If no todos are found, return an empty array.\n\nInput:\n${input}`;

  const response = await openai.chat.completions.create({
    model: "openai/gpt-4o-mini", // Updated to a model that supports structured outputs
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "todos",
        strict: true,
        schema: {
          type: "object",
          properties: {
            todos: {
              type: "array",
              description: "List of todo items extracted from the meeting notes",
              items: {
                type: "string",
                description: "A single todo item",
              },
            },
          },
          required: ["todos"],
          additionalProperties: false,
        },
      },
    },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  // The model should return { "todos": [...] }
  const content = response.choices[0].message.content;
  let todos = [];
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed.todos)) {
      todos = parsed.todos;
    }
  } catch (err) {
    // fallback: try to parse as array
    try {
      todos = JSON.parse(content);
      if (!Array.isArray(todos)) {
        todos = [];
      }
    } catch {
      todos = [];
    }
  }
  return todos;
}
