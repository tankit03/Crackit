"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="w-full fixed top-0 left-0 bg-white border-b shadow-sm z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo as PNG */}
        <Link href="/" className="flex items-center">
          <Image
            src="/CrackItLogo.png" // your logo file
            alt="CrackIt logo"
            width={45
            }             // adjust as needed
            height={20}
          />
        </Link>

        {/* Mobile menu toggle */}
        <button onClick={() => setOpen(!open)} className="sm:hidden">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Desktop links */}
        <div className="hidden sm:flex space-x-6 text-sm font-medium">
          <Link href="/" className="hover:text-yellow-600">
            Home
          </Link>
          <Link href="/quiz" className="hover:text-yellow-600">
            Quiz
          </Link>
          <Link href="/publish" className="hover:text-yellow-600">
            Publish
          </Link>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden px-4 pb-4 flex flex-col gap-2 text-sm">
          <Link href="/" onClick={() => setOpen(false)}>
            Home
          </Link>
          <Link href="/quiz" onClick={() => setOpen(false)}>
            Quiz
          </Link>
          <Link href="/publish" onClick={() => setOpen(false)}>
            Publish
          </Link>
        </div>
      )}
    </nav>
  );
}