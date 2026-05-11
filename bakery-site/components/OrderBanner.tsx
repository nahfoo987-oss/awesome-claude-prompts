import Link from "next/link";

export default function OrderBanner() {
  return (
    <section className="py-28 px-6 relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1e0535 0%, #2d0a4e 50%, #1a0530 100%)" }} />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full animate-glow-pulse"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 65%)" }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full animate-glow-pulse"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 65%)", animationDelay: "1.5s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(251,113,133,0.1) 0%, transparent 70%)" }}
        />
      </div>

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto text-center" data-animate>
        <p className="section-label text-pink-300/80 mb-5">Ready to order?</p>
        <h2 className="font-serif text-4xl md:text-6xl text-white mb-6 leading-[0.95]">
          Tell us what
          <br />
          you&apos;re craving.
          <br />
          <em
            className="not-italic"
            style={{
              backgroundImage: "linear-gradient(135deg, #f9a8d4, #e879f9, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            We&apos;ll handle the rest.
          </em>
        </h2>
        <p className="text-white/45 max-w-md mx-auto mb-12 leading-relaxed">
          Custom cakes, cookie boxes, pastry trays, chocolate gifts, wedding
          dessert tables — if it&apos;s sweet, we can make it. Fill out the
          form and we&apos;ll be in touch within 24 hours.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/order" className="btn-primary">Start Your Order</Link>
          <a
            href="https://instagram.com/jennysugarshack"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
          >
            DM on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
