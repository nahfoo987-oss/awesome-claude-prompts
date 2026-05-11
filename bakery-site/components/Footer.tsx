import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="relative overflow-hidden py-16 px-6"
      style={{
        background: "#080310",
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(236,72,153,0.06) 0%, transparent 70%)" }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-12">
          <div>
            <p className="font-serif text-xl text-white mb-3">
              Jenny&apos;s Sugar Shack
            </p>
            <p className="text-sm text-white/30 max-w-xs leading-relaxed">
              Handcrafted sweets made to order. Pickup available — local
              delivery on select dates.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <p className="section-label mb-1">Get in touch</p>
            <a
              href="mailto:hello@jennysugarshack.com"
              className="text-sm text-white/40 hover:text-white transition-colors"
            >
              hello@jennysugarshack.com
            </a>
            <a
              href="https://instagram.com/jennysugarshack"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/40 hover:text-pink-400 transition-colors"
            >
              @jennysugarshack on Instagram
            </a>
            <a
              href="https://facebook.com/jennysugarshack"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/40 hover:text-sky-400 transition-colors"
            >
              Facebook Page
            </a>
          </div>

          <div className="flex flex-col gap-2.5">
            <p className="section-label mb-1">Quick links</p>
            {[
              { href: "#menu", label: "Menu" },
              { href: "#about", label: "About" },
              { href: "#gallery", label: "Gallery" },
              { href: "/order", label: "Custom Orders" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-white/40 hover:text-white transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-xs text-white/20">
            © {new Date().getFullYear()} Jenny&apos;s Sugar Shack. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
