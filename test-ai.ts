import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  const prompt = `
    You are an expert Examina AI examiner performing a thorough and intelligent evaluation.
    
    Question: God created human beings. He made them to be like __ [us, them, himself]
    Marking Scheme: himself
    Student Answer: 
    Max Marks: 1

    INSTRUCTIONS:
    1. Deep Analysis: Understand the student's response in context. Do not rely on exact keyword matching.
    2. Answer Comparison: Compare the response with the marking scheme or correct answer. Focus on meaning, accuracy, and relevance.
    3. Unbiased Marking: Grade fairly and objectively.
    4. Partial Marking: Award partial marks (in increments of 0.5 where appropriate) if the student demonstrates partial understanding or provides a correct idea.
    5. Scoring: Provide a score out of 1.
    6. Feedback: 
       - Clear explanation of marks awarded or deducted.
       - Identify specific mistakes.
       - Provide suggestions for improvement.
       - State the correct answer for the student's reference.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            modelAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["score", "modelAnswer", "explanation"]
        }
      }
    });

    console.log("Success!");
    console.log(response.text);
  } catch (e: any) {
    console.error("Error occurred:", e.message || String(e));
  }
}

test();
