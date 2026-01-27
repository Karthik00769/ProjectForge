// Using Generative Language API (correct endpoint for your API key)
const apiKey = process.env.GEMINI_API_KEY!;

// Correct endpoint for Generative Language API
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// Models available on Generative Language API
const MODELS_TO_TRY = [
    "models/gemini-1.5-flash",
    "models/gemini-1.5-pro",
    "models/gemini-pro"
];

async function generateContentDirect(modelName: string, contents: any) {
    const url = `${API_BASE_URL}/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`${response.status}: ${JSON.stringify(error)}`);
    }

    return response.json();
}

async function generateWithFallback(contents: any) {
    let lastError;

    for (const modelName of MODELS_TO_TRY) {
        try {
            console.log(`Attempting Generative Language API with: ${modelName}`);
            const result = await generateContentDirect(modelName, contents);
            console.log(`✓ Success with: ${modelName}`);
            return result;
        } catch (error: any) {
            console.warn(`Failed with ${modelName}: ${error.message}`);
            lastError = error;
        }
    }

    throw lastError || new Error("All models failed");
}

// AI Use Case 1: Step Suggestion
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
        const contents = [{ parts: [{ text: prompt }] }];
        const result = await generateWithFallback(contents);

        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Gemini Step Generation Error:", error);
        return [];
    }
}

// AI Use Case 2: OCR Text Extraction
export async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
    const prompt = `Extract all visible text from this document/image. 
Return ONLY the extracted text. Do not add commentary or formatting. 
If no text is found, return "No text detected."`;

    try {
        const contents = [{
            parts: [
                { text: prompt },
                {
                    inline_data: {
                        mime_type: mimeType,
                        data: buffer.toString("base64")
                    }
                }
            ]
        }];

        const result = await generateWithFallback(contents);
        return result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    } catch (error) {
        console.error("Gemini OCR Error:", error);
        return "";
    }
}
