import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Events from "@/components/Events";
import Lifestyle from "@/components/Lifestyle";
import BeatExchange from "@/components/BeatExchange";
import Merch from "@/components/Merch";
import Podcast from "@/components/Podcast";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Events />
      <Lifestyle />
      <BeatExchange />
      <Merch />
      <Podcast />
      <Footer />
    </div>
  );
};

export default Index;
