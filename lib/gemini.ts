import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);
// Using gemini-1.5-flash-latest - Explicit Version as requested
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

// AI Use Case 1: Step Suggestion (Contextual Assistance Only)
// AI NEVER auto-saves, blocks task creation, or controls workflow
export async function generateSteps(jobTitle: string): Promise<{ title: string; description: string }[]> {
    const prompt = `You are a helpful assistant for ProjectForge. 
  Generate a list of 3-5 standard professional steps for the job: "${jobTitle}".
  Return ONLY a valid JSON array of objects with "title" and "description" keys. 
  No markdown formatting, no code blocks, just the raw JSON string.
  
  Example structure:
  [
    { "title": "Preparation", "description": "Gather necessary tools and safety equipment." }
  ]`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        // Clean up potential markdown code blocks if the model ignores instruction
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Gemini Step Generation Error:", error);
        // AI failure does NOT block app - return empty array
        return [];
    }
}

// AI Use Case 2: Basic Proof Text Extraction (OCR) - Enrichment Only
export async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
    // Gemini supports image/png, image/jpeg, image/webp, application/pdf
    // We strictly pass these types.

    const prompt = `Extract all visible text from this document/image. 
  Return ONLY the extracted text. Do not add commentary or formatting. 
  If no text is found, return "No text detected."`;

    try {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: buffer.toString("base64"),
                    mimeType: mimeType,
                },
            },
        ]);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Gemini OCR Error:", error);
        // Fail gracefully, OCR is enrichment only - does NOT block upload
        return "";
    }
}
