import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, Upload, User, LogOut, BarChart3, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { CartDrawer } from "@/components/CartDrawer";
import NotificationBell from "@/components/NotificationBell";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

const navLinks = [
  { name: "Home", href: "#home" },
  { name: "Events", href: "#billboards" },
  { name: "Discover", href: "/discover", isRoute: true },
  { name: "Beat Exchange", href: "#beats" },
  { name: "Playlists", href: "/playlists", isRoute: true },
  { name: "Merch", href: "#merch" },
  { name: "Learn", href: "/learn", isRoute: true },
  { name: "Podcast", href: "#podcast" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { setPendingCount(0); return; }
    const fetchPending = async () => {
      const { count } = await supabase
        .from("project_collaborators")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");
      setPendingCount(count || 0);
    };
    fetchPending();
    const channel = supabase
      .channel("navbar-invites")
      .on("postgres_changes", { event: "*", schema: "public", table: "project_collaborators" }, fetchPending)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

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
            <img src={logo} alt="FACT Lekompo Rocks" className="h-12 w-auto group-hover:scale-110 transition-transform" />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              (link as any).isRoute ? (
                <span
                  key={link.name}
                  onClick={() => navigate(link.href)}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  {link.name}
                </span>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.name}
                </a>
              )
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
           <CartDrawer />
            {user && <NotificationBell />}
            {user ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/dashboard")}
                  className="relative"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                      {pendingCount}
                    </span>
                  )}
                </Button>
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
              {navLinks.map((link) =>
                (link as any).isRoute ? (
                  <span
                    key={link.name}
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                    onClick={() => { navigate(link.href); setIsOpen(false); }}
                  >
                    {link.name}
                  </span>
                ) : (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </a>
              )
              )}
              
              <div className="border-t border-border pt-4 mt-2 flex flex-col gap-3">
               <div className="flex justify-center gap-2 mb-2">
                 <CartDrawer />
                 {user && <NotificationBell />}
               </div>
                {user ? (
                  <>
                    <Button
                      variant="ghost"
                      className="relative"
                      onClick={() => {
                        navigate("/dashboard");
                        setIsOpen(false);
                      }}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Dashboard
                      {pendingCount > 0 && (
                        <span className="ml-2 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                          {pendingCount}
                        </span>
                      )}
                    </Button>
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
