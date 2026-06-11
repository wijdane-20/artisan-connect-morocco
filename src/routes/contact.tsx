import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [
    { title: "Contact — ArtisanConnect" },
    { name: "description", content: "Contactez l'équipe ArtisanConnect" },
  ]}),
  component: Contact,
});

function Contact() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold">Contact</h1>
        <p className="text-muted-foreground mt-2">Une question ? Notre équipe vous répond.</p>
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {[
            { i: Mail, t: "Email", v: "contact@artisanconnect.ma" },
            { i: Phone, t: "Téléphone", v: "+212 5XX-XXXXXX" },
            { i: MapPin, t: "Adresse", v: "Casablanca, Maroc" },
          ].map(({ i: Icon, t, v }) => (
            <Card key={t} className="p-6">
              <Icon className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold">{t}</h3>
              <p className="text-sm text-muted-foreground mt-1">{v}</p>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
