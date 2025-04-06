'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Test {
  id: number;
  name: string;
  questions: Question[];
  created_at: string;
  user_id: string;
  university_id: number;
  class_id: number;
  tags: string;
  description?: string;
  universities: {
    name: string;
  };
  classes: {
    name: string;
  };
}

interface UserAnswer {
  questionIndex: number;
  selectedOption: number | null;
}

export default function TestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('test')
          .select(
            `
            *,
            universities (
              name
            ),
            classes (
              name
            )
          `
          )
          .eq('id', id)
          .single();

        if (fetchError) {
          throw new Error('Failed to fetch test');
        }

        if (!data) {
          throw new Error('Test not found');
        }

        setTest(data);
        setUserAnswers(
          data.questions.map((_: Question, index: number) => ({
            questionIndex: index,
            selectedOption: null,
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTest();
  }, [id]);

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    if (showResults) return;

    setUserAnswers((prev) =>
      prev.map((answer) =>
        answer.questionIndex === questionIndex
          ? { ...answer, selectedOption: optionIndex }
          : answer
      )
    );
  };

  const calculateScore = () => {
    if (!test) return 0;
    return userAnswers.reduce((score, answer) => {
      const question = test.questions[answer.questionIndex];
      return score + (answer.selectedOption === question.correctAnswer ? 1 : 0);
    }, 0);
  };

  const handleSubmitTest = () => {
    setShowResults(true);
  };

  const handleRetakeTest = () => {
    if (!test) return;
    setUserAnswers(
      test.questions.map((_, index) => ({
        questionIndex: index,
        selectedOption: null,
      }))
    );
    setShowResults(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="container mx-auto py-8">
        <Card className="bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <p className="text-red-500 dark:text-red-400">
              {error || 'Test not found'}
            </p>
            <Button onClick={() => router.push('/tests')} className="mt-4">
              Back to Tests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">
              {test.name || 'Untitled Test'}
            </h1>
            <div className="text-sm text-muted-foreground mt-2">
              {test.universities?.name} • {test.classes?.name} •{' '}
              {formatDate(test.created_at)}
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push('/tests')}>
            Back to Tests
          </Button>
        </div>

        {test.description && (
          <Card>
            <CardContent className="pt-6">
              <p>{test.description}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {test.questions.map((question, index) => (
                <div key={index} className="space-y-4">
                  <p className="font-medium">
                    {index + 1}. {question.question}
                  </p>
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        onClick={() => handleAnswerSelect(index, optionIndex)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          showResults
                            ? optionIndex === question.correctAnswer
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : userAnswers[index]?.selectedOption ===
                                  optionIndex
                                ? 'bg-red-100 dark:bg-red-900/30'
                                : 'bg-gray-50 dark:bg-gray-800'
                            : userAnswers[index]?.selectedOption === optionIndex
                              ? 'bg-blue-100 dark:bg-blue-900/30'
                              : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {String.fromCharCode(65 + optionIndex)}. {option}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-6">
                {!showResults ? (
                  <Button
                    onClick={handleSubmitTest}
                    disabled={
                      !userAnswers.every((a) => a.selectedOption !== null)
                    }
                    className="w-full"
                  >
                    Submit Test
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        Score: {calculateScore()} / {test.questions.length}
                      </p>
                      <p className="text-muted-foreground">
                        {Math.round(
                          (calculateScore() / test.questions.length) * 100
                        )}
                        %
                      </p>
                    </div>
                    <Button onClick={handleRetakeTest} className="w-full">
                      Retake Test
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
