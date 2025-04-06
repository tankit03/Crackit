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
import { regenerateQuestions } from '@/utils/regenerateQuestions';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import FileUploader from '@/components/FileUploader';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface TestResult {
  questions: Question[];
}

interface UserAnswer {
  questionIndex: number;
  selectedOption: number | null;
}

export default function CreateTestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const supabase = createClient();
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
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
  };

  const handleGenerateTest = async () => {
    if (!extractedText) return;

    setIsGeneratingTest(true);
    setError(null);

    try {
      const result = await generateTest(extractedText);
      setTestResult(result);
      setUserAnswers(
        result.questions.map((_, index) => ({
          questionIndex: index,
          selectedOption: null,
        }))
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
      return score + (answer.selectedOption === question.correctAnswer ? 1 : 0);
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
    setShowResults(false);
  };

  const handlePublishTest = async (data: PublishTestData) => {
    try {
      if (!session?.user) {
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

        setSession(currentSession);
        try {
          await publishTest(data, currentSession.user.id);
          setIsPublishModalOpen(false);
        } catch (error) {
          throw new Error(
            'Failed to publish test: ' + (error as Error).message
          );
        }
      } else {
        try {
          await publishTest(data, session.user.id);
          setIsPublishModalOpen(false);
        } catch (error) {
          throw new Error(
            'Failed to publish test: ' + (error as Error).message
          );
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

  const handleRegenerateQuestion = async (index: number) => {
    if (
      !extractedText ||
      !testResult?.questions ||
      testResult.questions.length === 0
    ) {
      toast({
        title: 'Error',
        description: 'Please enter text and generate initial questions first',
        variant: 'destructive',
      });
      return;
    }

    setIsRegenerating(true);
    try {
      const [newQuestion] = await regenerateQuestions({
        text: extractedText,
        existingQuestions: testResult.questions,
        questionIndex: index,
      });

      const updatedQuestions = [...testResult.questions];
      updatedQuestions[index] = newQuestion;

      setTestResult({ questions: updatedQuestions });
      setUserAnswers((prev) => {
        const newAnswers = [...prev];
        newAnswers[index] = {
          questionIndex: index,
          selectedOption: null,
        };
        return newAnswers;
      });

      toast({
        title: 'Success',
        description: 'Question regenerated successfully',
      });
    } catch (error) {
      console.error('Error regenerating question:', error);
      toast({
        title: 'Error',
        description: 'Failed to regenerate question',
        variant: 'destructive',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto py-8">
        <Card className="bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <p className="text-red-500 dark:text-red-400">
              You must be logged in to create a test
            </p>
            <Button onClick={() => router.push('/login')} className="mt-4">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <div className="container mx-auto py-8">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold">Create Test</h1>
            <p className="text-muted-foreground">
              Enter your text and generate test questions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Enter Text</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FileUploader onTextExtracted={setExtractedText} />
                  <textarea
                    className="w-full h-64 p-4 border rounded-md"
                    value={extractedText || ''}
                    onChange={(e) => setExtractedText(e.target.value)}
                    placeholder="Paste your text here or upload a file..."
                  />
                </CardContent>
              </Card>
            </div>

            <div>
              {testResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Generated Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {testResult.questions.map((question, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-start">
                            <p className="font-medium">
                              {index + 1}. {question.question}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRegenerateQuestion(index)}
                              disabled={isRegenerating}
                            >
                              {isRegenerating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Regenerate'
                              )}
                            </Button>
                          </div>
                          <div className="space-y-1">
                            {question.options.map((option, optionIndex) => (
                              <div
                                key={optionIndex}
                                className={`p-2 rounded ${
                                  userAnswers[index]?.selectedOption ===
                                  optionIndex
                                    ? 'bg-blue-100 dark:bg-blue-900/30'
                                    : 'bg-gray-50 dark:bg-gray-800'
                                }`}
                                onClick={() => {
                                  const newAnswers = [...userAnswers];
                                  newAnswers[index] = {
                                    questionIndex: index,
                                    selectedOption: optionIndex,
                                  };
                                  setUserAnswers(newAnswers);
                                }}
                              >
                                {option}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
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
    </>
  );
}
