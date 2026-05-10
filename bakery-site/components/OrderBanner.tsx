import Link from "next/link";

export default function OrderBanner() {
  return (
    <section className="py-24 px-6 bg-warm-brown text-cream text-center">
      <p className="section-label text-cream/40 mb-4">Ready to get started?</p>
      <h2 className="font-serif text-4xl md:text-5xl mb-5 leading-snug">
        Let&apos;s make something
        <br />
        <em className="font-normal">just for you.</em>
      </h2>
      <p className="text-cream/60 max-w-md mx-auto mb-10 leading-relaxed">
        Fill out a quick order form and I&apos;ll get back to you within 24
        hours to discuss the details — flavors, design, timeline, and pricing.
      </p>
      <Link
        href="/order"
        className="inline-block bg-cream text-warm-brown px-10 py-4 rounded-full text-sm tracking-widest uppercase font-medium hover:bg-rose-blush transition-colors duration-200"
      >
        Start Your Order
      </Link>
    </section>
  );
}
