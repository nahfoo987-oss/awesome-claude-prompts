import Link from "next/link";

export default function OrderBanner() {
  return (
    <section className="py-24 px-6 relative overflow-hidden bg-pink-600">
      <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-pink-500/30" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-pink-700/30" />
      <div className="absolute top-10 right-1/4 w-32 h-32 rounded-full bg-sky-400/20" />
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <p className="section-label text-pink-200 mb-4">Ready to order?</p>
        <h2 className="font-serif text-4xl md:text-5xl text-white mb-5 leading-snug">
          Tell us what you&apos;re craving.<br />
          <em className="font-normal text-pink-200">We&apos;ll handle the rest.</em>
        </h2>
        <p className="text-pink-100/80 max-w-md mx-auto mb-10 leading-relaxed">
          Custom cakes, cookie boxes, pastry trays, chocolate gifts, wedding dessert tables — if it&apos;s sweet, we can make it.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/order" className="inline-block bg-white text-pink-600 px-10 py-4 rounded-full text-sm tracking-widest uppercase font-bold hover:bg-pink-50 transition-colors duration-200">Start Your Order</Link>
          <a href="https://instagram.com/jennysugarshack" target="_blank" rel="noopener noreferrer" className="inline-block border-2 border-white/50 text-white px-10 py-4 rounded-full text-sm tracking-widest uppercase font-semibold hover:bg-white/10 transition-colors duration-200">DM on Instagram</a>
        </div>
      </div>
    </section>
  );
}
