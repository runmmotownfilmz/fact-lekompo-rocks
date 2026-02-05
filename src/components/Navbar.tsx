import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, Music, Upload, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
 import { CartDrawer } from "@/components/CartDrawer";

const navLinks = [
  { name: "Home", href: "#home" },
  { name: "Events", href: "#billboards" },
  { name: "Lifestyle", href: "#lifestyle" },
  { name: "Beat Exchange", href: "#beats" },
  { name: "Merch", href: "#merch" },
   { name: "Videos", href: "#videos" },
  { name: "Podcast", href: "#podcast" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
              <Music className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl tracking-wide text-foreground">FACT</span>
              <span className="text-xs text-primary -mt-1">LEKOMPO ROCKS</span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
           <CartDrawer />
            {user ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate("/upload")}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/auth")}
                >
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
                <Button variant="hero" size="lg">
                  Get Tickets
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              
              <div className="border-t border-border pt-4 mt-2 flex flex-col gap-3">
               <div className="flex justify-center mb-2">
                 <CartDrawer />
               </div>
                {user ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigate("/upload");
                        setIsOpen(false);
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Music
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigate("/auth");
                        setIsOpen(false);
                      }}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Sign In / Sign Up
                    </Button>
                    <Button variant="hero" size="lg">
                      Get Tickets
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
