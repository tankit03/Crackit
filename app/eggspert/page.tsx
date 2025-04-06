"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Send, Paperclip } from "lucide-react";
import Navbar from "@/components/navbar";

export default function EggSpertPage() {
  const [input, setInput] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // You could save notes to state, session, or API here
    router.push("/quiz");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-white p-6 text-center pt-8"
    style={{ backgroundImage: "url('/publish-bg.png')" }}>
        <Navbar/>
        <Image
        src="/black-star.png" // make sure this image is in your public folder
        alt="Sparkle"
        width={35}
        height={35}
        className="mb-2 pb-10 mt-[7rem]" 
      />
      <h1 className="text-4xl font-love mb-2">Ask the Egg-spert</h1>
      <p className="text-gray-700 mb-10 text-lg">Type your notes or submit a pdf</p>

      <Image
        src="/egg.png"
        alt="Egg character"
        width={200}
        height={200}
        className="mb-10"
      />

    <form
          onSubmit={handleSubmit}
          className="w-full max-w-2xl flex items-center bg-white rounded-xl shadow-sm border p-2 mt-[3rem]"
        >
          <input
            type="text"
            placeholder="Provide me with your notes"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow px-6 py-3 text-sm rounded-l-xl focus:outline-none"
          />
          <button
            type="button"
            className="text-sky-400 hover:text-sky-500 px-3"
          >
            <Paperclip className="w-6 h-6" />
          </button>
          <button
            type="submit"
            className="text-sky-400 hover:text-sky-500 px-3"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
    </div>
  );
}
