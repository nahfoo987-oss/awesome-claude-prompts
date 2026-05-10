import Image from "next/image";

export default function About() {
  return (
    <section
      id="about"
      className="py-24 px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center"
    >
      {/* Replace with a real photo of Jenny — from her Instagram or camera roll */}
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1556217477-d325251ece38?w=700&q=85"
          alt="Jenny in her kitchen — replace with a real photo"
          fill
          className="object-cover"
        />
      </div>

      <div>
        <p className="section-label mb-4">Our Story</p>
        <h2 className="section-title mb-6">
          Made by hand.
          <br />
          Made with love.
        </h2>
        {/*
          TODO: Replace this with Jenny's real story.
          A few sentences about how she got started, what she loves about baking,
          and what makes Sugar Shack different. Keep it warm and personal.
        */}
        <p className="text-plum/60 leading-relaxed mb-5">
          [Add Jenny&apos;s story here — how she got started, what she loves
          about baking, and what makes Sugar Shack special.]
        </p>
        <p className="text-plum/60 leading-relaxed mb-8">
          [Add a second paragraph — maybe about her ingredients, her process,
          or what her customers mean to her.]
        </p>
        <p className="font-serif italic text-pink-500 text-lg">— Jenny</p>
      </div>
    </section>
  );
}
