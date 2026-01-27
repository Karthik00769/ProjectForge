// Dynamic model discovery for Generative Language API
const apiKey = process.env.GEMINI_API_KEY!;
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// Cache for discovered models
let availableModels: string[] | null = null;

async function discoverAvailableModels(): Promise<string[]> {
    if (availableModels !== null) return availableModels;

    try {
        console.log("Discovering available Gemini models for your API key...");
        const response = await fetch(`${API_BASE_URL}/models?key=${apiKey}`);

        if (!response.ok) {
            console.error("Failed to list models:", response.status);
            availableModels = [];
            return [];
        }

        const data = await response.json();
        const models = data.models || [];

        // Filter for models that support generateContent
        const discovered = models
            .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m: any) => m.name);

        availableModels = discovered;
        console.log(`✓ Found ${discovered.length} available models:`, discovered);
        return discovered;
    } catch (error) {
        console.error("Error discovering models:", error);
        availableModels = [];
        return [];
    }
}

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
    // First, discover what models are actually available
    console.log("[GEMINI] Starting model discovery...");
    const models = await discoverAvailableModels();

    if (models.length === 0) {
        console.warn("[GEMINI] No models available for this API key. AI features disabled.");
        throw new Error("No models available");
    }

    console.log(`[GEMINI] Will try ${models.length} models in order`);
    let lastError;

    for (const modelName of models) {
        try {
            console.log(`[GEMINI] Attempting: ${modelName}`);
            const result = await generateContentDirect(modelName, contents);
            console.log(`[GEMINI] ✓ Success with: ${modelName}`);
            return result;
        } catch (error: any) {
            console.warn(`[GEMINI] ✗ Failed with ${modelName}: ${error.message}`);
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
