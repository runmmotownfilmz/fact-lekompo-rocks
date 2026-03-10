import { useState } from "react";
import { BookOpen, Scale, Shield, DollarSign, FileText, Globe, ChevronDown, ChevronUp, GraduationCap, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";

interface Module {
  id: string;
  icon: React.ReactNode;
  title: string;
  category: string;
  description: string;
  lessons: { title: string; content: string }[];
}

const modules: Module[] = [
  {
    id: "copyright",
    icon: <Shield className="w-6 h-6" />,
    title: "Copyright & Ownership",
    category: "Legal",
    description: "Understand how copyright protects your music from the moment it's created.",
    lessons: [
      {
        title: "What is Copyright?",
        content:
          "Copyright is an automatic legal right that protects your original musical works the moment they are fixed in a tangible form — such as a recording or written score. You don't need to register to own copyright, but registration provides stronger legal protection and is required before filing a lawsuit in many jurisdictions.",
      },
      {
        title: "Types of Music Copyright",
        content:
          "There are two main copyrights in music: (1) The composition copyright — covering the melody, lyrics, and arrangement (owned by the songwriter/composer). (2) The sound recording copyright — covering the specific recorded version (owned by the artist or label). Understanding both is key to protecting your work and earning royalties.",
      },
      {
        title: "How to Register Your Copyright",
        content:
          "In the US, register through the U.S. Copyright Office (copyright.gov). In South Africa, use the Companies and Intellectual Property Commission (CIPC). Many countries have similar bodies. Registration creates a public record and allows you to pursue statutory damages if your work is infringed.",
      },
    ],
  },
  {
    id: "licensing",
    icon: <FileText className="w-6 h-6" />,
    title: "Music Licensing",
    category: "Business",
    description: "Learn how licensing works so you can earn from sync, samples, and placements.",
    lessons: [
      {
        title: "Types of Music Licenses",
        content:
          "Key license types include: Sync License (for TV, film, ads, games), Mechanical License (for reproducing compositions), Master License (for using a specific recording), Performance License (for public performance — radio, venues, streaming), and Print License (for sheet music). Each license unlocks a different revenue stream.",
      },
      {
        title: "Sync Licensing Explained",
        content:
          "Sync licensing is when your music is paired with visual media. It requires two licenses: a sync license from the composition owner and a master license from the recording owner. Sync placements in films, TV shows, and commercials can generate significant one-time fees plus ongoing royalties. Music libraries and sync agents can help you get placements.",
      },
      {
        title: "Negotiating License Deals",
        content:
          "Always clarify: the scope of use (territory, duration, media), exclusivity vs. non-exclusive rights, upfront fees vs. royalty-only deals, and credit/attribution requirements. Never sign away all rights without understanding the long-term implications. Consult an entertainment lawyer for high-value deals.",
      },
    ],
  },
  {
    id: "ip",
    icon: <Scale className="w-6 h-6" />,
    title: "Intellectual Property (IP)",
    category: "Legal",
    description: "Protect your brand, beats, and creative assets with IP knowledge.",
    lessons: [
      {
        title: "IP Basics for Musicians",
        content:
          "Intellectual property in music includes copyrights (your songs and recordings), trademarks (your artist name, logo, brand identity), and trade secrets (unreleased music, business strategies). Understanding IP helps you protect your creative and commercial assets from unauthorized use.",
      },
      {
        title: "Trademarks for Artists",
        content:
          "Your artist name, logo, and brand slogans can be trademarked. This prevents others from using similar names in the music industry, protects your merchandise branding, and gives you legal recourse against impersonators. File trademark applications through your country's IP office.",
      },
      {
        title: "Handling IP Disputes",
        content:
          "If someone uses your music without permission, start with a cease-and-desist letter. For online platforms, file a DMCA takedown notice. For serious infringement, consult an IP attorney. Document everything — timestamps, registrations, and proof of original creation are your best evidence.",
      },
    ],
  },
  {
    id: "royalties",
    icon: <DollarSign className="w-6 h-6" />,
    title: "Royalties & Revenue",
    category: "Business",
    description: "Understand every type of royalty and how to collect what you're owed.",
    lessons: [
      {
        title: "Types of Royalties",
        content:
          "Musicians can earn: Mechanical royalties (from reproductions/streams of compositions), Performance royalties (from radio, live venues, streaming), Sync royalties (from visual media placements), Print royalties (from sheet music), and Master royalties (from use of specific recordings). Each flows through different channels.",
      },
      {
        title: "Collecting Your Royalties",
        content:
          "Register with a Performing Rights Organization (PRO) like ASCAP, BMI, SAMRO, or CAPASSO. Use a distributor (DistroKid, TuneCore, CD Baby) for streaming mechanicals. Register with SoundExchange for digital performance royalties. Consider a publishing administrator to collect global royalties you might miss.",
      },
      {
        title: "Understanding Streaming Payouts",
        content:
          "Streaming platforms pay per-stream rates that vary by country, subscription tier, and market share. Spotify pays roughly $0.003–$0.005 per stream. Apple Music pays slightly more. Focus on growing consistent listeners rather than viral one-off plays. Playlisting, fan engagement, and catalog depth all increase streaming revenue over time.",
      },
    ],
  },
  {
    id: "distribution",
    icon: <Globe className="w-6 h-6" />,
    title: "Music Distribution",
    category: "Industry",
    description: "Get your music on every major platform and understand distribution deals.",
    lessons: [
      {
        title: "Digital Distribution Basics",
        content:
          "Digital distributors deliver your music to streaming platforms (Spotify, Apple Music, Deezer, Tidal, etc.) and digital stores. Popular options include DistroKid (annual fee, unlimited uploads), TuneCore (per-release fee), CD Baby (one-time fee), and AWAL (selective, no upfront cost). Compare pricing, royalty splits, and additional services.",
      },
      {
        title: "ISRC & UPC Codes",
        content:
          "ISRC (International Standard Recording Code) is a unique identifier for each recording — essential for tracking royalties across platforms. UPC/EAN codes identify your release as a product (album or single). Most distributors provide these automatically, but you can also obtain ISRCs directly from your national ISRC agency.",
      },
      {
        title: "Release Strategy",
        content:
          "Plan releases 4–6 weeks ahead. Submit to distributors early to allow time for playlist pitching. Build anticipation with pre-saves, teasers, and social media campaigns. Consider releasing singles before an album to build momentum. Consistent releases keep you in algorithmic recommendations.",
      },
    ],
  },
  {
    id: "contracts",
    icon: <BookOpen className="w-6 h-6" />,
    title: "Contracts & Agreements",
    category: "Legal",
    description: "Navigate record deals, producer agreements, and collaboration splits.",
    lessons: [
      {
        title: "Record Deal Types",
        content:
          "Major deal types: Major label deal (large advance, label owns masters, lower royalty rate), Independent label deal (smaller advance, negotiable ownership), Distribution deal (you keep ownership, label handles distribution), and 360 deal (label takes a cut of all revenue — music, touring, merch). Each has trade-offs between support and control.",
      },
      {
        title: "Producer & Collaboration Agreements",
        content:
          "Always have written agreements for collaborations. Key terms to define: songwriting splits (who wrote what percentage), producer royalty points (typically 2–5% of retail), beat lease vs. exclusive rights terms, credit and naming conventions, and who controls the master recording.",
      },
      {
        title: "Key Contract Clauses to Watch",
        content:
          "Watch for: Term length (how long the deal lasts), Option periods (label's right to extend), Territory (where the deal applies), Advance recoupment (what the label recoups before you earn), Reversion clauses (when rights return to you), and Audit rights (your ability to verify accounting). Never sign without understanding every clause.",
      },
    ],
  },
];

const Learn = () => {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  const toggleModule = (id: string) => {
    setExpandedModule(expandedModule === id ? null : id);
    setExpandedLesson(null);
  };

  const toggleLesson = (key: string) => {
    setExpandedLesson(expandedLesson === key ? null : key);
  };

  const categoryColors: Record<string, string> = {
    Legal: "bg-destructive/10 text-destructive",
    Business: "bg-primary/10 text-primary",
    Industry: "bg-accent/10 text-accent-foreground",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <GraduationCap className="w-4 h-4" />
              <span className="text-sm font-medium">Artist Academy</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl mb-4">
              LEARN THE <span className="text-primary">BUSINESS</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Master the business side of music. From copyright law to royalty collection,
              these modules will help you protect your art and maximize your earnings.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <Card className="bg-card border-border text-center">
              <CardContent className="p-4">
                <p className="text-2xl font-display text-primary">{modules.length}</p>
                <p className="text-xs text-muted-foreground">Modules</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border text-center">
              <CardContent className="p-4">
                <p className="text-2xl font-display text-primary">
                  {modules.reduce((sum, m) => sum + m.lessons.length, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Lessons</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border text-center">
              <CardContent className="p-4">
                <div className="flex justify-center">
                  <Lightbulb className="w-6 h-6 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">Free Access</p>
              </CardContent>
            </Card>
          </div>

          {/* Modules */}
          <div className="space-y-4">
            {modules.map((mod) => (
              <Card
                key={mod.id}
                className={`bg-card border-border transition-all duration-300 ${
                  expandedModule === mod.id ? "ring-1 ring-primary/30" : ""
                }`}
              >
                <CardHeader
                  className="cursor-pointer select-none"
                  onClick={() => toggleModule(mod.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {mod.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg font-display tracking-wide">
                            {mod.title.toUpperCase()}
                          </CardTitle>
                          <Badge variant="secondary" className={categoryColors[mod.category] || ""}>
                            {mod.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{mod.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {mod.lessons.length} lessons
                        </p>
                      </div>
                    </div>
                    {expandedModule === mod.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                    )}
                  </div>
                </CardHeader>

                {expandedModule === mod.id && (
                  <CardContent className="pt-0 space-y-3">
                    {mod.lessons.map((lesson, idx) => {
                      const lessonKey = `${mod.id}-${idx}`;
                      return (
                        <div
                          key={lessonKey}
                          className="border border-border rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => toggleLesson(lessonKey)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-medium text-sm">{lesson.title}</span>
                            </div>
                            {expandedLesson === lessonKey ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                          </button>
                          {expandedLesson === lessonKey && (
                            <div className="px-4 pb-4 pt-0">
                              <div className="pl-10 text-sm text-muted-foreground leading-relaxed">
                                {lesson.content}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learn;
