import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL && process.env.GEMINI_MODEL.includes("flash") && !process.env.GEMINI_MODEL.includes("2.5") 
  ? process.env.GEMINI_MODEL 
  : "gemini-3.6-flash";

const genAI = new GoogleGenerativeAI(apiKey || "dummy");

const extractionSchema: Schema = {
  type: SchemaType.OBJECT,
  description: "Extracted treatment information or non-treatment detection.",
  properties: {
    success: {
      type: SchemaType.BOOLEAN,
      description: "True if valid medical treatment information is found, false if the input is unrelated to treatment."
    },
    inputType: {
      type: SchemaType.STRING,
      description: "Must be 'TREATMENT' or 'NON_TREATMENT'"
    },
    message: {
      type: SchemaType.STRING,
      description: "A friendly message explaining if no treatment was found, e.g., 'We couldn't identify a medicine from the doctor's input.'"
    },
    medicines: {
      type: SchemaType.ARRAY,
      description: "List of extracted medicine instructions. Only populate if success is true.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          medicineName: { type: SchemaType.STRING, description: "Medicine name or null if missing." },
          dose: { type: SchemaType.STRING, description: "Dosage amount or null if missing." },
          frequency: { type: SchemaType.STRING, description: "Frequency or null if missing." },
          timing: { type: SchemaType.STRING, description: "Specific time of day or null if missing." },
          foodCondition: { type: SchemaType.STRING, description: "Food instructions or null if missing." },
          duration: { type: SchemaType.STRING, description: "Duration or null if missing." },
          additionalInstructions: { type: SchemaType.STRING, description: "Special instructions." },
        },
        required: ["medicineName", "dose", "timing", "foodCondition", "duration"],
      }
    }
  },
  required: ["success", "inputType"]
};

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured. Please check your connection." }, { status: 500 });
    }

    const { transcript } = await req.json();

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({ error: "We couldn't hear an instruction. Please try recording again." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: extractionSchema,
        temperature: 0.1,
      },
    });

    const prompt = `
      You are a precise medical transcription assistant. 
      Analyze the following doctor's voice transcript.
      
      CRITICAL RULES:
      1. INTENT CHECK: If the transcript is a casual greeting, a joke, unrelated chatter, or does NOT contain clear medical instructions/medicines, return success: false, inputType: "NON_TREATMENT", and a friendly message.
      2. NEVER guess, infer, or invent missing medical information. 
      3. If a field (duration, timing, dose, food condition) is NOT explicitly stated, return null for that field. Do NOT invent "1 tablet" or "Morning" if it was not spoken.
      
      Transcript: "${transcript}"
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    if (!parsed.success || parsed.inputType === "NON_TREATMENT") {
      return NextResponse.json({ 
        success: false,
        message: parsed.message || "No treatment information detected. Please enter the treatment information again."
      }, { status: 200 }); // Return 200 so the frontend can handle the business logic gracefully
    }

    const validatedMedicines = (parsed.medicines || []).map((med: any) => ({
      id: crypto.randomUUID(),
      medicineName: med.medicineName || null,
      dose: med.dose || null,
      frequency: med.frequency || null,
      timing: med.timing || null,
      foodCondition: med.foodCondition || null,
      duration: med.duration || null,
      additionalInstructions: med.additionalInstructions || null,
    }));

    return NextResponse.json({ success: true, medicines: validatedMedicines });
  } catch (error: any) {
    console.error("Gemini Extraction Error:", error);
    return NextResponse.json({ error: "We couldn't process the doctor's instruction right now. Please try again or enter manually." }, { status: 500 });
  }
}
