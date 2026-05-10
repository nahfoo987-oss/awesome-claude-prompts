import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-cream border-t border-rose-blush/60 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
        <div>
          <p className="font-serif text-lg text-warm-brown mb-2">
            Jenny&apos;s Sugar Shack
          </p>
          <p className="text-sm text-warm-brown/40 max-w-xs leading-relaxed">
            Handcrafted cakes and pastries, made to order. Pickup available —
            local delivery on select dates.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="section-label mb-1">Get in touch</p>
          <a
            href="mailto:hello@jennysugarshack.com"
            className="text-sm text-warm-brown/60 hover:text-warm-brown transition-colors"
          >
            hello@jennysugarshack.com
          </a>
          <a
            href="https://instagram.com/jennysugatshack"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-warm-brown/60 hover:text-warm-brown transition-colors"
          >
            @jennysugatshack on Instagram
          </a>
          <a
            href="https://facebook.com/jennysugatshack"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-warm-brown/60 hover:text-warm-brown transition-colors"
          >
            Facebook Page
          </a>
        </div>

        <div className="flex flex-col gap-2">
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
              className="text-sm text-warm-brown/60 hover:text-warm-brown transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-rose-blush/40">
        <p className="text-xs text-warm-brown/30">
          © {new Date().getFullYear()} Jenny&apos;s Sugar Shack. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
