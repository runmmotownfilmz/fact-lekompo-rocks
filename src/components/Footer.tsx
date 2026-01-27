import { Music, Instagram, Youtube, Twitter, Facebook, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      {/* Newsletter Section */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="font-display text-3xl mb-4">
              JOIN THE <span className="text-gradient">MOVEMENT</span>
            </h3>
            <p className="text-muted-foreground mb-6">
              Subscribe to get exclusive updates on events, new beats, and Lekompo culture.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 h-12 px-4 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none transition-colors"
              />
              <Button variant="hero" size="lg">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <a href="#home" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Music className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-xl tracking-wide">FACT</span>
                <span className="text-xs text-primary -mt-1">LEKOMPO ROCKS</span>
              </div>
            </a>
            <p className="text-sm text-muted-foreground mb-4">
              The home of Lekompo music culture. From Limpopo to the world.
            </p>
            <div className="flex gap-3">
              {[Instagram, Youtube, Twitter, Facebook].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full bg-muted hover:bg-primary transition-colors flex items-center justify-center group"
                >
                  <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {["Events", "Lifestyle", "Beat Exchange", "Merch", "Podcast"].map(
                (link) => (
                  <li key={link}>
                    <a
                      href={`#${link.toLowerCase().replace(" ", "-")}`}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display text-lg mb-4">Support</h4>
            <ul className="space-y-2">
              {["Contact Us", "FAQs", "Shipping & Returns", "Terms of Service", "Privacy Policy"].map(
                (link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                info@factlekomporocks.co.za
              </li>
              <li>Polokwane, Limpopo</li>
              <li>South Africa</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 Fact Lekompo Rocks. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Made with ❤️ in Limpopo
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
