"use client";

import { useEffect } from "react";

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
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).instgrm) {
      (window as any).instgrm.Embeds.process();
    }
  }, []);

  return (
    <section id="gallery" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="section-label mb-3">@jennysugarshack</p>
          <h2 className="section-title">Fresh from our kitchen</h2>
          <p className="text-plum/50 mt-3 text-sm max-w-sm mx-auto">
            Follow along for daily bakes, seasonal drops, and behind-the-scenes
            sweetness.
          </p>
        </div>

        {/* Iframe embeds — SSR safe, no hydration mismatch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div key={post.id} className="rounded-2xl overflow-hidden border border-blush">
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

        <div className="text-center mt-10">
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
