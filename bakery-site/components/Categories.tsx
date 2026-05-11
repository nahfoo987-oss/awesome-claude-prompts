import Link from "next/link";

const categories = [
  {
    emoji: "🎂",
    name: "Custom Cakes",
    description: "Built around your event — any flavor, size, or design.",
    bg: "bg-pink-50",
    border: "border-pink-200",
    hover: "hover:bg-pink-100",
    tag: "Most popular",
  },
  {
    emoji: "🧁",
    name: "Cupcakes",
    description: "By the dozen, in any flavor. Perfect for parties.",
    bg: "bg-sky-50",
    border: "border-sky-200",
    hover: "hover:bg-sky-100",
    tag: null,
  },
  {
    emoji: "🍪",
    name: "Cookies",
    description: "Soft-baked, decorated, and made fresh daily.",
    bg: "bg-amber-50",
    border: "border-amber-200",
    hover: "hover:bg-amber-100",
    tag: null,
  },
  {
    emoji: "🥐",
    name: "Pastries",
    description: "Scones, croissants, danishes — rotating seasonally.",
    bg: "bg-rose-50",
    border: "border-rose-200",
    hover: "hover:bg-rose-100",
    tag: null,
  },
  {
    emoji: "🍫",
    name: "Chocolate Treats",
    description: "Truffles, bark, fudge, and dipped fruits.",
    bg: "bg-purple-50",
    border: "border-purple-200",
    hover: "hover:bg-purple-100",
    tag: null,
  },
  {
    emoji: "💍",
    name: "Wedding & Events",
    description: "Tiered cakes and dessert tables for your big day.",
    bg: "bg-pink-50",
    border: "border-pink-200",
    hover: "hover:bg-pink-100",
    tag: "Book early",
  },
];

export default function Categories() {
  return (
    <section className="py-20 bg-white" id="menu">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="section-label mb-3">What we make</p>
          <h2 className="section-title">Every kind of sweet thing</h2>
          <p className="text-plum/50 mt-3 max-w-md mx-auto text-sm leading-relaxed">
            We're not just a cake shop — we make anything that belongs in a
            dessert case, a party table, or a Tuesday pick-me-up.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href="/order"
              className={`relative rounded-2xl border ${cat.border} ${cat.bg} ${cat.hover} p-6 transition-colors duration-200 group`}
            >
              {cat.tag && (
                <span className="absolute top-3 right-3 bg-pink-600 text-white text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full">
                  {cat.tag}
                </span>
              )}
              <div className="text-3xl mb-3">{cat.emoji}</div>
              <h3 className="font-serif text-plum text-lg mb-1 group-hover:text-pink-600 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-plum/55 leading-relaxed">
                {cat.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
