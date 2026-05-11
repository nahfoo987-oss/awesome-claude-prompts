const points = [
  {
    icon: "🫶",
    title: "Made to order",
    body: "Nothing sits in a case. Every item is made fresh after you order — no exceptions.",
  },
  {
    icon: "🌿",
    title: "Real ingredients only",
    body: "Butter, not margarine. Real vanilla, not extract. You taste the difference.",
  },
  {
    icon: "🎨",
    title: "Your design, your way",
    body: "Send us a photo, a theme, or just a color — we'll make it exactly how you imagined.",
  },
  {
    icon: "📦",
    title: "Pickup & local delivery",
    body: "Pickup is always free. Local delivery available on select days — just ask.",
  },
];

export default function WhyUs() {
  return (
    <section className="py-20 bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="section-label mb-3">Why Sugar Shack</p>
          <h2 className="section-title">Small batch. Big love.</h2>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {points.map((p) => (
            <div
              key={p.title}
              className="bg-white rounded-2xl border border-pink-100 p-6 text-center hover:shadow-sm transition-shadow duration-200"
            >
              <div className="text-4xl mb-4">{p.icon}</div>
              <h3 className="font-serif text-plum text-lg mb-2">{p.title}</h3>
              <p className="text-xs text-plum/55 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
