import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Menu from "@/components/Menu";
import SocialFeed from "@/components/SocialFeed";
import Testimonials from "@/components/Testimonials";
import OrderBanner from "@/components/OrderBanner";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Menu />
        <SocialFeed />
        <Testimonials />
        <OrderBanner />
      </main>
      <Footer />
    </>
  );
}
