import { GoogleGenAI, Type } from "@google/genai";
import { QuizData, QuizOption } from "../types";

export const parsePdfToQuiz = async (base64Pdf: string): Promise<QuizData> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is missing from environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Schema for structured output
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "A short, descriptive title for the mock test extracted from the document header.",
      },
      topic: {
        type: Type.STRING,
        description: "The main subject or topic (e.g., Physics - Rotational Motion, NEET Full Mock).",
      },
      questions: {
        type: Type.ARRAY,
        description: "List of multiple choice questions extracted from the document.",
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER, description: "Sequential ID of the question" },
            text: { 
              type: Type.STRING, 
              description: "The full text of the question. Use LaTeX for math expressions (e.g. $x^2$). " 
            },
            pageNumber: {
              type: Type.INTEGER,
              description: "The page number (1-based) where this question appears."
            },
            boundingBox: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
              description: "The bounding box [ymin, xmin, ymax, xmax] (0-1000 scale) of ONLY the DIAGRAM/IMAGE associated with the question. Do not include the question text. If no diagram exists, return [0,0,0,0]."
            },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "The option label (A, B, C, D)" },
                  text: { type: Type.STRING, description: "The text content of the option." }
                },
                required: ["id", "text"]
              }
            },
            correctOptionId: { 
              type: Type.STRING, 
              description: "The correct option ID (A, B, C, or D). YOU MUST SOLVE THE QUESTION or find the answer key to determine this." 
            },
            explanation: {
              type: Type.STRING,
              description: "A brief explanation of why the answer is correct. Use LaTeX for math."
            }
          },
          required: ["id", "text", "options", "correctOptionId"]
        }
      }
    },
    required: ["title", "questions"]
  };

  try {
    // Using gemini-3-pro-preview strictly as requested
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Pdf,
            },
          },
          {
            text: `You are an expert academic tutor for JEE and NEET aspirants. 
            Visually scan this PDF mock test. 
            1. EXTRACT ALL QUESTIONS found in the document. Do not summarize. Do not stop after a few. If there are 50 questions, extract all 50.
            2. Identify distinct questions and their multiple-choice options (A, B, C, D).
            3. For each question, identify the 'boundingBox' [ymin, xmin, ymax, xmax] (0-1000 scale) strictly for the DIAGRAM, FIGURE, or GRAPH associated with the question. DO NOT include the question text or options in this box. If there is no visual diagram, return [0,0,0,0].
            4. SOLVE each question to find the correct answer. 
            5. Provide a brief explanation for the solution.
            6. Structure the output strictly as JSON.
            7. IMPORTANT: For any mathematical expressions, chemical formulas, or physics equations, YOU MUST USE LaTeX format enclosed in single dollar signs for inline math (e.g., $E=mc^2$) or double dollar signs for block math.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1, 
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("AI returned no candidates. The document might be too large or violate safety policies.");
    }

    const text = response.text;
    if (!text) {
      console.warn("Empty response text. Finish reason:", response.candidates[0]?.finishReason);
      throw new Error("AI returned empty response. Please try a different or shorter PDF.");
    }

    const data = JSON.parse(text) as QuizData;
    return data;

  } catch (error) {
    console.error("Error parsing PDF with Gemini:", error);
    throw error;
  }
};

export const getDetailedSolution = async (questionText: string, options: QuizOption[]): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are an expert JEE/NEET tutor.
    Here is a multiple choice question:
    
    Question: ${questionText}
    
    Options:
    ${options.map(o => `${o.id}) ${o.text}`).join('\n')}
    
    Please provide a DETAILED, STEP-BY-STEP solution to this problem. 
    1. Identify the key concept or formula required.
    2. Show the calculation steps clearly.
    3. Explain the reasoning.
    4. Conclude with the correct option.
    
    FORMATTING RULES:
    - Use Markdown for structure (headings, bold text).
    - CRITICAL: Write ALL mathematical expressions, equations, and chemical formulas using LaTeX syntax.
    - Enclose inline math in single dollar signs, e.g., $\\sqrt{x^2 + y^2}$.
    - Enclose block math equations in double dollar signs, e.g., $$ F = ma $$.
    - Do not use plain text for math (e.g., avoid writing "x squared", use $x^2$).
    
    Keep the tone professional, authoritative, and encouraging.
  `;

  try {
    // Exclusively using gemini-3-pro-preview
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        temperature: 0.2,
      }
    });

    if (response.text) return response.text;
    throw new Error("Empty response from Pro model");

  } catch (error) {
    console.error("Error generating detailed solution:", error);
    return "Error generating solution. Please try again.";
  }
};