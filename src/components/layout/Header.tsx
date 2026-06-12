import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Hammer, LogOut, LayoutDashboard, MessageCircle } from "lucide-react";

export function Header() {
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();

  const dashPath =
    roles.includes("admin") ? "/dashboard/admin" :
    roles.includes("artisan") ? "/dashboard/artisan" : "/dashboard/client";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-hero text-primary-foreground">
            <Hammer className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">ArtisanConnect</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/artisans" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Artisans</Link>
          <Link to="/reviews" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Avis</Link>
          <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/messages"><MessageCircle className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to={dashPath}><LayoutDashboard className="mr-2 h-4 w-4" />Espace</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/auth">Connexion</Link></Button>
              <Button asChild size="sm"><Link to="/auth" search={{ mode: "signup" }}>Inscription</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
