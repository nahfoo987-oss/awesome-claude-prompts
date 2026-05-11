import Image from "next/image";
import Link from "next/link";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { merchQuery } from "@/sanity/lib/queries";

export default async function Merch() {
  const items = await client.fetch(merchQuery);

  if (!items?.length) {
    return (
      <section id="merch" className="py-24 bg-white text-center">
        <p className="text-plum/40 italic text-sm">
          Add merch items in the Studio dashboard → Merchandise.
        </p>
      </section>
    );
  }

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
          {items.map((item: any) => (
            <div key={item._id} className="flex flex-col group">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-blush mb-4">
                <Image
                  src={urlFor(item.image).width(400).url()}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="font-serif text-plum text-base mb-1">{item.name}</h3>
              {item.description && (
                <p className="text-xs text-plum/50 leading-relaxed mb-2">{item.description}</p>
              )}
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
