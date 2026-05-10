"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { href: "#menu", label: "Our Menu" },
  { href: "#about", label: "About" },
  { href: "#gallery", label: "Gallery" },
  { href: "/order", label: "Order a Cake" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-rose-blush">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-xl text-warm-brown tracking-tight"
        >
          Jenny&apos;s Sugar Shack
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-warm-brown/70 hover:text-warm-brown transition-colors duration-150 tracking-wide"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <Link href="/order" className="hidden md:block btn-primary">
          Order Now
        </Link>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-1"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span
            className={`block w-5 h-0.5 bg-warm-brown transition-transform duration-200 ${open ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`block w-5 h-0.5 bg-warm-brown transition-opacity duration-200 ${open ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-5 h-0.5 bg-warm-brown transition-transform duration-200 ${open ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <nav className="md:hidden border-t border-rose-blush bg-cream px-6 py-4 flex flex-col gap-4">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-warm-brown/70 hover:text-warm-brown"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
