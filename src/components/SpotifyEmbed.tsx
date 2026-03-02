import { Music } from "lucide-react";

interface SpotifyTrack {
  id: string;
  type: "track" | "album" | "playlist" | "artist";
  spotifyUri: string;
  title: string;
}

// Add your Spotify track/playlist URIs here
const spotifyItems: SpotifyTrack[] = [
  {
    id: "1",
    type: "playlist",
    spotifyUri: "37i9dQZF1DX5Ejj0EkURtP",
    title: "Lekompo Vibes",
  },
  {
    id: "2",
    type: "playlist",
    spotifyUri: "37i9dQZF1DWYkaDif7Ztbx",
    title: "South African House",
  },
];

const SpotifyEmbed = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Stream Now
          </span>
          <h2 className="font-display text-5xl md:text-6xl mt-2">
            LISTEN ON <span className="text-gradient">SPOTIFY</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Stream our curated playlists and latest releases on Spotify
          </p>
        </div>

        {/* Spotify Embeds */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {spotifyItems.map((item) => (
            <div key={item.id} className="rounded-2xl overflow-hidden">
              <iframe
                src={`https://open.spotify.com/embed/${item.type}/${item.spotifyUri}?utm_source=generator&theme=0`}
                width="100%"
                height="352"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title={item.title}
                className="rounded-xl"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpotifyEmbed;
