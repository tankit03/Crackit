'use client';

import { useState } from 'react';
import { PdfToTextConverter } from '@/components/PdfToTextConverter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreateTestPage() {
  const [extractedText, setExtractedText] = useState<string>('');
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);

  const handleTextExtracted = (text: string) => {
    setExtractedText(text);
  };

  const handleGenerateTest = async () => {
    if (!extractedText) return;

    setIsGeneratingTest(true);
    try {
      // Here you would call your LLM API to generate the test
      // For example:
      // const response = await fetch('/api/generate-test', {
      //   method: 'POST',
      //   body: JSON.stringify({ text: extractedText }),
      // });
      // const test = await response.json();

      console.log('Would generate test from:', extractedText);
    } catch (error) {
      console.error('Failed to generate test:', error);
    } finally {
      setIsGeneratingTest(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Create Test from PDF</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <PdfToTextConverter onTextExtracted={handleTextExtracted} />

        <Card>
          <CardHeader>
            <CardTitle>Extracted Text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {extractedText ? (
              <>
                <div className="max-h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
                    {extractedText}
                  </pre>
                </div>
                <Button
                  onClick={handleGenerateTest}
                  disabled={isGeneratingTest}
                  className="w-full"
                >
                  {isGeneratingTest ? 'Generating Test...' : 'Generate Test'}
                </Button>
              </>
            ) : (
              <p className="text-gray-500">Upload a PDF to extract its text</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
