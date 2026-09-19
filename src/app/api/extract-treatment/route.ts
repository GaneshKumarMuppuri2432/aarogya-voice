import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
// The API threw an error saying 2.5-flash is deprecated and to use 3.6-flash
const modelName = process.env.GEMINI_MODEL && process.env.GEMINI_MODEL.includes("flash") && !process.env.GEMINI_MODEL.includes("2.5") 
  ? process.env.GEMINI_MODEL 
  : "gemini-3.6-flash";

if (!apiKey) {
  console.warn("GEMINI_API_KEY is missing from environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "dummy");

// Define the structured schema for Gemini output
const medicineSchema: Schema = {
  type: SchemaType.ARRAY,
  description: "List of extracted medicine instructions",
  items: {
    type: SchemaType.OBJECT,
    properties: {
      medicineName: {
        type: SchemaType.STRING,
        description: "The name of the medicine. Return null if unclear or missing.",
      },
      dose: {
        type: SchemaType.STRING,
        description: "The dosage amount (e.g., '1 tablet', '5ml'). Return null if unclear or missing.",
      },
      frequency: {
        type: SchemaType.STRING,
        description: "How often it should be taken (e.g., 'twice daily', 'morning and night'). Return null if missing.",
      },
      timing: {
        type: SchemaType.STRING,
        description: "Specific time of day (e.g., 'morning', 'night', '8 AM'). Return null if missing.",
      },
      foodCondition: {
        type: SchemaType.STRING,
        description: "Whether to take before, after, or with food. Return null if not specified.",
      },
      duration: {
        type: SchemaType.STRING,
        description: "How many days or weeks to take the medicine (e.g., '5 days'). Return null if missing.",
      },
      additionalInstructions: {
        type: SchemaType.STRING,
        description: "Any other special instructions.",
      },
    },
    required: ["medicineName", "dose", "timing", "foodCondition", "duration"],
  },
};

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured on the server." }, { status: 500 });
    }

    const { transcript } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: medicineSchema,
        temperature: 0.1, // Keep it highly deterministic
      },
    });

    const prompt = `
      You are a precise medical transcription assistant. 
      Extract structured treatment instructions from the following doctor's voice transcript.
      
      CRITICAL RULES:
      1. DO NOT infer, guess, or invent missing information.
      2. If a field like duration, timing, dose, or food condition is NOT explicitly stated by the doctor, you MUST return null for that field.
      3. Distinguish between multiple medicines and separate them into array items.
      
      Transcript: "${transcript}"
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const medicines = JSON.parse(responseText);

    // Provide an independent validation layer on top of the structured output
    const validatedMedicines = medicines.map((med: any) => ({
      id: crypto.randomUUID(), // unique ID for editing
      medicineName: med.medicineName || null,
      dose: med.dose || null,
      frequency: med.frequency || null,
      timing: med.timing || null,
      foodCondition: med.foodCondition || null,
      duration: med.duration || null,
      additionalInstructions: med.additionalInstructions || null,
    }));

    return NextResponse.json({ medicines: validatedMedicines });
  } catch (error: any) {
    console.error("Gemini Extraction Error:", error);
    return NextResponse.json({ error: "Failed to process treatment instructions." }, { status: 500 });
  }
}
