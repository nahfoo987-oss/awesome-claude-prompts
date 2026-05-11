"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

const navLinks = [
  { href: "#menu", label: "Menu" },
  { href: "#about", label: "About" },
  { href: "#gallery", label: "Gallery" },
  { href: "#merch", label: "Merch" },
  { href: "/order", label: "Order" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 70);
  });

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? "rgba(255,255,255,0.94)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(252,231,243,0.8)"
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: scrolled ? "0 1px 20px rgba(0,0,0,0.06)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-xl tracking-tight transition-colors duration-300"
          style={{ color: scrolled ? "#3b1a47" : "white" }}
        >
          Jenny&apos;s Sugar Shack
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm tracking-wide transition-colors duration-200 hover:opacity-100"
              style={{
                color: scrolled ? "rgba(59,26,71,0.55)" : "rgba(255,255,255,0.65)",
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/order"
          className="hidden md:inline-block px-6 py-2.5 rounded-full text-xs tracking-widest uppercase font-semibold transition-all duration-300 hover:scale-105"
          style={
            scrolled
              ? {
                  background: "linear-gradient(135deg, #ec4899, #f43f5e)",
                  color: "white",
                }
              : {
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.2)",
                  backdropFilter: "blur(8px)",
                }
          }
        >
          Order Now
        </Link>

        <button
          className="md:hidden flex flex-col gap-1.5 p-1"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span
            className={`block w-5 h-0.5 transition-all duration-200 ${open ? "translate-y-2 rotate-45" : ""}`}
            style={{ background: scrolled ? "#3b1a47" : "white" }}
          />
          <span
            className={`block w-5 h-0.5 transition-all duration-200 ${open ? "opacity-0" : ""}`}
            style={{ background: scrolled ? "#3b1a47" : "white" }}
          />
          <span
            className={`block w-5 h-0.5 transition-all duration-200 ${open ? "-translate-y-2 -rotate-45" : ""}`}
            style={{ background: scrolled ? "#3b1a47" : "white" }}
          />
        </button>
      </div>

      {open && (
        <nav
          className="md:hidden border-t px-6 py-4 flex flex-col gap-4"
          style={
            scrolled
              ? { background: "white", borderColor: "rgba(252,231,243,0.8)" }
              : {
                  background: "rgba(13,6,22,0.9)",
                  backdropFilter: "blur(16px)",
                  borderColor: "rgba(255,255,255,0.08)",
                }
          }
        >
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm transition-colors"
              style={{
                color: scrolled ? "rgba(59,26,71,0.6)" : "rgba(255,255,255,0.65)",
              }}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </motion.header>
  );
}
