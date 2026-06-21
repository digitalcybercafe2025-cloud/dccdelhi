
import { GoogleGenAI, Type } from "@google/genai";

export const validateDocumentAI = async (base64Image: string, docType: string) => {
  try {
    // Initialize client inside function per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: `Analyze this document. Is this a valid ${docType}? Extract the main details like Name, ID Number, and Expiry if visible. Return the analysis in JSON format.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            extractedName: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            message: { type: Type.STRING }
          },
          required: ["isValid", "extractedName", "confidence"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Validation Error:", error);
    return { isValid: true, extractedName: "N/A", confidence: 0.5, message: "AI Validation Unavailable" };
  }
};

export const getSmartPriority = async (applicationsCount: number, revenue: number) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Given ${applicationsCount} pending applications and ₹${revenue} total revenue, what should be the operations priority for today? Suggest 3 key focus points for a cyber cafe business.`,
    });
    return response.text;
  } catch (error) {
    return "Prioritize pending Passport and ITR applications for faster turnaround.";
  }
};
