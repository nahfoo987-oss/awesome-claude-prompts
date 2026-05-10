import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="pt-16 min-h-screen flex flex-col md:flex-row">
      {/* Text side */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 py-20 md:py-0 bg-petal">
        <p className="section-label mb-4">Handcrafted with love · Est. 2018</p>
        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-plum leading-tight mb-6">
          Baked fresh,
          <br />
          <em className="font-normal not-italic text-pink-500">
            made for you.
          </em>
        </h1>
        <p className="text-plum/60 text-lg leading-relaxed max-w-md mb-10">
          Every cake, cupcake, and pastry is made to order in our small kitchen.
          Real ingredients, real care — no shortcuts.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/order" className="btn-primary">
            Order a Custom Cake
          </Link>
          <Link href="#menu" className="btn-outline">
            See Our Menu
          </Link>
        </div>
      </div>

      {/* Image side — replace with a real photo from Jenny's kitchen */}
      <div className="flex-1 relative min-h-[50vh] md:min-h-screen">
        <Image
          src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=900&q=85"
          alt="A beautifully decorated celebration cake — replace with Jenny's own photo"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-pink-900/10" />
      </div>
    </section>
  );
}
