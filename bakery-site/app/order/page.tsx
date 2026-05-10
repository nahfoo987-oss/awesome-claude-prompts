import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderForm from "@/components/OrderForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom Cake Orders — Jenny's Sugar Shack",
  description:
    "Order a handcrafted custom cake for your next event. Tell us your vision and we'll make it happen.",
};

export default function OrderPage() {
  return (
    <>
      <Header />
      <main className="pt-24 pb-20">
        <div className="max-w-2xl mx-auto px-6">
          {/* Page header */}
          <div className="text-center mb-14">
            <p className="section-label mb-3">Custom Orders</p>
            <h1 className="font-serif text-4xl md:text-5xl text-warm-brown mb-5 leading-snug">
              Let&apos;s design your cake.
            </h1>
            <p className="text-warm-brown/55 leading-relaxed max-w-md mx-auto">
              Fill out the form below and I&apos;ll reach out within 24 hours to
              talk through flavors, design, and timing. No commitment needed —
              just a conversation.
            </p>
          </div>

          {/* How it works */}
          <div className="grid grid-cols-3 gap-4 mb-14">
            {[
              { step: "01", title: "Submit your request", body: "Tell me about your event, size, flavor, and design ideas." },
              { step: "02", title: "We chat details", body: "I'll follow up within 24 hours to discuss and confirm everything." },
              { step: "03", title: "Pick up your cake", body: "Your order is made fresh and ready on your chosen date." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <p className="font-serif text-2xl text-rose-muted mb-2">{s.step}</p>
                <p className="text-xs font-medium text-warm-brown mb-1">{s.title}</p>
                <p className="text-xs text-warm-brown/50 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          <OrderForm />

          <p className="text-xs text-center text-warm-brown/40 mt-6 leading-relaxed">
            Prefer to reach out directly? Email{" "}
            <a
              href="mailto:hello@jennysugarshack.com"
              className="underline hover:text-warm-brown/70 transition-colors"
            >
              hello@jennysugarshack.com
            </a>{" "}
            or message us on Instagram.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
