"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const categories = [
  {
    emoji: "🎂",
    name: "Custom Cakes",
    description: "Built around your event — any flavor, size, or design.",
    gradient: "from-pink-500/20 to-rose-500/10",
    border: "border-pink-500/20",
    glow: "rgba(236,72,153,0.18)",
    tag: "Most popular",
  },
  {
    emoji: "🧁",
    name: "Cupcakes",
    description: "By the dozen, in any flavor. Perfect for parties.",
    gradient: "from-sky-500/20 to-blue-500/10",
    border: "border-sky-500/20",
    glow: "rgba(14,165,233,0.18)",
    tag: null,
  },
  {
    emoji: "🍪",
    name: "Cookies",
    description: "Soft-baked, decorated, and made fresh daily.",
    gradient: "from-amber-500/20 to-yellow-500/10",
    border: "border-amber-500/20",
    glow: "rgba(245,158,11,0.18)",
    tag: null,
  },
  {
    emoji: "🥐",
    name: "Pastries",
    description: "Scones, croissants, danishes — rotating seasonally.",
    gradient: "from-rose-500/20 to-pink-500/10",
    border: "border-rose-500/20",
    glow: "rgba(244,63,94,0.18)",
    tag: null,
  },
  {
    emoji: "🍫",
    name: "Chocolate Treats",
    description: "Truffles, bark, fudge, and dipped fruits.",
    gradient: "from-purple-500/20 to-violet-500/10",
    border: "border-purple-500/20",
    glow: "rgba(168,85,247,0.18)",
    tag: null,
  },
  {
    emoji: "💍",
    name: "Wedding & Events",
    description: "Tiered cakes and dessert tables for your big day.",
    gradient: "from-pink-500/20 to-purple-500/10",
    border: "border-pink-400/20",
    glow: "rgba(236,72,153,0.18)",
    tag: "Book early",
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function Categories() {
  return (
    <section className="py-28 bg-[#0d0616]" id="menu">
      <div className="divider-glow mb-28 mx-6" />

      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="section-label mb-4">What we make</p>
          <h2 className="section-title text-white mb-4">
            Every kind of sweet thing
          </h2>
          <p className="text-white/35 mt-3 max-w-md mx-auto text-sm leading-relaxed">
            Not just cakes. Every sweet thing you could want — handmade, made to
            order, never out of a box.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          {categories.map((cat) => (
            <motion.div key={cat.name} variants={itemVariants}>
              <Link
                href="/order"
                className={`relative block rounded-2xl border ${cat.border} bg-gradient-to-br ${cat.gradient} p-6 transition-all duration-300 group hover:scale-[1.025] overflow-hidden`}
                style={{ backdropFilter: "blur(4px)" }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                  style={{
                    background: `radial-gradient(circle at 40% 40%, ${cat.glow} 0%, transparent 70%)`,
                  }}
                />

                {cat.tag && (
                  <span className="absolute top-3 right-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full z-10">
                    {cat.tag}
                  </span>
                )}

                <div className="text-3xl mb-4 inline-block transition-transform duration-300 group-hover:scale-110">
                  {cat.emoji}
                </div>
                <h3 className="font-serif text-white text-lg mb-2 group-hover:text-pink-300 transition-colors duration-300">
                  {cat.name}
                </h3>
                <p className="text-xs text-white/38 leading-relaxed group-hover:text-white/55 transition-colors duration-300">
                  {cat.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
