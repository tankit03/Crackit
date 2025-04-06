'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import { signOutAction } from '@/app/actions';
import { createClient } from '@/utils/supabase/client';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUserName(
          session.user.user_metadata?.display_name ||
            session.user.email?.split('@')[0] ||
            'User'
        );
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await signOutAction();
  };

  return (
    <nav className="w-full sticky top-0 left-0 bg-white border-b shadow-sm z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo and Welcome Message */}
        <div className="flex items-center gap-4">
          <Link href="/eggspert" className="flex items-center">
            <Image
              src="/CrackItLogo.png"
              alt="CrackIt logo"
              width={45}
              height={20}
            />
          </Link>
          {/* User name - desktop */}
          <div className="hidden sm:block">
            <span className="text-lg font-semibold">
              Welcome, <span className="text-[#F2C76E]">{userName}</span>
            </span>
          </div>
        </div>

        {/* Mobile menu toggle */}
        <button onClick={() => setOpen(!open)} className="sm:hidden">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Desktop links */}
        <div className="hidden sm:flex space-x-6 text-sm font-medium items-center">
          <Link href="/eggspert" className="hover:text-yellow-600">
            Make Quiz
          </Link>
          <Link href="/tests" className="hover:text-yellow-600">
            All Quizzes
          </Link>
          <Link href="/saved-test" className="hover:text-yellow-600">
            Saved Quizzes
          </Link>
          <button
            onClick={handleLogout}
            className="hover:text-yellow-600 focus:outline-none"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden px-4 pb-4 flex flex-col gap-2 text-sm">
          {/* User name - mobile */}
          <div className="py-2 border-b">
            <span className="font-semibold">
              Welcome, <span className="text-[#F2C76E]">{userName}</span>
            </span>
          </div>
          <Link href="/eggspert" onClick={() => setOpen(false)}>
            Make Quiz
          </Link>
          <Link href="/tests" onClick={() => setOpen(false)}>
            All Quizzes
          </Link>
          <Link href="/saved-test" onClick={() => setOpen(false)}>
            Saved Quizzes
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              handleLogout();
            }}
            className="text-left hover:text-yellow-600 focus:outline-none"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
