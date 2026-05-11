"use client";

const posts = [
  { type: "p",    id: "DXhgErumRK0" },
  { type: "reel", id: "DXNlNLsjs3V" },
  { type: "p",    id: "DOYs0KaETH3" },
  { type: "p",    id: "DNgztuvyXJi" },
  { type: "p",    id: "DNRPnBjysjD" },
  { type: "p",    id: "DMmLAAYOQbB" },
  { type: "p",    id: "DGTjmIuyTZ8" },
  { type: "p",    id: "DFlC28DSaIi" },
  { type: "p",    id: "DEp4-U0Sq6x" },
  { type: "p",    id: "C-0Yv5UPIEQ" },
  { type: "p",    id: "C-a7gKDyQD0" },
  { type: "p",    id: "C4i8WigvakN" },
];

export default function SocialFeed() {
  return (
    <section
      id="gallery"
      className="py-28 px-6 relative"
      style={{ background: "linear-gradient(180deg, #0d0616 0%, #11071e 100%)" }}
    >
      <div className="divider-glow mb-28 mx-0" />

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16" data-animate>
          <p className="section-label mb-4">@jennysugarshack</p>
          <h2 className="section-title text-white mb-4">
            Fresh from our kitchen
          </h2>
          <p className="text-white/35 mt-3 text-sm max-w-sm mx-auto">
            Follow along for daily bakes, seasonal drops, and behind-the-scenes
            sweetness.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post, i) => (
            <div
              key={post.id}
              className="rounded-2xl overflow-hidden transition-transform duration-300 hover:scale-[1.01]"
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
              data-animate
              data-animate-delay={String((i % 3) + 1)}
            >
              <iframe
                src={`https://www.instagram.com/${post.type}/${post.id}/embed/`}
                width="100%"
                height="480"
                frameBorder="0"
                scrolling="no"
                allowTransparency
                loading="lazy"
                className="w-full"
              />
            </div>
          ))}
        </div>

        <div className="text-center mt-14" data-animate>
          <a
            href="https://instagram.com/jennysugarshack"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
          >
            Follow @jennysugarshack
          </a>
        </div>
      </div>
    </section>
  );
}
