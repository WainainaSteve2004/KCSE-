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

export async function analyzePracticalImage(question: string, base64Image: string | null, studentExplanation: string, maxMarks: number, imageUrl: string | null = null) {
  const model = "gemini-3-flash-preview";
  const prompt = `
    Analyze this image of a science experiment/practical setup.
    Question Context: ${question}
    Student's Explanation: ${studentExplanation}
    Max Marks: ${maxMarks}

    Identify the apparatus, chemicals, and the experiment being performed.
    Evaluate if the setup is correct and if the student's explanation matches the visual evidence.
    Provide a score out of ${maxMarks}, an analysis of the image, and an explanation of the outcome.
    Return the result in JSON format with keys: score, analysis, explanation.
  `;

  let imagePart;
  if (imageUrl) {
    // Fetch image from URL and convert to base64
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64
      }
    };
  } else if (base64Image) {
    imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Image.split(',')[1] || base64Image
      }
    };
  } else {
    throw new Error("No image provided for practical question");
  }

  const responseJson = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: prompt },
        imagePart
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
