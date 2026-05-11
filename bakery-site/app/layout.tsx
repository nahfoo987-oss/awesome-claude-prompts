import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jenny's Sugar Shack — Handcrafted Sweets & Custom Cakes",
  description: "Custom cakes, cupcakes, cookies, pastries and more — handmade to order in our small kitchen.",
  openGraph: {
    title: "Jenny's Sugar Shack",
    description: "Your neighborhood sweet spot. Everything handmade to order.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
