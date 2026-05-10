// TODO: Replace with real reviews from Jenny's actual customers.
// Good sources: Google reviews, Facebook recommendations, DMs she's received.
const reviews = [
  {
    name: "[Customer name]",
    event: "[Event type]",
    quote: "[Add a real review from a customer here.]",
  },
  {
    name: "[Customer name]",
    event: "[Event type]",
    quote: "[Add a real review from a customer here.]",
  },
  {
    name: "[Customer name]",
    event: "[Event type]",
    quote: "[Add a real review from a customer here.]",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 px-6 bg-petal">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="section-label mb-3">Kind words</p>
          <h2 className="section-title">From people we&apos;ve baked for</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((r, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-8 border border-blush"
            >
              <p className="text-plum/70 leading-relaxed mb-6 italic font-serif">
                &ldquo;{r.quote}&rdquo;
              </p>
              <div>
                <p className="font-medium text-plum text-sm">{r.name}</p>
                <p className="text-xs text-plum/40 mt-0.5">{r.event}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
