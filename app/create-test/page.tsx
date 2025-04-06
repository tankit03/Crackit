'use client';

import { useState } from 'react';
import { PdfToTextConverter } from '@/components/PdfToTextConverter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateTest } from '@/utils/testGenerator';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number; // Index of the correct answer (0-3)
}

interface TestResult {
  questions: Question[];
}

export default function CreateTestPage() {
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTextExtracted = (text: string) => {
    setExtractedText(text);
    setTestResult(null);
    setError(null);
  };

  const handleGenerateTest = async () => {
    if (!extractedText) return;

    setIsGeneratingTest(true);
    setError(null);

    try {
      const result = await generateTest(extractedText);
      setTestResult(result);
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

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <PdfToTextConverter onTextExtracted={handleTextExtracted} />
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
          {testResult && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Test</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {testResult.questions.map((question, index) => (
                    <div key={index} className="space-y-2">
                      <p className="font-medium">
                        {index + 1}. {question.question}
                      </p>
                      <div className="space-y-1">
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`p-2 rounded ${
                              optionIndex === question.correctAnswer
                                ? 'bg-green-50 dark:bg-green-900/20'
                                : 'bg-gray-50 dark:bg-gray-800'
                            }`}
                          >
                            {String.fromCharCode(65 + optionIndex)}. {option}
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
  );
}
