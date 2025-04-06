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
import { BookmarkIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string;
  profiles: { full_name: string }[];
}

interface Test {
  id: number;
  name: string;
  description: string;
  questions: Question[];
  created_at: string;
  university_id: number;
  class_id: number;
  tags: string;
  universities: { name: string };
  classes: { name: string };
  reviews: Review[];
  tag_names: { name: string }[];
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
  const [isSaved, setIsSaved] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();
  const { toast } = useToast();

  const tagColors = [
    { bg: 'bg-blue-100', text: 'text-blue-800' },
    { bg: 'bg-green-100', text: 'text-green-800' },
    { bg: 'bg-purple-100', text: 'text-purple-800' },
    { bg: 'bg-pink-100', text: 'text-pink-800' },
    { bg: 'bg-amber-100', text: 'text-amber-800' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    { bg: 'bg-rose-100', text: 'text-rose-800' },
    { bg: 'bg-teal-100', text: 'text-teal-800' },
  ];

  // Get a consistent color for a tag based on its name
  const getTagColor = (tagName: string) => {
    const index =
      tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      tagColors.length;
    return tagColors[index];
  };

  // Parse tags string to array
  const parseTagIds = (tagsString: string): number[] => {
    try {
      if (!tagsString || tagsString.trim() === '') {
        return [];
      }
      const parsed =
        typeof tagsString === 'string' ? JSON.parse(tagsString) : tagsString;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error parsing tags:', e);
      return [];
    }
  };

  // Fetch saved state
  const fetchSavedState = async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('user-saved-tests')
        .select('test_id')
        .eq('user_id', currentUserId)
        .eq('test_id', id)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch saved state:', error);
        return;
      }

