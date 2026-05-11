import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import WhyUs from "@/components/WhyUs";
import About from "@/components/About";
import SocialFeed from "@/components/SocialFeed";
import Reviews from "@/components/Reviews";
import Merch from "@/components/Merch";
import OrderBanner from "@/components/OrderBanner";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Categories />
        <WhyUs />
        <About />
        <SocialFeed />
        <Reviews />
        <Merch />
        <OrderBanner />
      </main>
      <Footer />
    </>
  );
}
