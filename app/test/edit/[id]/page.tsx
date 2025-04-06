'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { use } from 'react';

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

export default function EditTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError('You must be logged in to edit a test');
          setIsLoading(false);
          return;
        }

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

        // Check if the current user is the creator of the test
        if (data.user_id !== user.id) {
          setError('You are not authorized to edit this test');
          setIsLoading(false);
          return;
        }

        setTest(data);
        setIsAuthorized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTest();
  }, [id]);

  const handleQuestionChange = (
    index: number,
    field: keyof Question,
    value: string | string[] | number
  ) => {
    if (!test) return;

    setTest({
      ...test,
      questions: test.questions.map((question, i) => {
        if (i === index) {
          return {
            ...question,
            [field]: value,
          };
        }
        return question;
      }),
    });
  };

  const handleOptionChange = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    if (!test) return;

    const newOptions = [...test.questions[questionIndex].options];
    newOptions[optionIndex] = value;

    handleQuestionChange(questionIndex, 'options', newOptions);
  };

  const handleUpdateTest = async () => {
    if (!test) return;

    try {
      const { error: updateError } = await supabase
        .from('test')
        .update({
          questions: test.questions,
        })
        .eq('id', test.id);

      if (updateError) {
        throw new Error('Failed to update test');
      }

      router.push(`/test/${test.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
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
            <h1 className="text-3xl font-bold">Edit Test: {test.name}</h1>
            <p className="text-muted-foreground">
              {test.universities.name} • {test.classes.name}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/test/${test.id}`)}
          >
            Back to Test
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {test.questions.map((question, index) => (
                <div key={index} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`question-${index}`}>
                      Question {index + 1}
                    </Label>
                    <Textarea
                      id={`question-${index}`}
                      value={question.question}
                      onChange={(e) =>
                        handleQuestionChange(index, 'question', e.target.value)
                      }
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Options</Label>
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className="flex items-center gap-2"
                      >
                        <Input
                          value={option}
                          onChange={(e) =>
                            handleOptionChange(
                              index,
                              optionIndex,
                              e.target.value
                            )
                          }
                          className="flex-1"
                        />
                        <Button
                          variant={
                            question.correctAnswer === optionIndex
                              ? 'default'
                              : 'outline'
                          }
                          onClick={() =>
                            handleQuestionChange(
                              index,
                              'correctAnswer',
                              optionIndex
                            )
                          }
                        >
                          Correct
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/test/${test.id}`)}
          >
            Cancel
          </Button>
          <Button onClick={handleUpdateTest}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
