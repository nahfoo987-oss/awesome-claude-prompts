import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="pt-16 relative min-h-screen flex items-center">
      <div className="absolute inset-0">
        <Image src="https://images.unsplash.com/photo-1488477181946-6428a0291777?w=1600&q=85" alt="Colorful sweets and pastries" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-pink-950/80 via-pink-900/60 to-transparent" />
      </div>
      <div className="relative z-10 max-w-6xl mx-auto px-8 md:px-16 py-24 w-full">
        <div className="max-w-xl">
          <span className="inline-block bg-pink-500/20 border border-pink-400/40 text-pink-200 text-xs tracking-[0.2em] uppercase px-4 py-1.5 rounded-full mb-6">Handcrafted Daily · Est. 2018</span>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-white leading-tight mb-6">
            Your neighborhood<br />
            <em className="not-italic text-pink-300">sweet spot.</em>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-md">
            Custom cakes, fresh pastries, cookies, cupcakes, and every sweet thing in between — made to order from our kitchen to your table.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/order" className="btn-primary">Order a Custom Cake</Link>
            <Link href="#menu" className="inline-block border-2 border-white/60 text-white px-8 py-3 rounded-full text-sm tracking-widest uppercase font-semibold hover:bg-white/10 transition-colors duration-200">See the Menu</Link>
          </div>
          <div className="flex gap-8 mt-14 pt-8 border-t border-white/20">
            {[
              { number: "500+", label: "Orders delivered" },
              { number: "100%", label: "Made to order" },
              { number: "5★", label: "Yelp rating" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-serif text-2xl text-pink-300">{s.number}</p>
                <p className="text-xs text-white/50 tracking-wide mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
