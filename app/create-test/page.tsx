'use client';

import { useState, useEffect } from 'react';
import { PdfToTextConverter } from '@/components/PdfToTextConverter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateTest } from '@/utils/testGenerator';
import { PublishTestModal } from '@/components/PublishTestModal';
import { publishTest, PublishTestData } from '@/utils/publishTest';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Session } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number; // Index of the correct answer (0-3)
}

interface TestResult {
  questions: Question[];
}

interface UserAnswer {
  questionIndex: number;
  selectedOption: number | null;
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default function CreateTestPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<number[][]>([]);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) {
          router.push('/sign-in');
          return;
        }
        setSession(currentSession);
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/sign-in');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [router]);

  const handleTextExtracted = (text: string) => {
    setExtractedText(text);
    setTestResult(null);
    setError(null);
    setUserAnswers([]);
    setShowResults(false);
    setShuffledOptions([]);
  };

  const handleGenerateTest = async () => {
    if (!extractedText) return;

    setIsGeneratingTest(true);
    setError(null);

    try {
      const result = await generateTest(extractedText);
      setTestResult(result);
      // Initialize user answers array
      setUserAnswers(
        result.questions.map((_, index) => ({
          questionIndex: index,
          selectedOption: null,
        }))
      );
      // Initialize shuffled options for each question
      setShuffledOptions(
        result.questions.map(() => shuffleArray([0, 1, 2, 3]))
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while generating the test'
      );
    } finally {
      setIsGeneratingTest(false);
    }
  };

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    setUserAnswers((prev) =>
      prev.map((answer) =>
        answer.questionIndex === questionIndex
          ? { ...answer, selectedOption: optionIndex }
          : answer
      )
    );
  };

  const calculateScore = () => {
    if (!testResult) return 0;
    return userAnswers.reduce((score, answer) => {
      const question = testResult.questions[answer.questionIndex];
      const originalCorrectIndex = question.correctAnswer;
      const shuffledCorrectIndex =
        shuffledOptions[answer.questionIndex].indexOf(originalCorrectIndex);
      return score + (answer.selectedOption === shuffledCorrectIndex ? 1 : 0);
    }, 0);
  };

  const handleSubmitTest = () => {
    setShowResults(true);
  };

  const handleRetakeTest = () => {
    if (!testResult) return;
    setUserAnswers(
      testResult.questions.map((_, index) => ({
        questionIndex: index,
        selectedOption: null,
      }))
    );
    setShuffledOptions(
      testResult.questions.map(() => shuffleArray([0, 1, 2, 3]))
    );
    setShowResults(false);
  };

  const handlePublishTest = async (data: PublishTestData) => {
    try {
      // First check current session state
      if (!session?.user) {
        // Try to get the current session
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw new Error(`Authentication error: ${sessionError.message}`);
        }

        if (!currentSession?.user) {
          setError('You must be logged in to publish a test');
          setIsPublishModalOpen(false);
          return;
        }

        // Update the session if we found one
        setSession(currentSession);
        try {
          await publishTest(data, currentSession.user.id);
          setIsPublishModalOpen(false);
        } catch (error) {
          throw new Error('Failed to publish test: ' + (error as Error).message);
        }
      } else {
        // We have a valid session, proceed with publishing
        try {
          await publishTest(data, session.user.id);
          setIsPublishModalOpen(false);
        } catch (error) {
          throw new Error('Failed to publish test: ' + (error as Error).message);
        }
      }
    } catch (error) {
      console.error('Error in handlePublishTest:', error);
      setError((error as Error).message);
      setIsPublishModalOpen(false);
    }
  };

  const isTestComplete = () => {
    return userAnswers.every((answer) => answer.selectedOption !== null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <PdfToTextConverter onTextExtracted={handleTextExtracted} />
          <div className="mt-4 space-y-2">
            {session ? (
              <div className="flex items-center space-x-2">
                <p className="text-green-600">
                  Logged in as: {session.user.email}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => supabase.auth.signOut()}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-yellow-600">
                  You must be logged in to publish tests.
                </p>
                <Button onClick={() => router.push('/sign-in')} variant="outline">
                  Sign in with Google
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4">
          {extractedText && (
            <Card>
              <CardHeader>
                <CardTitle>Extracted Text</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
                    {extractedText}
                  </pre>
                </div>
                <Button
                  onClick={handleGenerateTest}
                  disabled={isGeneratingTest}
                  className="mt-4 w-full"
                >
                  {isGeneratingTest ? 'Generating Test...' : 'Generate Test'}
                </Button>
              </CardContent>
            </Card>
          )}
          {error && (
            <Card className="bg-red-50 dark:bg-red-900/20">
              <CardContent className="pt-6">
                <p className="text-red-500 dark:text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}
          {testResult && !showResults && (
            <Card>
              <CardHeader>
                <CardTitle>Test Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {testResult.questions.map((question, index) => (
                    <div key={index} className="space-y-2">
                      <p className="font-medium">
                        {index + 1}. {question.question}
                      </p>
                      <div className="space-y-1">
                        {shuffledOptions[index]?.map((optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`p-2 rounded cursor-pointer ${
                              userAnswers[index]?.selectedOption === optionIndex
                                ? 'bg-blue-100 dark:bg-blue-900/30'
                                : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            onClick={() =>
                              handleAnswerSelect(index, optionIndex)
                            }
                          >
                            {String.fromCharCode(65 + optionIndex)}.{' '}
                            {question.options[optionIndex]}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button
                    onClick={handleSubmitTest}
                    disabled={!isTestComplete()}
                    className="w-full mt-4"
                  >
                    Submit Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          {showResults && testResult && (
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      Score: {calculateScore()} / {testResult.questions.length}
                    </p>
                  </div>
                  {testResult.questions.map((question, index) => (
                    <div key={index} className="space-y-2">
                      <p className="font-medium">
                        {index + 1}. {question.question}
                      </p>
                      <div className="space-y-1">
                        {shuffledOptions[index]?.map((optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`p-2 rounded ${
                              optionIndex === question.correctAnswer
                                ? 'bg-green-200 dark:bg-green-900/40'
                                : userAnswers[index]?.selectedOption ===
                                    optionIndex
                                  ? 'bg-red-200 dark:bg-red-900/40'
                                  : 'bg-gray-50 dark:bg-gray-800'
                            }`}
                          >
                            {String.fromCharCode(65 + optionIndex)}.{' '}
                            {question.options[optionIndex]}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button onClick={handleRetakeTest} className="w-full">
                      Retake Test
                    </Button>
                    <Button
                      onClick={() => setIsPublishModalOpen(true)}
                      className="w-full"
                      variant="secondary"
                    >
                      Publish Test
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {testResult && (
        <PublishTestModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          onPublish={handlePublishTest}
          testData={{
            questions: testResult.questions,
            extractedText: extractedText || '',
          }}
        />
      )}
    </div>
  );
}
