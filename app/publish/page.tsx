'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/navbar';

const tagOptions = [
  'Algorithm',
  'Design',
  'Machine Learning',
  'Artificial Intelligence',
];

export default function PublishPage() {
  const router = useRouter();
  const [quizName, setQuizName] = useState('');
  const [course, setCourse] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizName.trim()) {
      setError('Quiz name is required');
      return;
    }
    setError('');
    console.log({ quizName, course, tags: selectedTags });
    router.push('/');
  };

  return (
    <div
      className="min-h-screen bg-no-repeat bg-cover bg-center flex items-center justify-center p-6"
      style={{ backgroundImage: "url('/publish-bg.png')" }}
    >
      <Navbar />
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-md border border-yellow-200 rounded-2xl p-6 shadow-xl">
        <h1 className="font-bold text-[48px] text-center mb-2 font-handdrawn font-love">
          Egg-cellent!
        </h1>
        <p className="text-center text-[20px] mb-8">
          You've completed the quiz. You may now publish your quiz for others to
          use.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Quiz Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-md"
              value={quizName}
              onChange={(e) => setQuizName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Course</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-md"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedTags.includes(tag)
                      ? 'bg-sky-300 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="border border-gray-400 px-6 py-2 rounded-full text-gray-600 hover:bg-gray-50"
            >
              Skip
            </button>
            <button
              type="submit"
              className="bg-sky-300 text-white px-6 py-2 rounded-full hover:bg-sky-400"
            >
              Publish
            </button>
          </div>
        </form>
      </div>

      <div className="absolute bottom-6 right-6 hidden sm:block">
        <Image
          src="/egg-character.png"
          alt="Egg character"
          width={200}
          height={200}
        />
      </div>
    </div>
  );
}
