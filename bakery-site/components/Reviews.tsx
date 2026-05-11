// TODO: Paste in real reviews from Yelp, Instagram DMs/comments, and Facebook.
// Each platform section is clearly marked below.

const yelpReviews = [
  {
    name: "[Reviewer name from Yelp]",
    stars: 5,
    date: "[Date]",
    text: "[Paste the real Yelp review text here]",
  },
  {
    name: "[Reviewer name from Yelp]",
    stars: 5,
    date: "[Date]",
    text: "[Paste the real Yelp review text here]",
  },
  {
    name: "[Reviewer name from Yelp]",
    stars: 5,
    date: "[Date]",
    text: "[Paste the real Yelp review text here]",
  },
];

const instaReviews = [
  {
    handle: "@[instagram_username]",
    text: "[Paste a real Instagram comment or DM here]",
  },
  {
    handle: "@[instagram_username]",
    text: "[Paste a real Instagram comment or DM here]",
  },
  {
    handle: "@[instagram_username]",
    text: "[Paste a real Instagram comment or DM here]",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < count ? "text-[#d32323]" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// Yelp logo wordmark (SVG inline, official red)
function YelpLogo() {
  return (
    <span className="inline-flex items-center gap-1">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#d32323">
        <path d="M20.16 12.73l-4.38 1.27c-.96.28-1.74-.8-1.18-1.63l2.56-3.84a1.05 1.05 0 011.71-.06c.82.99 1.4 2.17 1.63 3.47.1.55-.76.63-.34.79zm-6.5 4.09l1.27 4.38c.16.54-.42 1.01-.91.73a8.1 8.1 0 01-3.04-2.76c-.32-.49.11-1.13.67-1.05l3.01-.3zm-4.5-1.77l-4.22 1.74c-.5.21-1.03-.27-.84-.78.49-1.31 1.3-2.47 2.37-3.35.42-.35 1.05-.07 1.09.48l.42 3.91zm-.65-5.04L4.69 7.63c-.4-.38-.18-1.06.37-1.14a8.13 8.13 0 014.06.28c.56.19.64.95.13 1.26L5.8 10.63c-.48.29-1.07-.17-.89-.62zm5.48-4.97V.96C14 .39 14.61.08 15.04.4c1.1.83 2 1.92 2.56 3.2.23.52-.23 1.09-.79.97l-3.82-.73z" />
      </svg>
      <span className="text-[#d32323] font-bold text-sm tracking-tight">yelp</span>
    </span>
  );
}

// Instagram logo (gradient icon)
function InstaLogo() {
  return (
    <span className="inline-flex items-center gap-1">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="url(#ig-grad)">
        <defs>
          <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f09433" />
            <stop offset="25%" stopColor="#e6683c" />
            <stop offset="50%" stopColor="#dc2743" />
            <stop offset="75%" stopColor="#cc2366" />
            <stop offset="100%" stopColor="#bc1888" />
          </linearGradient>
        </defs>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
      <span className="text-sm font-medium" style={{ background: "linear-gradient(45deg,#f09433,#bc1888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        Instagram
      </span>
    </span>
  );
}

export default function Reviews() {
  return (
    <section className="py-24 px-6 bg-petal">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="section-label mb-3">What people are saying</p>
          <h2 className="section-title">Loved by our community</h2>
        </div>

        {/* Yelp reviews */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <YelpLogo />
            <span className="text-xs text-plum/40 tracking-wide uppercase">Reviews</span>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {yelpReviews.map((r, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-blush">
                <Stars count={r.stars} />
                <p className="text-plum/70 leading-relaxed my-4 italic font-serif text-sm">
                  &ldquo;{r.text}&rdquo;
                </p>
                <div className="flex justify-between items-end">
                  <p className="font-medium text-plum text-sm">{r.name}</p>
                  <p className="text-xs text-plum/30">{r.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instagram reviews */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <InstaLogo />
            <span className="text-xs text-plum/40 tracking-wide uppercase">Comments</span>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {instaReviews.map((r, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-blush">
                <p className="text-plum/70 leading-relaxed mb-4 italic font-serif text-sm">
                  &ldquo;{r.text}&rdquo;
                </p>
                <p className="text-xs font-medium text-sky-500">{r.handle}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
