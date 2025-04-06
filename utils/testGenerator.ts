import { GoogleGenerativeAI } from '@google/generative-ai';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number; // Index of the correct answer (0-3)
}

interface TestResult {
  questions: Question[];
}

export async function generateTest(text: string): Promise<TestResult> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Generate 10 multiple choice questions based on the following text. 
  Your response must be a valid JSON object with the following structure:
  {
    "questions": [
      {
        "question": "The question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0 // Index of the correct answer (0-3)
      }
    ]
  }
  
  Important:
  - The correctAnswer field should be a number (0-3) representing the index of the correct answer in the options array
  - Return ONLY the JSON object, without any markdown formatting or additional text
  - Ensure the response is valid JSON that can be parsed directly
  
  Text to generate questions from:
  ${text}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let generatedText = response.text();

    // Clean up the response by removing any markdown formatting
    generatedText = generatedText
      .replace(/```json\s*/g, '') // Remove ```json
      .replace(/```\s*/g, '') // Remove ```
      .trim(); // Remove any extra whitespace

    // Parse the JSON response
    const parsedResult = JSON.parse(generatedText);
    return parsedResult as TestResult;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate test: ${error.message}`);
    }
    throw new Error('Failed to generate test');
  }
}
