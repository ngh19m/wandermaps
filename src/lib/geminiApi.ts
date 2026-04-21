import { GoogleGenAI, Type } from "@google/genai";
import { MarkerInfo, Memory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function askAssistant(
  query: string,
  history: {role: string, content: string}[],
  markers: MarkerInfo[],
  memories: Memory[]
) {
  const systemInstruction = `
    You are an AI Discovery Agent for "WanderMark", a personal map app.
    Your job is to act as a "second brain", helping the user find places, recall memories, 
    and suggest new places based on their saved markers and web search.

    The user's saved markers (places) are provided here:
    ${JSON.stringify(markers, null, 2)}

    The user's memories (notes/photos attached to markers) are here:
    ${JSON.stringify(memories, null, 2)}

    Process the user query.
    1. If they ask about saved places, refer to the markers array.
    2. If they ask for recommendations, suggest something based on their style, searching the web if necessary to find highly-rated, trendy spots.
    3. Determine if an action string should be provided to help the user navigate, save a place, or call.

    Respond in JSON matching the schema.
  `;

  const formattedHistory = history.map(msg => ({
    role: msg.role === 'ai' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const contents = [...formattedHistory, { role: 'user', parts: [{ text: query }] }];

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: contents,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction,
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          answer: {
            type: Type.STRING,
            description: "The natural language response to the user's query."
          },
          actionCards: {
            type: Type.ARRAY,
            description: "List of actionable items like places suggested, or places to navigate to.",
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Name of the place" },
                type: { type: Type.STRING, description: "Type of action: 'directions', 'save', 'call'" },
                lat: { type: Type.NUMBER, description: "Latitude. Be precise if possible." },
                lng: { type: Type.NUMBER, description: "Longitude. Be precise if possible." },
                address: { type: Type.STRING, description: "Address of the place." },
                actionData: { type: Type.STRING, description: "E.g. phone number if type is 'call'" }
              },
              required: ["title", "type", "lat", "lng", "address"]
            }
          }
        },
        required: ["answer"]
      }
    }
  });

  if (response.text) {
    try {
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse JSON", e);
      return { answer: "Sorry, I had an error processing the response." };
    }
  }

  return { answer: "Sorry, no response generated." };
}
