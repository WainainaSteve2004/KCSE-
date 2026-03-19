import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function markTheoryAnswer(question: string, markingScheme: string, studentAnswer: string, maxMarks: number) {
  const model = "gemini-3-flash-preview";
  const prompt = `
    You are an expert KCSE examiner. 
    Question: ${question}
    Marking Scheme: ${markingScheme}
    Student Answer: ${studentAnswer}
    Max Marks: ${maxMarks}

    Evaluate the student's answer based on the marking scheme. 
    Be fair and understand the meaning even if wording is different.
    Provide a score out of ${maxMarks}, a correct model answer, and a brief explanation of the marks awarded.
  `;

  const response = await ai.models.generateContent({
    model,
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

  return JSON.parse(response.text || "{}");
}

export async function markMathAnswer(question: string, markingScheme: string, studentAnswer: string, maxMarks: number) {
  const model = "gemini-3-flash-preview";
  const prompt = `
    You are an expert Mathematics teacher.
    Question: ${question}
    Marking Scheme: ${markingScheme}
    Student Answer: ${studentAnswer}
    Max Marks: ${maxMarks}

    Solve the math problem step-by-step. 
    Compare your steps with the student's answer.
    Award partial marks for correct steps even if the final answer is wrong.
    Provide a score out of ${maxMarks}, the full step-by-step correct solution, and an explanation of the grading.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          solution: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["score", "solution", "explanation"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function analyzePracticalImage(question: string, base64Image: string, studentExplanation: string, maxMarks: number) {
  const model = "gemini-2.5-flash-image";
  const prompt = `
    Analyze this image of a science experiment/practical setup.
    Question Context: ${question}
    Student's Explanation: ${studentExplanation}
    Max Marks: ${maxMarks}

    Identify the apparatus, chemicals, and the experiment being performed.
    Evaluate if the setup is correct and if the student's explanation matches the visual evidence.
    Provide a score out of ${maxMarks}, an analysis of the image, and an explanation of the outcome.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image.split(',')[1] || base64Image
          }
        }
      ]
    },
    config: {
      // responseMimeType: "application/json" // Not supported for nano banana series models as per instructions
    }
  });

  // Since responseMimeType: "application/json" is not supported for gemini-2.5-flash-image,
  // we might need to parse the text or use a different model for structured output if needed.
  // But for now, let's try to get a structured-like text and parse it manually or just return text.
  // Actually, I'll use gemini-3-flash-preview for the analysis if I need JSON, but it doesn't support images as well as the image model.
  // Wait, gemini-3-flash-preview DOES support images. Let's use it for JSON.
  
  const responseJson = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { text: prompt + "\nReturn the result in JSON format with keys: score, analysis, explanation." },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image.split(',')[1] || base64Image
          }
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          analysis: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["score", "analysis", "explanation"]
      }
    }
  });

  return JSON.parse(responseJson.text || "{}");
}
