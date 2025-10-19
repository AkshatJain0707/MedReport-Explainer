
import { GoogleGenAI, Type } from "@google/genai";
import type { ExtractedLabData, GroundingChunk, ResearchData } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64.split(',')[1],
      mimeType,
    },
  };
};

// Agent 1: Lab Report Analyst
export const extractLabData = async (
  imageBase64: string,
  mimeType: string,
  userQuery: string
): Promise<ExtractedLabData> => {
  const imagePart = fileToGenerativePart(imageBase64, mimeType);
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: {
      parts: [
        imagePart,
        { text: `Analyze the lab report image. Focus specifically on finding the values related to the user's query: "${userQuery}". Extract the test name, its value, unit, and the standard range. Ignore irrelevant information.` }
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          lab_values: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                test_name: { type: Type.STRING, description: "The name of the lab test, e.g., 'LDL Cholesterol'." },
                value: { type: Type.STRING, description: "The measured value of the test, e.g., '150'." },
                unit: { type: Type.STRING, description: "The unit of measurement, e.g., 'mg/dL'." },
                standard_range: { type: Type.STRING, description: "The standard or reference range for the test, e.g., '<100'." },
              },
              required: ["test_name", "value", "unit"]
            }
          }
        },
        required: ["lab_values"]
      }
    }
  });

  const jsonText = response.text.trim();
  try {
    const parsedData = JSON.parse(jsonText);
    // Basic validation
    if (!parsedData.lab_values || !Array.isArray(parsedData.lab_values)) {
      throw new Error("AI response is not in the expected format. It's missing 'lab_values' array.");
    }
    return parsedData as ExtractedLabData;
  } catch (e) {
    console.error("Failed to parse JSON from Gemini:", jsonText);
    throw new Error("The AI failed to extract data in a structured format. Please try a clearer image or a more specific query.");
  }
};

// Agent 2: Medical Researcher
export const researchMedicalContext = async (data: ExtractedLabData): Promise<ResearchData> => {
  if (data.lab_values.length === 0) {
    return { summary: "No specific lab values were extracted to research.", sources: [] };
  }
  
  const dataString = data.lab_values.map(v => `${v.test_name}: ${v.value} ${v.unit} (Range: ${v.standard_range || 'N/A'})`).join(', ');

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Based on these lab values: ${dataString}. For each value, research its meaning. Explain: What does this test measure? What are the general implications if the value is high or low compared to the standard range? Synthesize this into a concise research brief using credible sources.`,
    config: {
      tools: [{googleSearch: {}}],
    },
  });

  const summary = response.text;
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];
  
  return { summary, sources };
};

// Agent 3: Report Explainer
export const synthesizePatientExplanation = async (data: ExtractedLabData, researchContext: string): Promise<string> => {
   if (data.lab_values.length === 0) {
    return "I couldn't find any specific lab values related to your question in the provided image. Please try asking a more specific question or using a clearer image.";
  }
  const dataSummary = data.lab_values.map(v => `- ${v.test_name}: Your value is ${v.value} ${v.unit}. The standard range is typically ${v.standard_range || 'not listed'}.`).join('\n');

  const prompt = `You are a compassionate health educator. Your goal is to explain lab results to a patient in simple, reassuring, and easy-to-understand language.

Here is the patient's data:
${dataSummary}

Here is the medical research context:
${researchContext}

Combine this information into a single, cohesive explanation for the patient. 
1. Start by clearly stating their specific lab values.
2. Explain what these values mean in simple terms, using the research context. Avoid jargon.
3. Conclude with the following disclaimer, exactly as written, in a new paragraph at the very end: "This is an AI-generated summary and not a substitute for professional medical advice. Please consult with your doctor to discuss your lab results."
`;
  
  const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
  });

  return response.text;
};
