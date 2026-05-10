const reviews = [
  {
    name: "Sarah M.",
    event: "Baby shower",
    quote:
      "Jenny made our cake and it was honestly the most beautiful thing on the table. Everyone was asking who made it. Will order again and again.",
  },
  {
    name: "David & Ana",
    event: "Wedding",
    quote:
      "We were nervous about ordering our wedding cake without a tasting, but Jenny walked us through everything. The cake was perfect — and tasted even better than it looked.",
  },
  {
    name: "The Kowalski Family",
    event: "Birthday",
    quote:
      "My daughter specifically requested 'the pink one from Jenny's.' We've ordered three times now. It never disappoints.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 px-6 bg-cream">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="section-label mb-3">Kind words</p>
          <h2 className="section-title">From people we&apos;ve baked for</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((r) => (
            <div
              key={r.name}
              className="bg-white rounded-2xl p-8 border border-rose-blush/60"
            >
              <p className="text-warm-brown/70 leading-relaxed mb-6 italic font-serif">
                &ldquo;{r.quote}&rdquo;
              </p>
              <div>
                <p className="font-medium text-warm-brown text-sm">{r.name}</p>
                <p className="text-xs text-warm-brown/40 mt-0.5">{r.event}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
