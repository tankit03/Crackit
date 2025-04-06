import { GoogleGenerativeAI } from '@google/generative-ai';
import { Question } from '@/types/test';

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
);

interface RegenerateQuestionsParams {
  text: string;
  existingQuestions: Question[];
  questionIndex?: number;
}

export async function regenerateQuestions({
  text,
  existingQuestions,
  questionIndex,
}: RegenerateQuestionsParams): Promise<Question[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt =
      questionIndex !== undefined
        ? `You are a test question generator. Given the following text and existing questions, generate a new multiple choice question to replace question ${questionIndex + 1}.
        The new question should be different from the existing ones but cover similar concepts.
        The question should have 4 options and one correct answer.
        Format the question as a JSON object with the following structure:
        {
          "question": "The question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0
        }
        Return only the JSON object, without any markdown formatting or additional text.

        Text:
        ${text}

        Existing Questions:
        ${JSON.stringify(existingQuestions, null, 2)}`
        : `You are a test question generator. Given the following text and existing questions, generate ${existingQuestions.length} new multiple choice questions.
        The questions should be different from the existing ones but cover similar concepts.
        Each question should have 4 options and one correct answer.
        Format each question as a JSON object with the following structure:
        {
          "question": "The question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0
        }
        Return only a JSON array of these questions, without any markdown formatting or additional text.

        Text:
        ${text}

        Existing Questions:
        ${JSON.stringify(existingQuestions, null, 2)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Clean up the response by removing any markdown formatting
    const cleanResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Parse the response and validate the questions
    const questions =
      questionIndex !== undefined
        ? [JSON.parse(cleanResponse) as Question]
        : (JSON.parse(cleanResponse) as Question[]);

    // Validate the questions
    if (!Array.isArray(questions)) {
      throw new Error(
        'Invalid response format: expected an array of questions'
      );
    }

    questions.forEach((q, index) => {
      if (
        !q.question ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        typeof q.correctAnswer !== 'number' ||
        q.correctAnswer < 0 ||
        q.correctAnswer > 3
      ) {
        throw new Error(`Invalid question format at index ${index}`);
      }
    });

    return questions;
  } catch (error) {
    console.error('Error regenerating questions:', error);
    throw error;
  }
}
