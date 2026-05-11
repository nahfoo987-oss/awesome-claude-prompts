import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollObserver from "@/components/ScrollObserver";

export const metadata: Metadata = {
  title: "Jenny's Sugar Shack — Handcrafted Cakes & Pastries",
  description:
    "Freshly baked daily. Custom cakes, cupcakes, and pastries made with love in the heart of our community.",
  openGraph: {
    title: "Jenny's Sugar Shack",
    description: "Handcrafted cakes & pastries, made to order.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll>
          <ScrollObserver />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
