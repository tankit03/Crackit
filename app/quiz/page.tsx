"use client";

import { useState } from 'react';
import Image from 'next/image';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function QuizPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null); // null = unanswered
  const totalQuestions = 10;
  const { width, height } = useWindowSize();

  const questionData = {
    question: `This is a very important question that you must be able to answer?`,
    answers: ['Answer One', 'Answer Two', 'Answer Three', 'Answer Four'],
    correctIndex: 2,
  };

  const progressPercent = (currentQuestion / totalQuestions) * 100;

  const handleCheck = () => {
    const isAnswerCorrect = currentQuestion == 4;
    // const isAnswerCorrect = selected === questionData.correctIndex;
    setIsCorrect(isAnswerCorrect);
  };

  const handleContinue = () => {
    if (currentQuestion === totalQuestions) {
      router.push("/publish");
    } else {
      setIsCorrect(null);
      setSelected(null);
      setCurrentQuestion((prev) => Math.min(prev + 1, totalQuestions));
    }
  };  

  return (
    <div className="min-h-screen bg-white p-6 relative flex items-center justify-center">
      {/* Sidebar/Menu */}
      <Navbar />

      {/* Centered Content */}
      <div className="flex flex-col items-center w-full max-w-3xl px-4 sm:px-6 space-y-16">
        {/* Progress */}
        <div className="w-full text-center">
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div
              className="bg-yellow-300 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-gray-400 text-sm">
            {currentQuestion}/{totalQuestions}
          </p>
        </div>

        {/* Question Card */}
        <div className="w-full">
          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
            Multiple Choice
          </span>
          <h2 className="text-2xl font-semibold mt-4">
            {questionData.question}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {questionData.answers.map((answer, index) => (
              <button
                key={index}
                onClick={() => setSelected(index)}
                className={`border rounded-xl px-6 py-4 text-left transition ${
                  selected === index ? 'bg-yellow-100 border-yellow-400' : 'bg-gray-100 border-transparent'
                }`}
              >
                {answer}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
            <button className="border border-gray-300 rounded-full px-6 py-2 text-gray-600 hover:bg-gray-50 w-full sm:w-auto">
              Skip
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

      {/* ✅ Success Feedback */}
      {isCorrect === true && (
        <>
          <Confetti width={width} height={height} recycle={false} numberOfPieces={300} />
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
                  <h3 className="font-bold text-[48px] mb-2 pb-4 pt-2 font-love">You Cracked It!</h3>
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

      {/* ❌ Failure Feedback */}
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
              <h3 className="font-bold text-[48px] mb-2 pb-4 pt-2 font-love">You're Fried!</h3>
                <p>
                  Lorem ipsum dolor sit amet consectetur. Lectus ut morbi dolor in
                  vehicula sem magna facilisi. Non et amet viverra id eget malesuada et pulvinar.
                  Lorem ipsum dolor sit amet consectetur. Lectus ut morbi dolor in
                  vehicula sem magna facilisi. Non et amet viverra id eget malesuada et pulvinar.
                  Lorem ipsum dolor sit amet consectetur. Lectus ut morbi dolor in
                  vehicula sem magna facilisi. Non et amet viverra id eget malesuada et pulvinar.
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
