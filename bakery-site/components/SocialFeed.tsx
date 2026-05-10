import Image from "next/image";

// TODO: Replace ALL of these with real photos saved from @jennysugarshack on Instagram.
// Save them to /public/images/ and update the src to "/images/post1.jpg" etc.
// Caption text should match what Jenny actually wrote on each post.
const posts = [
  {
    src: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=600&q=80",
    alt: "Replace with Jenny's actual Instagram photo",
    caption: "Add Jenny's real caption here",
  },
  {
    src: "https://images.unsplash.com/photo-1551404973-761cae4a3b6c?w=600&q=80",
    alt: "Replace with Jenny's actual Instagram photo",
    caption: "Add Jenny's real caption here",
  },
  {
    src: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&q=80",
    alt: "Replace with Jenny's actual Instagram photo",
    caption: "Add Jenny's real caption here",
  },
  {
    src: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600&q=80",
    alt: "Replace with Jenny's actual Instagram photo",
    caption: "Add Jenny's real caption here",
  },
  {
    src: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=600&q=80",
    alt: "Replace with Jenny's actual Instagram photo",
    caption: "Add Jenny's real caption here",
  },
  {
    src: "https://images.unsplash.com/photo-1587668178277-295251f900ce?w=600&q=80",
    alt: "Replace with Jenny's actual Instagram photo",
    caption: "Add Jenny's real caption here",
  },
];

export default function SocialFeed() {
  return (
    <section id="gallery" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="section-label mb-3">@jennysugarshack</p>
          <h2 className="section-title">Latest from our kitchen</h2>
          <p className="text-plum/50 mt-3 text-sm">
            Follow along on Instagram for daily bakes, behind-the-scenes, and
            limited drops.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {posts.map((post, i) => (
            <a
              key={i}
              href="https://instagram.com/jennysugarshack"
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
              <div className="absolute inset-0 bg-pink-900/0 group-hover:bg-pink-900/50 transition-colors duration-200 flex items-end p-4">
                <p className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 leading-snug">
                  {post.caption}
                </p>
              </div>
            </a>
          ))}
        </div>

        <div className="text-center mt-8">
          <a
            href="https://instagram.com/jennysugarshack"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-sky-500 hover:text-sky-600 transition-colors duration-150 tracking-wide underline underline-offset-4"
          >
            View more on Instagram →
          </a>
        </div>
      </div>
    </section>
  );
}
