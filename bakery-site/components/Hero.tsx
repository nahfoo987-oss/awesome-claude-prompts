"use client";

import { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const canvasY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setCursor({
        x: (e.clientX / window.innerWidth - 0.5) * 50,
        y: (e.clientY / window.innerHeight - 0.5) * 50,
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Base background */}
      <div className="absolute inset-0 bg-[#0d0616]" />

      {/* Animated ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-60 -left-60 w-[900px] h-[900px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 65%)" }}
          animate={{ scale: [1, 1.12, 1], x: [0, 25, 0], y: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-60 right-0 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 65%)" }}
          animate={{ scale: [1, 1.18, 1], x: [0, -20, 0], y: [0, 15, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(251,113,133,0.08) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      {/* Cursor-reactive spotlight */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 60%)",
          left: "50%",
          top: "50%",
          translateX: "-50%",
          translateY: "-50%",
          x: cursor.x,
          y: cursor.y,
        }}
        transition={{ type: "spring", stiffness: 28, damping: 22 }}
      />

      {/* Parallax photo layer */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ y: imageY }}>
        <Image
          src="https://images.unsplash.com/photo-1488477181946-6428a0291777?w=1600&q=85"
          alt=""
          fill
          className="object-cover opacity-[0.05] mix-blend-luminosity"
          priority
        />
      </motion.div>

      {/* 3D canvas — right side */}
      <motion.div
        className="absolute right-[-5%] top-0 w-full md:w-[58%] h-full pointer-events-none"
        style={{ y: canvasY }}
      >
        <HeroCanvas />
      </motion.div>

      {/* Floating sprinkle particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${2 + (i % 4)}px`,
              height: `${2 + (i % 4)}px`,
              background:
                i % 3 === 0
                  ? "rgba(236,72,153,0.4)"
                  : i % 3 === 1
                  ? "rgba(168,85,247,0.4)"
                  : "rgba(251,113,133,0.3)",
              left: `${5 + ((i * 5.3) % 90)}%`,
              top: `${10 + ((i * 7.1) % 80)}%`,
            }}
            animate={{ y: [0, -35, 0], opacity: [0, 0.7, 0] }}
            transition={{
              duration: 5 + (i % 4),
              repeat: Infinity,
              delay: (i * 0.4) % 5,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 max-w-6xl mx-auto px-8 md:px-16 py-24 w-full"
        style={{ y: textY, opacity: contentOpacity }}
      >
        <div className="max-w-[600px]">
          <motion.span
            className="inline-flex items-center gap-2 border border-white/10 text-pink-300 text-xs tracking-[0.2em] uppercase px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm"
            style={{ background: "rgba(255,255,255,0.04)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
            Handcrafted Daily · Est. 2018
          </motion.span>

          <h1 className="font-serif leading-[0.9] mb-8">
            {[
              { word: "Your", gradient: false },
              { word: "neighborhood", gradient: true },
              { word: "sweet spot.", gradient: false },
            ].map(({ word, gradient }, i) => (
              <motion.span
                key={word}
                className="block text-[clamp(3rem,8vw,5.5rem)]"
                style={
                  gradient
                    ? {
                        backgroundImage:
                          "linear-gradient(135deg, #f472b6, #e879f9, #a855f7)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }
                    : { color: "white" }
                }
                initial={{ opacity: 0, y: 90, skewY: 4 }}
                animate={{ opacity: 1, y: 0, skewY: 0 }}
                transition={{
                  delay: 0.3 + i * 0.14,
                  duration: 1.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            className="text-white/45 text-lg leading-relaxed mb-12 max-w-[420px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85, duration: 0.9 }}
          >
            Custom cakes, fresh pastries, cookies, cupcakes — and every sweet
            thing in between. Made to order, from our kitchen to your table.
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.9 }}
          >
            <Link href="/order" className="btn-primary">
              Order a Custom Cake
            </Link>
            <Link href="#menu" className="btn-outline">
              See the Menu
            </Link>
          </motion.div>

          <motion.div
            className="flex gap-10 mt-16 pt-10"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.9 }}
          >
            {[
              { number: "500+", label: "Orders delivered" },
              { number: "100%", label: "Made to order" },
              { number: "5★", label: "Yelp rating" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-serif text-3xl text-pink-300">{s.number}</p>
                <p className="text-xs text-white/25 tracking-wide mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.9, duration: 0.8 }}
      >
        <span className="text-white/20 text-[10px] tracking-[0.35em] uppercase">
          Scroll
        </span>
        <motion.div
          className="w-px h-10"
          style={{
            transformOrigin: "top",
            background: "linear-gradient(to bottom, rgba(236,72,153,0.4), transparent)",
          }}
          animate={{ scaleY: [0, 1, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}
