import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Events from "@/components/Events";
import EventBillboards from "@/components/EventBillboards";
import Lifestyle from "@/components/Lifestyle";
import BeatExchange from "@/components/BeatExchange";
import Merch from "@/components/Merch";
 import YouTubeBillboard from "@/components/YouTubeBillboard";
import Podcast from "@/components/Podcast";
import SponsorsMarquee from "@/components/SponsorsMarquee";
import Footer from "@/components/Footer";
 import { useCartSync } from "@/hooks/useCartSync";

const Index = () => {
   useCartSync();
 
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <EventBillboards />
      <Events />
      <SponsorsMarquee />
      <Lifestyle />
      <BeatExchange />
      <Merch />
       <YouTubeBillboard />
      <Podcast />
      <Footer />
    </div>
  );
};

export default Index;
