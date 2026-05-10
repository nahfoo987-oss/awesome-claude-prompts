import Image from "next/image";
import Link from "next/link";

// TODO: Replace images with real photos of Jenny's actual products.
// Download them from her Instagram (@jennysugarshack) or phone and add to /public/images/
const items = [
  {
    name: "Custom Celebration Cakes",
    description:
      "Designed entirely around your event — flavors, colors, size, and decorations. Every detail is yours to choose.",
    price: "From $65",
    img: "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=600&q=80",
    alt: "Custom celebration cake — replace with Jenny's photo",
  },
  {
    name: "Cupcake Boxes",
    description:
      "A dozen freshly baked cupcakes in your choice of flavor. Perfect for parties, gifts, or a quiet Tuesday.",
    price: "From $32",
    img: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=600&q=80",
    alt: "Cupcake box — replace with Jenny's photo",
  },
  {
    name: "Seasonal Pastries",
    description:
      "Scones, croissants, danishes, and more — rotating with the seasons and whatever looks good at the market.",
    price: "From $4 each",
    img: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80",
    alt: "Seasonal pastries — replace with Jenny's photo",
  },
  {
    name: "Wedding Cakes",
    description:
      "Tiered cakes built for your most important day. Consultations available — reach out early, as spots fill quickly.",
    price: "Inquire for pricing",
    img: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&q=80",
    alt: "Wedding cake — replace with Jenny's photo",
  },
];

export default function Menu() {
  return (
    <section id="menu" className="py-24 bg-blush/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="section-label mb-3">What we make</p>
          <h2 className="section-title">Something for every occasion</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {items.map((item) => (
            <div
              key={item.name}
              className="bg-white rounded-2xl overflow-hidden flex flex-col sm:flex-row hover:shadow-md transition-shadow duration-200"
            >
              <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0">
                <Image
                  src={item.img}
                  alt={item.alt}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl text-plum mb-2">
                    {item.name}
                  </h3>
                  <p className="text-sm text-plum/60 leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-pink-600">
                    {item.price}
                  </span>
                  <Link
                    href="/order"
                    className="text-xs tracking-widest uppercase text-sky-500 hover:text-sky-600 transition-colors duration-150"
                  >
                    Order →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
