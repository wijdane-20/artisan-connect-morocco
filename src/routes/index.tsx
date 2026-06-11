import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search, ShieldCheck, Star, Users, ArrowRight } from "lucide-react";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ArtisanConnect — Trouvez un artisan de confiance au Maroc" },
      { name: "description", content: "Plombiers, électriciens, menuisiers, peintres : trouvez l'artisan qu'il vous faut dans votre ville au Maroc." },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 gradient-soft" />
          <div className="container mx-auto px-4 py-20 md:py-28 relative grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground mb-6">
                <ShieldCheck className="h-3.5 w-3.5" /> Artisans vérifiés au Maroc
              </div>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Trouvez l'artisan qu'il vous faut, <span className="bg-clip-text text-transparent gradient-hero">près de chez vous</span>.
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-xl">
                Plombiers, électriciens, menuisiers, peintres… Réservez un professionnel qualifié en quelques clics, partout au Maroc.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg"><Link to="/artisans">Trouver un artisan <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                <Button asChild size="lg" variant="outline"><Link to="/auth" search={{ mode: "signup" }}>Je suis artisan</Link></Button>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
                <Stat icon={<Users className="h-5 w-5" />} value="500+" label="Artisans" />
                <Stat icon={<Star className="h-5 w-5" />} value="4.8/5" label="Satisfaction" />
                <Stat icon={<Search className="h-5 w-5" />} value="20+" label="Villes" />
              </div>
            </div>
            <div className="relative">
              <img src={hero} alt="Artisan marocain au travail" className="rounded-2xl shadow-elegant w-full object-cover aspect-[4/3]" />
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Nos métiers</h2>
              <p className="text-muted-foreground mt-2">Choisissez la catégorie de service qui vous intéresse</p>
            </div>
            <Button asChild variant="ghost"><Link to="/artisans">Voir tout <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories?.map((c) => (
              <Link key={c.id} to="/artisans" search={{ category: c.slug }}>
                <Card className="p-6 hover:shadow-card transition-all hover:-translate-y-0.5 cursor-pointer h-full">
                  <div className="h-12 w-12 rounded-xl gradient-hero flex items-center justify-center text-primary-foreground mb-4">
                    <span className="text-xl font-bold">{c.name.charAt(0)}</span>
                  </div>
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-muted/40 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold">Comment ça marche ?</h2>
              <p className="text-muted-foreground mt-2">3 étapes pour obtenir l'aide d'un professionnel</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { n: "1", t: "Recherchez", d: "Filtrez les artisans par métier et par ville." },
                { n: "2", t: "Réservez", d: "Décrivez votre besoin et envoyez votre demande." },
                { n: "3", t: "Évaluez", d: "Notez la qualité du travail effectué." },
              ].map((s) => (
                <Card key={s.n} className="p-8 text-center">
                  <div className="h-12 w-12 mx-auto rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold mb-4">{s.n}</div>
                  <h3 className="font-semibold text-lg">{s.t}</h3>
                  <p className="text-muted-foreground mt-2">{s.d}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-primary">{icon}<span className="font-bold text-xl">{value}</span></div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
