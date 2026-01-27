// Direct REST API implementation to bypass SDK v1beta limitation
const apiKey = process.env.GEMINI_API_KEY!;

// Use v1 API endpoint (stable) instead of v1beta
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1";

// Models to try (free tier compatible)
const MODELS_TO_TRY = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-pro"
];

async function generateContentDirect(modelName: string, contents: any) {
    const url = `${API_BASE_URL}/models/${modelName}:generateContent?key=${apiKey}`;

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
            console.log(`Attempting Gemini v1 API with model: ${modelName}`);
            const result = await generateContentDirect(modelName, contents);
            console.log(`✓ Success with model: ${modelName}`);
            return result;
        } catch (error: any) {
            console.warn(`Failed with model ${modelName}: ${error.message}`);
            lastError = error;
        }
    }

    throw lastError || new Error("All Gemini models failed");
}

// AI Use Case 1: Step Suggestion (Contextual Assistance Only)
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

// AI Use Case 2: Basic Proof Text Extraction (OCR) - Enrichment Only
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
