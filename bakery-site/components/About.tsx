import Image from "next/image";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { aboutQuery } from "@/sanity/lib/queries";

export default async function About() {
  const data = client ? await client.fetch(aboutQuery) : null;

  return (
    <section
      id="about"
      className="relative py-28 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #11071e 0%, #0d0616 100%)" }}
    >
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 70%)" }}
      />

      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
        <div
          data-animate
          className="relative aspect-[4/5] rounded-3xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(236,72,153,0.15)",
            boxShadow: "0 0 60px rgba(236,72,153,0.08)",
          }}
        >
          {data?.photo ? (
            <Image
              src={urlFor(data.photo).width(700).url()}
              alt="Jenny — owner of Jenny's Sugar Shack"
              fill
              className="object-cover object-top"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-30">
              <svg className="w-12 h-12 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm text-pink-400/70">Add photo in Studio</span>
            </div>
          )}
        </div>

        <div data-animate data-animate-delay="2">
          <p className="section-label mb-5">Our Story</p>
          <h2 className="section-title text-white mb-7">
            Made by hand.
            <br />
            <span
              style={{
                backgroundImage: "linear-gradient(135deg, #f472b6, #a855f7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Made with love.
            </span>
          </h2>

          {data?.paragraphs?.length ? (
            data.paragraphs.map((p: string, i: number) => (
              <p key={i} className="text-white/50 leading-relaxed mb-5 text-[0.95rem]">
                {p}
              </p>
            ))
          ) : (
            <p className="text-white/30 italic text-sm mb-5">
              Add Jenny&apos;s story in the Studio dashboard → About Jenny.
            </p>
          )}

          <p
            className="font-serif italic text-2xl mt-8"
            style={{
              backgroundImage: "linear-gradient(135deg, #f472b6, #e879f9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            — {data?.signature || "Jenny"}
          </p>
        </div>
      </div>
    </section>
  );
}
