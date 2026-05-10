import Image from "next/image";

export default function About() {
  return (
    <section
      id="about"
      className="py-24 px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center"
    >
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1556217477-d325251ece38?w=700&q=85"
          alt="Jenny decorating a cake in her kitchen"
          fill
          className="object-cover"
        />
      </div>

      <div>
        <p className="section-label mb-4">Our Story</p>
        <h2 className="section-title mb-6">
          Started at the kitchen table.
          <br />
          Still made there.
        </h2>
        <p className="text-warm-brown/60 leading-relaxed mb-5">
          I started Sugar Shack in 2018 after years of baking for family
          gatherings where the cake was always the first thing to disappear.
          What began as a hobby became something I couldn&apos;t stop doing —
          and now I get to do it every day for people like you.
        </p>
        <p className="text-warm-brown/60 leading-relaxed mb-8">
          Every order is made by hand, in small batches, using real butter and
          fresh ingredients sourced locally wherever possible. I don&apos;t use
          mixes. I don&apos;t rush. And I never bake anything I wouldn&apos;t
          be proud to serve at my own table.
        </p>
        <p className="font-serif italic text-rose-deep text-lg">— Jenny</p>
      </div>
    </section>
  );
}
