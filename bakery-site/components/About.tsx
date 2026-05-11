import Image from "next/image";

export default function About() {
  return (
    <section
      id="about"
      className="py-24 px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center"
    >
      {/*
        Real photo of Jenny — saved from her Facebook post.
        To activate: save the photo to bakery-site/public/images/jenny.jpg
        then remove the comment markers below and delete the placeholder div.
      */}
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-blush">
        {/* Uncomment once jenny.jpg is in public/images/:
        <Image
          src="/images/jenny.jpg"
          alt="Jenny — owner of Jenny's Sugar Shack"
          fill
          className="object-cover object-top"
        />
        */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-40">
          <svg className="w-12 h-12 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-sm text-pink-400">Add jenny.jpg to public/images/</span>
        </div>
      </div>

      <div>
        <p className="section-label mb-4">Our Story</p>
        <h2 className="section-title mb-6">
          Made by hand.
          <br />
          Made with love.
        </h2>
        {/*
          TODO: Replace these paragraphs with Jenny's real story in her own words.
          Keep it warm, personal, and short — 2–3 sentences per paragraph is enough.
        */}
        <p className="text-plum/60 leading-relaxed mb-5">
          [Add Jenny&apos;s story here — how she got started, what she loves
          about baking, and what makes Sugar Shack special.]
        </p>
        <p className="text-plum/60 leading-relaxed mb-8">
          [Second paragraph — her ingredients, her process, or what her
          customers mean to her.]
        </p>
        <p className="font-serif italic text-pink-500 text-lg">— Jenny</p>
      </div>
    </section>
  );
}
