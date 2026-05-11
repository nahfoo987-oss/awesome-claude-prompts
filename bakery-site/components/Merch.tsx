import Image from "next/image";
import Link from "next/link";

// TODO: Replace placeholder images with real merch photos from Facebook.
// Save each photo to bakery-site/public/images/ and update the src below.
// Update names, prices, and descriptions to match what Jenny actually sells.
const items = [
  {
    name: "Sugar Shack Apron",
    description: "Pink branded apron — perfect for home bakers.",
    price: "$28",
    img: null, // replace with "/images/merch-apron.jpg"
    alt: "Jenny's Sugar Shack branded apron",
  },
  {
    name: "Logo Tote Bag",
    description: "Heavy canvas tote with the Sugar Shack logo.",
    price: "$18",
    img: null, // replace with "/images/merch-tote.jpg"
    alt: "Jenny's Sugar Shack tote bag",
  },
  {
    name: "Sugar Shack Mug",
    description: "Ceramic mug — pairs well with a morning pastry.",
    price: "$16",
    img: null, // replace with "/images/merch-mug.jpg"
    alt: "Jenny's Sugar Shack mug",
  },
  {
    name: "Sticker Pack",
    description: "Set of 4 die-cut stickers. Great for water bottles.",
    price: "$8",
    img: null, // replace with "/images/merch-stickers.jpg"
    alt: "Jenny's Sugar Shack sticker pack",
  },
];

export default function Merch() {
  return (
    <section id="merch" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="section-label mb-3">Merch drop</p>
          <h2 className="section-title">Take a little Sugar Shack home</h2>
          <p className="text-plum/50 mt-3 max-w-md mx-auto text-sm leading-relaxed">
            Branded goods for fellow baking lovers. Limited quantities —
            available for pickup with any order or shipped directly.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item.name} className="flex flex-col group">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-blush mb-4 flex items-center justify-center">
                {item.img ? (
                  <Image
                    src={item.img}
                    alt={item.alt}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  // Placeholder until real photo is added
                  <div className="flex flex-col items-center gap-2 opacity-40">
                    <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs text-pink-400">Add photo</span>
                  </div>
                )}
              </div>
              <h3 className="font-serif text-plum text-base mb-1">{item.name}</h3>
              <p className="text-xs text-plum/50 leading-relaxed mb-2">{item.description}</p>
              <p className="text-sm font-medium text-pink-600 mt-auto">{item.price}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/order" className="btn-outline">
            Order merch with your next cake
          </Link>
        </div>
      </div>
    </section>
  );
}
