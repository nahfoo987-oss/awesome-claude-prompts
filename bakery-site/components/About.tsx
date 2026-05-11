import Image from "next/image";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { aboutQuery } from "@/sanity/lib/queries";

export default async function About() {
  const data = client ? await client.fetch(aboutQuery) : null;
  return (
    <section id="about" className="py-24 px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-blush">
        {data?.photo ? (
          <Image src={urlFor(data.photo).width(700).url()} alt="Jenny — owner of Jenny's Sugar Shack" fill className="object-cover object-top" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-40">
            <svg className="w-12 h-12 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-sm text-pink-400">Add photo in Studio</span>
          </div>
        )}
      </div>
      <div>
        <p className="section-label mb-4">Our Story</p>
        <h2 className="section-title mb-6">Made by hand.<br />Made with love.</h2>
        {data?.paragraphs?.length ? (
          data.paragraphs.map((p: string, i: number) => <p key={i} className="text-plum/60 leading-relaxed mb-5">{p}</p>)
        ) : (
          <p className="text-plum/40 italic text-sm mb-5">Add Jenny&apos;s story in the Studio dashboard → About Jenny.</p>
        )}
        <p className="font-serif italic text-pink-500 text-lg">— {data?.signature || "Jenny"}</p>
      </div>
    </section>
  );
}
