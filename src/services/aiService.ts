import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Utility to handle retries for AI calls
async function callAIWithRetry(params: any, retries = 3, delay = 2000): Promise<any> {
  try {
    return await ai.models.generateContent(params);
  } catch (err: any) {
    const isRateLimit = err.message?.includes('429') || 
                        err.message?.includes('quota') || 
                        err.message?.toLowerCase().includes('rate limit');
    
    if (retries > 0 && isRateLimit) {
      console.log(`Rate limit hit, retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callAIWithRetry(params, retries - 1, delay * 2);
    }
    throw err;
  }
}

export async function markTheoryAnswer(question: string, markingScheme: string, studentAnswer: string, maxMarks: number) {
  // Use Flash for better rate limits and speed, it's very capable for marking
  const model = "gemini-3-flash-preview";
  const prompt = `
    You are an expert Examina AI examiner performing a thorough and intelligent evaluation.
    
    Question: ${question}
    Marking Scheme: ${markingScheme}
    Student Answer: ${studentAnswer}
    Max Marks: ${maxMarks}

    INSTRUCTIONS:
    1. Deep Analysis: Understand the student's response in context. Do not rely on exact keyword matching.
    2. Answer Comparison: Compare the response with the marking scheme or correct answer. Focus on meaning, accuracy, and relevance.
    3. Unbiased Marking: Grade fairly and objectively.
    4. Partial Marking: Award partial marks (in increments of 0.5 where appropriate) if the student demonstrates partial understanding or provides a correct idea.
    5. Scoring: Provide a score out of ${maxMarks}.
    6. Feedback: 
       - Clear explanation of marks awarded or deducted.
       - Identify specific mistakes.
       - Provide suggestions for improvement.
       - State the correct answer for the student's reference.
  `;

  const response = await callAIWithRetry({
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

  try {
    const text = response.text || "{}";
    const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error("Failed to parse AI response as JSON:", response.text);
    throw err;
  }
}

export async function markMathAnswer(question: string, markingScheme: string, studentAnswer: string, maxMarks: number) {
  const model = "gemini-3-flash-preview";
  const prompt = `
    You are an expert Mathematics teacher performing an intelligent evaluation.
    
    Question: ${question}
    Marking Scheme: ${markingScheme}
    Student Answer: ${studentAnswer}
    Max Marks: ${maxMarks}

    INSTRUCTIONS:
    1. Step-by-Step Verification: Verify the student's calculations and logic step-by-step.
    2. Partial Marks: Award marks for correct steps even if the final numerical answer is wrong.
    3. Deep Analysis: Focus on mathematical logic and method, not just the final result.
    4. Context Understanding: Understand the student's handwriting representation or typing notation (e.g., ^ for power, * for multiplication).
    5. Feedback: 
       - Provide the full step-by-step correct solution.
       - Identify exactly where the student went wrong.
       - Suggest corrective measures.
       - Provide a score out of ${maxMarks} (partial credit encouraged).
  `;

  const response = await callAIWithRetry({
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

  try {
    const text = response.text || "{}";
    const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error("Failed to parse AI Math response:", response.text);
    throw err;
  }
}

export async function analyzePracticalImage(question: string, base64Image: string | null, studentExplanation: string, maxMarks: number, imageUrl: string | null = null) {
  const model = "gemini-3.1-pro-preview"; // Vision tasks benefit more from Pro, but let's add fallback/retry
  const prompt = `
    Analyze this image of a science experiment/practical setup as an expert lab instructor.
    
    Context: ${question}
    Student's Explanation: ${studentExplanation}
    Max Marks: ${maxMarks}

    INSTRUCTIONS:
    1. Image Deep Analysis: Identify the apparatus, chemicals, and the specific experiment setup.
    2. Verification: Evaluate if the setup is scientifically sound and corresponds to the question.
    3. Comparison: Correlate the visual evidence with the student's written explanation.
    4. Partial Credit: Award marks for correct apparatus identification or partial setup success.
    5. Feedback: 
       - Detailed analysis of the setup.
       - Clear explanation of score (out of ${maxMarks}).
       - Suggestions for improved practical technique.
  `;

  let imagePart;
  if (imageUrl) {
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

  const responseJson = await callAIWithRetry({
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

  try {
    const text = responseJson.text || "{}";
    const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error("Failed to parse AI Practical response:", responseJson.text);
    throw err;
  }
}

export async function generateExternalExam(subject: string, grade: string, paperType: string) {
  // Primary model for generation is Flash for better rate limits, but with Google Search
  const model = "gemini-3.1-pro-preview"; // Search requires Pro or specific Flash versions that support it
  // Wait, skill says: "googleSearch tool is only available to gemini-3-pro-image-preview and gemini-3.1-flash-image-preview" - actually search tool is available to general models too.
  
  const prompt = `
    You are an expert curriculum designer. 
    Search for and generate a full, realistic, and high-quality examination paper for:
    Subject: ${subject}
    Level: ${grade}
    Paper: ${paperType}
    
    The paper should align strictly with common educational standards for ${grade}.
    Include 5 varied and challenging questions.
    Ensure each question has a detailed marking scheme for the AI to use during evaluation.
    
    Return a structured JSON.
  `;

  try {
    const response = await callAIWithRetry({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question_text: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["theory", "math", "practical"] },
                  marks: { type: Type.NUMBER },
                  marking_scheme: { type: Type.STRING }
                },
                required: ["question_text", "type", "marks", "marking_scheme"]
              }
            }
          },
          required: ["title", "questions"]
        }
      }
    });

    const text = response.text || "{}";
    const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (err: any) {
    console.error("AI Generated Exam Error:", err);
    
    // Fallback to Flash without Search if Pro search fails or hits limits
    try {
      const fallbackResponse = await callAIWithRetry({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      const text = fallbackResponse.text || "{}";
      const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(cleanJson);
    } catch (innerErr) {
      throw innerErr;
    }
  }
}

