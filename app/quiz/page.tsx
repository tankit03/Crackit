'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import { PublishTestModal } from '@/components/PublishTestModal';
import { toast } from '@/components/ui/use-toast';
import { publishTest } from '@/utils/publishTest';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface TestData {
  questions: Question[];
  extractedText: string;
}

export default function QuizPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [testData, setTestData] = useState<TestData | null>(null);
  const { width, height } = useWindowSize();

  useEffect(() => {
    // Get test data from session storage
    const storedTest = sessionStorage.getItem('currentTest');
    if (!storedTest) {
      router.push('/eggspert');
      return;
    }
    setTestData(JSON.parse(storedTest));
  }, [router]);

  if (!testData) {
    return (
      <div className="min-h-screen bg-white p-6 relative flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Loading test...</h2>
        </div>
      </div>
    );
  }

  const { questions, extractedText } = testData;
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const score = answers.filter(Boolean).length;
  const scorePercent = Math.round((score / totalQuestions) * 100);

  const handleCheck = () => {
    if (selected === null) return;
    const isAnswerCorrect = selected === currentQuestion.correctAnswer;
    setIsCorrect(isAnswerCorrect);
    setAnswers((prev) => [...prev, isAnswerCorrect]);
  };

  const handleContinue = () => {
    if (currentQuestionIndex === totalQuestions - 1) {
      // Show score summary instead of publishing immediately
      setIsCorrect(null);
      setSelected(null);
    } else {
      setIsCorrect(null);
      setSelected(null);
      setCurrentQuestionIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
    }
  };

  const handleRetakeTest = () => {
    setCurrentQuestionIndex(0);
    setSelected(null);
    setIsCorrect(null);
    setAnswers([]);
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-white p-6 relative flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <h2 className="text-2xl font-semibold">No questions available</h2>
          <button
            onClick={() => router.push('/eggspert')}
            className="mt-4 bg-yellow-400 text-white px-6 py-2 rounded-full hover:bg-yellow-500"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Show score summary if all questions are answered
  if (answers.length === totalQuestions) {
    return (
      <div className="min-h-screen bg-white p-6 relative flex items-center justify-center">
        <Navbar />
        <div className="flex flex-col items-center w-full max-w-3xl px-4 sm:px-6 space-y-8">
          <Image
            src={scorePercent >= 70 ? '/cracked-egg.png' : '/fried-egg.png'}
            alt={scorePercent >= 70 ? 'Cracked Egg' : 'Fried Egg'}
            width={300}
            height={300}
            className="mb-8"
          />

          <h2 className="text-4xl font-love mb-4">
            {scorePercent >= 70 ? 'You Cracked It!' : "You're Fried!"}
          </h2>

          <div className="text-center">
            <p className="text-2xl font-semibold mb-2">Your Score</p>
            <p className="text-6xl font-bold text-yellow-500 mb-4">
              {scorePercent}%
            </p>
            <p className="text-gray-600">
              {score} out of {totalQuestions} questions correct
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={handleRetakeTest}
              className="bg-yellow-400 text-white px-6 py-2 rounded-full hover:bg-yellow-500"
            >
              Take Again
            </button>
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600"
            >
              Publish Test
            </button>
          </div>
        </div>

        {isPublishModalOpen && (
          <PublishTestModal
            isOpen={isPublishModalOpen}
            onClose={() => setIsPublishModalOpen(false)}
            onPublish={async (data) => {
              try {
                await publishTest(data);
                setIsPublishModalOpen(false);
                toast({
                  title: 'Success',
                  description: 'Test published successfully!',
                  variant: 'default',
                });
                // Clear the test data from session storage
                sessionStorage.removeItem('currentTest');
                router.push('/tests');
              } catch (error) {
                console.error('Error publishing test:', error);
                toast({
                  title: 'Error',
                  description:
                    error instanceof Error
                      ? error.message
                      : 'Failed to publish test. Please try again.',
                  variant: 'destructive',
                });
              }
            }}
            testData={{
              questions: questions,
              extractedText: extractedText,
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 relative flex items-center justify-center">
      <Navbar />

      <div className="flex flex-col items-center w-full max-w-3xl px-4 sm:px-6 space-y-16">
        <div className="w-full text-center">
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div
              className="bg-yellow-300 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-gray-400 text-sm">
            {currentQuestionIndex + 1}/{totalQuestions}
          </p>
        </div>

        <div className="w-full">
          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
            Multiple Choice
          </span>
          <h2 className="text-2xl font-semibold mt-4">
            {currentQuestion.question}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelected(index)}
                className={`border rounded-xl px-6 py-4 text-left transition ${
                  selected === index
                    ? 'bg-yellow-100 border-yellow-400'
                    : 'bg-gray-100 border-transparent'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
            <button
              onClick={() => router.push('/eggspert')}
              className="border border-gray-300 rounded-full px-6 py-2 text-gray-600 hover:bg-gray-50 w-full sm:w-auto"
            >
              Back
            </button>
            <button
              onClick={handleCheck}
              className="bg-yellow-400 text-white px-6 py-2 rounded-full hover:bg-yellow-500 w-full sm:w-auto"
              disabled={selected === null}
            >
              Check
            </button>
          </div>
        </div>
      </div>

      {isCorrect === true && (
        <>
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={300}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-white/80 px-4">
            <Image
              src="/cracked-egg.png"
              alt="Cracked Egg"
              width={300}
              height={300}
              className="mb-12"
            />
            <div className="fixed bottom-0 w-full bg-green-100 text-green-900 text-sm p-6 shadow-inner">
              <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <h3 className="font-bold text-[48px] mb-2 pb-4 pt-2 font-love">
                    You Cracked It!
                  </h3>
                </div>
                <button
                  onClick={handleContinue}
                  className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 whitespace-nowrap"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {isCorrect === false && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-white/80 px-4">
          <Image
            src="/fried-egg.png"
            alt="Fried Egg"
            width={400}
            height={400}
            className="mb-12"
          />
          <div className="fixed bottom-0 w-full bg-red-200 text-red-900 text-sm p-6 shadow-inner">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h3 className="font-bold text-[48px] mb-2 pb-4 pt-2 font-love">
                  You're Fried!
                </h3>
                <p>
                  Don't worry! Keep trying and you'll get it right. Remember,
                  every mistake is a learning opportunity.
                </p>
              </div>
              <button
                onClick={handleContinue}
                className="bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600 whitespace-nowrap"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
