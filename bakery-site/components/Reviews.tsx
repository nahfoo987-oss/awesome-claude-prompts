import { client } from "@/sanity/lib/client";
import { reviewsQuery } from "@/sanity/lib/queries";

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-4 h-4 ${i < count ? "text-[#d32323]" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  if (platform === "yelp") return <span className="inline-flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#d32323"><path d="M20.16 12.73l-4.38 1.27c-.96.28-1.74-.8-1.18-1.63l2.56-3.84a1.05 1.05 0 011.71-.06c.82.99 1.4 2.17 1.63 3.47.1.55-.76.63-.34.79zm-6.5 4.09l1.27 4.38c.16.54-.42 1.01-.91.73a8.1 8.1 0 01-3.04-2.76c-.32-.49.11-1.13.67-1.05l3.01-.3zm-4.5-1.77l-4.22 1.74c-.5.21-1.03-.27-.84-.78.49-1.31 1.3-2.47 2.37-3.35.42-.35 1.05-.07 1.09.48l.42 3.91zm-.65-5.04L4.69 7.63c-.4-.38-.18-1.06.37-1.14a8.13 8.13 0 014.06.28c.56.19.64.95.13 1.26L5.8 10.63c-.48.29-1.07-.17-.89-.62zm5.48-4.97V.96C14 .39 14.61.08 15.04.4c1.1.83 2 1.92 2.56 3.2.23.52-.23 1.09-.79.97l-3.82-.73z" /></svg><span className="text-[#d32323] font-bold text-xs">yelp</span></span>;
  if (platform === "instagram") return <span className="text-xs font-medium" style={{ background: "linear-gradient(45deg,#f09433,#bc1888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Instagram</span>;
  if (platform === "facebook") return <span className="text-xs font-bold text-[#1877f2]">Facebook</span>;
  if (platform === "google") return <span className="text-xs font-bold text-[#4285f4]">Google</span>;
  return null;
}

export default async function Reviews() {
  const reviews = client ? await client.fetch(reviewsQuery) : [];
  if (!reviews?.length) return <section className="py-12 bg-pink-50" />;
  const yelpAndOthers = reviews.filter((r: any) => r.platform !== "instagram");
  const instaReviews = reviews.filter((r: any) => r.platform === "instagram");
  return (
    <section className="py-24 px-6 bg-pink-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="section-label mb-3">What people are saying</p>
          <h2 className="section-title">Loved by our community</h2>
        </div>
        {yelpAndOthers.length > 0 && (
          <div className="mb-12 grid md:grid-cols-3 gap-6">
            {yelpAndOthers.map((r: any) => (
              <div key={r._id} className="bg-white rounded-2xl p-6 border border-blush">
                <div className="flex items-center justify-between mb-3"><PlatformBadge platform={r.platform} />{r.stars && <Stars count={r.stars} />}</div>
                <p className="text-plum/70 leading-relaxed my-3 italic font-serif text-sm">&ldquo;{r.text}&rdquo;</p>
                <div className="flex justify-between items-end">
                  <p className="font-medium text-plum text-sm">{r.reviewerName}</p>
                  {r.date && <p className="text-xs text-plum/30">{new Date(r.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
        {instaReviews.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6">
            {instaReviews.map((r: any) => (
              <div key={r._id} className="bg-white rounded-2xl p-6 border border-blush">
                <p className="text-plum/70 leading-relaxed mb-4 italic font-serif text-sm">&ldquo;{r.text}&rdquo;</p>
                <p className="text-xs font-medium text-sky-500">{r.reviewerName}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
