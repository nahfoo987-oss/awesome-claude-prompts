import Image from "next/image";

// Curated posts — replace src with your actual bakery photos.
// To use real Instagram embeds, swap each <div> block with an <iframe>
// pointing to your post: https://www.instagram.com/p/POST_ID/embed
const posts = [
  {
    src: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=600&q=80",
    alt: "A pastel pink celebration cake with gold lettering",
    caption: "Birthday cake for a very special 30th ✨",
  },
  {
    src: "https://images.unsplash.com/photo-1551404973-761cae4a3b6c?w=600&q=80",
    alt: "Piped chocolate cupcakes on a marble surface",
    caption: "Fresh out of the oven this morning 🍫",
  },
  {
    src: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&q=80",
    alt: "A rustic two-tier cake with dried flower decorations",
    caption: "Autumn wedding season is officially here 🌾",
  },
  {
    src: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600&q=80",
    alt: "Assorted macarons in pastel colors",
    caption: "Weekend macaron drop — DM to reserve yours",
  },
  {
    src: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=600&q=80",
    alt: "Slice of layered vanilla cake with strawberry filling",
    caption: "What's inside matters too 🍓",
  },
  {
    src: "https://images.unsplash.com/photo-1587668178277-295251f900ce?w=600&q=80",
    alt: "Croissants and pastries on a linen cloth",
    caption: "Saturday morning bake ☕",
  },
];

export default function SocialFeed() {
  return (
    <section id="gallery" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="section-label mb-3">@jennysugatshack</p>
          <h2 className="section-title">Latest from our kitchen</h2>
          <p className="text-warm-brown/50 mt-3 text-sm">
            Follow along on Instagram for daily bakes, behind-the-scenes, and
            limited drops.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {posts.map((post, i) => (
            <a
              key={i}
              href="https://instagram.com/jennysugatshack"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square rounded-xl overflow-hidden block"
            >
              <Image
                src={post.src}
                alt={post.alt}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Caption overlay on hover */}
              <div className="absolute inset-0 bg-warm-brown/0 group-hover:bg-warm-brown/50 transition-colors duration-200 flex items-end p-4">
                <p className="text-cream text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 leading-snug">
                  {post.caption}
                </p>
              </div>
            </a>
          ))}
        </div>

        <div className="text-center mt-8">
          <a
            href="https://instagram.com/jennysugatshack"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-warm-brown/50 hover:text-warm-brown transition-colors duration-150 tracking-wide underline underline-offset-4"
          >
            View more on Instagram →
          </a>
        </div>
      </div>
    </section>
  );
}
