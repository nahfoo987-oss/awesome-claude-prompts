"use client";

import { motion } from "framer-motion";

const points = [
  {
    icon: "🫶",
    title: "Made to order",
    body: "Nothing sits in a case. Every item is made fresh after you order — no exceptions.",
    accent: "rgba(236,72,153,0.15)",
  },
  {
    icon: "🌿",
    title: "Real ingredients",
    body: "Butter, not margarine. Real vanilla, not extract. You taste the difference.",
    accent: "rgba(16,185,129,0.15)",
  },
  {
    icon: "🎨",
    title: "Your design",
    body: "Send a photo, a theme, or just a color. We'll make it exactly how you imagined.",
    accent: "rgba(168,85,247,0.15)",
  },
  {
    icon: "📦",
    title: "Pickup & delivery",
    body: "Pickup is always free. Local delivery available on select days — just ask.",
    accent: "rgba(14,165,233,0.15)",
  },
];

export default function WhyUs() {
  return (
    <section
      className="py-28 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0d0616 0%, #11071e 100%)",
      }}
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(168,85,247,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="section-label mb-4">Why Sugar Shack</p>
          <h2 className="section-title text-white">Small batch. Big love.</h2>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-5">
          {points.map((p, i) => (
            <motion.div
              key={p.title}
              className="relative rounded-2xl border border-white/8 overflow-hidden text-center p-8 group cursor-default"
              style={{ background: "rgba(255,255,255,0.03)" }}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: i * 0.1,
                duration: 0.9,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${p.accent} 0%, transparent 70%)`,
                }}
              />

              <div className="relative z-10">
                <div className="text-4xl mb-5 inline-block transition-transform duration-300 group-hover:scale-110">
                  {p.icon}
                </div>
                <h3 className="font-serif text-white text-lg mb-3">{p.title}</h3>
                <p className="text-xs text-white/38 leading-relaxed group-hover:text-white/55 transition-colors duration-300">
                  {p.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
