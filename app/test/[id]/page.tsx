'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { TestReviewForm } from '@/components/TestReviewForm';
import { ReviewsList } from '@/components/ReviewsList';
import { AverageRating } from '@/components/AverageRating';
import { use } from 'react';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
  };
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
  reviews: Review[];
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
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchTest = async () => {
      try {
        // First fetch the test data
        const { data: testData, error: testError } = await supabase
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

        if (testError) {
          throw new Error('Failed to fetch test');
        }

        if (!testData) {
          throw new Error('Test not found');
        }

        // Then fetch the reviews
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('test-reviews')
          .select(
            `
            id,
            rating,
            comment,
            created_at,
            user_id
          `
          )
          .eq('test_id', id);

        if (reviewsError) {
          console.error('Failed to fetch reviews:', reviewsError);
        } else {
          console.log('Fetched reviews:', reviewsData);
        }

        // Combine the data
        const combinedData = {
          ...testData,
          reviews: reviewsData || [],
        };

        console.log('Combined data:', combinedData);

        setTest(combinedData);
        setUserAnswers(
          testData.questions.map((_: Question, index: number) => ({
            questionIndex: index,
            selectedOption: null,
          }))
        );

        // Check if user has already reviewed this test
        const { data: reviewData, error: reviewError } = await supabase
          .from('test-reviews')
          .select('id')
          .eq('test_id', id)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .maybeSingle();

        if (!reviewError && reviewData) {
          setReviewSubmitted(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTest();
  }, [id]);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && test) {
        setIsCreator(user.id === test.user_id);
      }
    };

    checkUser();
  }, [test]);

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

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!test) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: review, error } = await supabase
        .from('test-reviews')
        .insert([
          {
            test_id: test.id,
            user_id: user.id,
            rating,
            comment,
          },
        ])
        .select(
          `
          id,
          rating,
          comment,
          created_at,
          user_id,
          profiles (
            id,
            full_name
          )
        `
        )
        .single();

      if (error) throw error;

      setTest((prev) =>
        prev
          ? {
              ...prev,
              reviews: [
                ...prev.reviews,
                {
                  id: review.id,
                  rating: review.rating,
                  comment: review.comment,
                  created_at: review.created_at,
                  user_id: review.user_id,
                  profiles: {
                    full_name: review.profiles[0].full_name,
                  },
                },
              ],
            }
          : null
      );

      setReviewSubmitted(true);
    } catch (error) {
      console.error('Error submitting review:', error);
    }
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
            <h1 className="text-3xl font-bold">{test.name}</h1>
            <p className="text-muted-foreground">
              {test.universities.name} • {test.classes.name}
            </p>
            <AverageRating reviews={test.reviews} />
          </div>
          <div className="flex gap-2">
            {isCreator && (
              <Button
                variant="outline"
                onClick={() => router.push(`/test/edit/${test.id}`)}
              >
                Edit Test
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push('/tests')}>
              Back to Tests
            </Button>
          </div>
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

        {/* Show reviews regardless of test completion */}
        {test.reviews && test.reviews.length > 0 && (
          <ReviewsList reviews={test.reviews} />
        )}

        {/* Show review form only after completing the test */}
        {showResults && !reviewSubmitted && (
          <TestReviewForm
            testId={test.id}
            onReviewSubmit={handleReviewSubmit}
          />
        )}
        {reviewSubmitted && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Thank you for your review!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