      setIsSaved(!!data);
    } catch (err) {
      console.error('Error fetching saved state:', err);
    }
  };

  // Toggle save state
  const toggleSaveTest = async () => {
    if (!currentUserId) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save tests',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isSaved) {
        // Unsave test
        const { error } = await supabase
          .from('user-saved-tests')
          .delete()
          .eq('user_id', currentUserId)
          .eq('test_id', id);

        if (error) throw error;
        setIsSaved(false);
        toast({
          title: 'Success',
          description: 'Test removed from saved tests',
          variant: 'default',
        });
      } else {
        // Save test
        const { error } = await supabase.from('user-saved-tests').insert([
          {
            user_id: currentUserId,
            test_id: id,
          },
        ]);

        if (error) throw error;
        setIsSaved(true);
        toast({
          title: 'Success',
          description: 'Test saved successfully',
          variant: 'default',
        });
      }
    } catch (err) {
      console.error('Error in toggleSaveTest:', err);
      toast({
        title: 'Error',
        description: 'Failed to save/unsave test. Please try again.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const fetchTest = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }

        // First fetch the test data
        const { data: testData, error: testError } = await supabase
          .from('test')
          .select(
            `
            *,
            universities!test_university_id_fkey (
              name
            ),
            classes!test_class_id_fkey (
              name
            )
          `
          )
          .eq('id', id)
          .single();

        if (testError) {
          console.error('Failed to fetch test:', testError);
          throw new Error('Failed to fetch test');
        }

        if (!testData) {
          throw new Error('Test not found');
        }

        // Parse and fetch tag names for the test
        const tagIds = parseTagIds(testData.tags);
        if (tagIds.length > 0) {
          const { data: tagData, error: tagError } = await supabase
            .from('tags')
            .select('name')
            .in('id', tagIds);

          if (tagError) {
            console.error('Failed to fetch tags:', tagError);
          }

          // Combine the data
          const combinedData = {
            ...testData,
            tag_names: tagData || [],
          };

          setTest(combinedData);
        } else {
          setTest({ ...testData, tag_names: [] });
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
        }

        // Fetch user names for the reviews
        let reviewsWithUsers: Review[] = [];
        if (reviewsData && reviewsData.length > 0) {
          const userIds = reviewsData.map((review) => review.user_id);
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);

          if (userError) {
            console.error('Failed to fetch user data:', userError);
          }

          // Combine review data with user data
          reviewsWithUsers = reviewsData.map((review) => {
            const user = userData?.find((user) => user.id === review.user_id);
            const reviewObj: Review = {
              id: Number(review.id),
              rating: Number(review.rating),
              comment: String(review.comment),
              created_at: String(review.created_at),
              user_id: String(review.user_id),
              profiles: [
                {
                  full_name: user?.full_name || 'Anonymous',
                },
              ],
            };
            return reviewObj;
          });
        }

        // Update test with reviews
        setTest((prev) => {
          if (!prev) return null;
          const updatedTest: Test = {
            ...prev,
            reviews: reviewsWithUsers,
          };
          return updatedTest;
        });

        setUserAnswers(
          testData.questions.map((_: Question, index: number) => ({
            questionIndex: index,
            selectedOption: null,
          }))
        );

        // Check if user has already reviewed this test
        if (user) {
          const { data: reviewData, error: reviewError } = await supabase
            .from('test-reviews')
            .select('id')
            .eq('test_id', id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (!reviewError && reviewData) {
            setReviewSubmitted(true);
          }
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
    if (currentUserId) {
      fetchSavedState();
    }
  }, [currentUserId]);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F2C76E] border-t-transparent"></div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="bg-red-50 dark:bg-red-900/20 max-w-md w-full">
          <CardContent className="pt-6">
            <p className="text-red-500 dark:text-red-400 text-center">
              {error || 'Test not found'}
            </p>
            <div className="flex justify-center mt-4">
              <Button
                onClick={() => router.push('/tests')}
                className="bg-[#F2C76E] hover:bg-[#E5B85B] text-white"
              >
                Back to Tests
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Test Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 relative">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {test.name}
              </h1>
              <div className="flex items-center text-sm text-gray-600 mb-4 space-x-2">
                <span className="bg-gray-100 px-3 py-1 rounded-full">
                  {test.universities?.name}
                </span>
                <span>•</span>
                <span className="bg-gray-100 px-3 py-1 rounded-full">
                  {test.classes?.name}
                </span>
              </div>
              {test.description && (
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {test.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {test.tag_names?.map((tag) => {
                  const { bg, text } = getTagColor(tag.name);
                  return (
                    <span
                      key={tag.name}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${bg} ${text}`}
                    >
                      {tag.name}
                    </span>
                  );
                })}
              </div>
            </div>
            <button
              onClick={toggleSaveTest}
              className="p-2.5 rounded-full hover:bg-[#F5E6D0] transition-colors duration-200 ml-4"
              title={isSaved ? 'Unsave Test' : 'Save Test'}
            >
              <BookmarkIcon
                className={`h-6 w-6 ${isSaved ? 'text-[#F2C76E] fill-[#F2C76E]' : 'text-[#F2C76E]'}`}
              />
            </button>
          </div>
        </div>

        {/* Progress Bar (when taking test) */}
        {!showResults && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress:{' '}
                {userAnswers.filter((a) => a.selectedOption !== null).length} of{' '}
                {test.questions.length} questions answered
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(
                  (userAnswers.filter((a) => a.selectedOption !== null).length /
                    test.questions.length) *
                    100
                )}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#F2C76E] h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(userAnswers.filter((a) => a.selectedOption !== null).length / test.questions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Test Content */}
        <div className="space-y-6">
          {!showResults ? (
            // Questions
            test.questions.map((question, index) => (
              <Card
                key={index}
                className="bg-white overflow-hidden border border-gray-100"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#F5E6D0] rounded-full flex items-center justify-center">
                      <span className="text-[#F2C76E] font-semibold">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {question.question}
                      </h3>
                      <div className="space-y-3">
                        {question.options.map((option, optionIndex) => (
                          <button
                            key={optionIndex}
                            onClick={() =>
                              handleAnswerSelect(index, optionIndex)
                            }
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                              userAnswers[index]?.selectedOption === optionIndex
                                ? 'border-[#F2C76E] bg-[#F5E6D0] shadow-inner'
                                : 'border-gray-200 hover:border-[#F2C76E] hover:bg-[#F5E6D0]/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                  userAnswers[index]?.selectedOption ===
                                  optionIndex
                                    ? 'border-[#F2C76E] bg-[#F2C76E]'
                                    : 'border-gray-300'
                                }`}
                              >
                                {userAnswers[index]?.selectedOption ===
                                  optionIndex && (
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                )}
                              </div>
                              <span
                                className={`${userAnswers[index]?.selectedOption === optionIndex ? 'font-medium' : ''}`}
                              >
                                {option}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // Results
            <Card className="bg-white border border-gray-100">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Test Results
                </h2>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-[#F5E6D0] mb-4">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-[#F2C76E]">
                        {calculateScore()}
                      </p>
                      <p className="text-sm text-gray-600">
                        out of {test.questions.length}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg text-gray-600">
                    Score:{' '}
                    {((calculateScore() / test.questions.length) * 100).toFixed(
                      1
                    )}
                    %
                  </p>
                </div>
                <div className="space-y-6">
                  {test.questions.map((question, index) => {
                    const isCorrect =
                      userAnswers[index]?.selectedOption ===
                      question.correctAnswer;
                    return (
                      <div
                        key={index}
                        className={`p-6 rounded-lg border ${
                          isCorrect
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              isCorrect ? 'bg-green-100' : 'bg-red-100'
                            }`}
                          >
                            <span
                              className={`font-semibold ${
                                isCorrect ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 mb-3">
                              {question.question}
                            </p>
                            <div className="space-y-2">
                              <p
                                className={`text-sm ${isCorrect ? 'text-green-600' : 'text-gray-600'}`}
                              >
                                Correct Answer:{' '}
                                {question.options[question.correctAnswer]}
                              </p>
                              {!isCorrect && (
                                <p className="text-sm text-red-600">
                                  Your Answer:{' '}
                                  {
                                    question.options[
                                      userAnswers[index]?.selectedOption || 0
                                    ]
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={handleRetakeTest}
                    className="bg-[#F2C76E] hover:bg-[#E5B85B] text-white px-6 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow"
                  >
                    Retake Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!showResults && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleSubmitTest}
                className="bg-[#F2C76E] hover:bg-[#E5B85B] text-white px-8 py-3 rounded-lg shadow-sm transition-all duration-200 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={userAnswers.some(
                  (answer) => answer.selectedOption === null
                )}
              >
                Submit Test
              </Button>
            </div>
          )}

          {/* Reviews Section */}
          <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>
            <div className="mb-8">
              <AverageRating reviews={test.reviews} />
            </div>
            {!reviewSubmitted && !isCreator && (
              <div className="mb-8 border-b pb-8">
                <TestReviewForm
                  testId={test.id}
                  onReviewSubmit={handleReviewSubmit}
                />
              </div>
            )}
            <ReviewsList reviews={test.reviews} />
          </div>
        </div>
      </div>
    </div>
  );
}
