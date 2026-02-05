 import { Play, ExternalLink } from "lucide-react";
 import { Button } from "@/components/ui/button";
 
 interface YouTubeVideo {
   id: string;
   title: string;
   description: string;
   embedUrl: string;
   watchUrl: string;
 }
 
 const featuredVideos: YouTubeVideo[] = [
   {
     id: "Kw4pA2pZd6M",
     title: "Latest Music Video",
     description: "Check out our latest Lekompo music video shoot! Experience the culture, the vibe, and the movement.",
     embedUrl: "https://www.youtube.com/embed/Kw4pA2pZd6M",
     watchUrl: "https://youtube.com/shorts/Kw4pA2pZd6M",
   },
 ];
 
 const YouTubeBillboard = () => {
   return (
     <section id="videos" className="py-20 bg-muted/30">
       <div className="container mx-auto px-4">
         {/* Section Header */}
         <div className="text-center mb-12">
           <span className="text-primary font-medium text-sm uppercase tracking-wider">
             Watch Now
           </span>
           <h2 className="font-display text-5xl md:text-6xl mt-2">
             MUSIC <span className="text-gradient">VIDEOS</span>
           </h2>
           <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
             Experience the Lekompo movement through our official music video productions
           </p>
         </div>
 
         {/* Featured Video Grid */}
         <div className="grid lg:grid-cols-2 gap-8 items-center">
           {/* Video Embed */}
           <div className="relative rounded-2xl overflow-hidden aspect-[9/16] max-w-[400px] mx-auto lg:mx-0 shadow-2xl shadow-primary/20">
             <iframe
               src={`${featuredVideos[0].embedUrl}?autoplay=0&loop=1&playlist=${featuredVideos[0].id}`}
               title={featuredVideos[0].title}
               className="absolute inset-0 w-full h-full"
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
               allowFullScreen
             />
           </div>
 
           {/* Video Info */}
           <div className="text-center lg:text-left">
             <div className="inline-flex items-center gap-2 bg-destructive/20 text-destructive px-4 py-2 rounded-full mb-4">
               <Play className="w-4 h-4 fill-current" />
               <span className="text-sm font-semibold">Featured Video</span>
             </div>
             
             <h3 className="font-display text-3xl md:text-4xl mb-4">
               {featuredVideos[0].title}
             </h3>
             
             <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto lg:mx-0">
               {featuredVideos[0].description}
             </p>
 
             <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
               <Button
                 variant="hero"
                 size="xl"
                 onClick={() => window.open(featuredVideos[0].watchUrl, "_blank")}
               >
                 <Play className="w-5 h-5" />
                 Watch on YouTube
               </Button>
               <Button
                 variant="outline"
                 size="xl"
                 onClick={() => window.open("https://www.youtube.com/@FactLekompoRocks", "_blank")}
               >
                 <ExternalLink className="w-5 h-5" />
                 Subscribe
               </Button>
             </div>
 
             {/* Stats */}
             <div className="flex gap-8 mt-8 justify-center lg:justify-start">
               <div>
                 <span className="font-display text-2xl text-primary">1K+</span>
                 <p className="text-sm text-muted-foreground">Views</p>
               </div>
               <div>
                 <span className="font-display text-2xl text-primary">50+</span>
                 <p className="text-sm text-muted-foreground">Shares</p>
               </div>
               <div>
                 <span className="font-display text-2xl text-primary">100+</span>
                 <p className="text-sm text-muted-foreground">Likes</p>
               </div>
             </div>
           </div>
         </div>
       </div>
     </section>
   );
 };
 
 export default YouTubeBillboard;