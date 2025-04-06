'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { Session } from '@supabase/supabase-js';
import { generateTest } from '@/utils/testGenerator';
import { PublishTestModal } from '@/components/PublishTestModal';
import { publishTest, PublishTestData } from '@/utils/publishTest';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { convertFileToText } from '@/utils/fileConverter';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface TestResult {
  questions: Question[];
}

export default function EggSpertPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [numQuestions, setNumQuestions] = useState(10);
  const supabase = createClient();

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
  };

  const handleGenerateTest = async () => {
    if (!extractedText) {
      toast({
        title: 'Error',
        description: 'Please provide some text or upload a document first',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingTest(true);
    setError(null);

    try {
      const result = await generateTest(extractedText, numQuestions);
      setTestResult(result);

      // Store test data in session storage
      const testData = {
        questions: result.questions,
        extractedText: extractedText,
      };
      sessionStorage.setItem('currentTest', JSON.stringify(testData));

      // Navigate to quiz page
      router.push('/quiz');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while generating the test'
      );
      toast({
        title: 'Error',
        description: 'Failed to generate test. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingTest(false);
    }
  };

  const handlePublishTest = async (data: PublishTestData) => {
    if (!session?.user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to publish a test',
        variant: 'destructive',
      });
      return;
    }

    try {
      await publishTest(data);
      setIsPublishModalOpen(false);
      toast({
        title: 'Success',
        description: 'Test published successfully!',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error in handlePublishTest:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish test. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const text = await convertFileToText(file);
      setExtractedText(text);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to extract text from file'
      );
      toast({
        title: 'Error',
        description: 'Failed to extract text from file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start bg-white text-center relative"
      style={{
        backgroundImage: "url('/publish-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-white/50 -z-10" />

      <Navbar />
      <Image
        src="/black-star.png"
        alt="Sparkle"
        width={35}
        height={35}
        className="mb-2 pb-10 mt-[7rem]"
      />
      <h1 className="text-4xl font-love mb-2">Ask the Egg-spert</h1>
      <p className="text-gray-700 mb-10 text-lg">
        Upload your study materials and I'll create a quiz for you!
      </p>

      <Image
        src="/egg.png"
        alt="Egg character"
        width={200}
        height={200}
        className="mb-10"
      />

      <div className="w-full max-w-2xl">
        <div className="relative bg-white rounded-xl shadow-sm border p-2">
          <textarea
            value={extractedText || ''}
            onChange={(e) => setExtractedText(e.target.value)}
            placeholder="Type or paste your notes here..."
            className="w-full min-h-[100px] px-6 py-3 text-sm rounded-xl focus:outline-none resize-none"
            style={{ maxHeight: '400px', overflowY: 'auto' }}
          />
        </div>
      </div>
    </div>
  );
}
