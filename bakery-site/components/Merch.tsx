import Image from "next/image";
import Link from "next/link";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { merchQuery } from "@/sanity/lib/queries";

export default async function Merch() {
  const items = client ? await client.fetch(merchQuery) : [];

  if (!items?.length) {
    return (
      <section id="merch" className="py-24 text-center" style={{ background: "#0d0616" }}>
        <p className="text-white/20 italic text-sm">
          Add merch items in the Studio dashboard → Merchandise.
        </p>
      </section>
    );
  }

  return (
    <section
      id="merch"
      className="py-28 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #11071e 0%, #0d0616 100%)" }}
    >
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)" }}
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16" data-animate>
          <p className="section-label mb-4">Merch drop</p>
          <h2 className="section-title text-white mb-4">
            Take a little Sugar Shack home
          </h2>
          <p className="text-white/35 mt-3 max-w-md mx-auto text-sm leading-relaxed">
            Branded goods for fellow baking lovers. Limited quantities — available
            for pickup with any order or shipped directly.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((item: any, i: number) => (
            <div
              key={item._id}
              className="flex flex-col group"
              data-animate
              data-animate-delay={String((i % 4) + 1)}
            >
              <div
                className="relative aspect-square rounded-2xl overflow-hidden mb-4"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Image
                  src={urlFor(item.image).width(400).url()}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <h3 className="font-serif text-white text-base mb-1 group-hover:text-pink-300 transition-colors duration-300">
                {item.name}
              </h3>
              {item.description && (
                <p className="text-xs text-white/35 leading-relaxed mb-2">
                  {item.description}
                </p>
              )}
              <p
                className="text-sm font-semibold mt-auto"
                style={{
                  backgroundImage: "linear-gradient(135deg, #f472b6, #a855f7)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {item.price}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-14" data-animate>
          <Link href="/order" className="btn-outline">
            Order merch with your next cake
          </Link>
        </div>
      </div>
    </section>
  );
}
