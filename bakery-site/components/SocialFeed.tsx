"use client";

import { useEffect } from "react";

// Official Instagram embeds — real posts from @jennysugarshack.
// Captions, photos, and engagement show exactly as on Instagram.
// DMmLAAYOQbB appears once (it's a carousel; img_index variants are the same post).
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
  // Re-process any embeds after mount (handles client-side navigation)
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
          <h2 className="section-title">Latest from our kitchen</h2>
          <p className="text-plum/50 mt-3 text-sm">
            Real posts, straight from Instagram — follow along for daily bakes
            and limited drops.
          </p>
        </div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="break-inside-avoid">
              <blockquote
                className="instagram-media rounded-2xl overflow-hidden"
                data-instgrm-captioned
                data-instgrm-permalink={`https://www.instagram.com/${post.type}/${post.id}/`}
                data-instgrm-version="14"
                style={{
                  background: "#FFF",
                  border: "1px solid #e8d5e8",
                  borderRadius: "16px",
                  margin: 0,
                  maxWidth: "100%",
                  minWidth: "326px",
                  padding: 0,
                  width: "100%",
                }}
              />
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="https://instagram.com/jennysugarshack"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-sky-500 hover:text-sky-600 transition-colors tracking-wide underline underline-offset-4"
          >
            Follow @jennysugarshack on Instagram →
          </a>
        </div>
      </div>

      {/* Instagram embed script — loads once per page */}
      <script async src="https://www.instagram.com/embed.js" />
    </section>
  );
}
