import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-20">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-4">
        <div>
          <h3 className="font-bold mb-3">ArtisanConnect</h3>
          <p className="text-sm text-muted-foreground">La plateforme qui connecte les particuliers aux meilleurs artisans du Maroc.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Navigation</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Accueil</Link></li>
            <li><Link to="/artisans" className="hover:text-foreground">Artisans</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Vous êtes artisan ?</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth" search={{ mode: "signup" }} className="hover:text-foreground">Rejoindre la plateforme</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Contact</h4>
          <p className="text-sm text-muted-foreground">contact@artisanconnect.ma<br />+212 5XX-XXXXXX</p>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ArtisanConnect. Tous droits réservés.
      </div>
    </footer>
  );
}
