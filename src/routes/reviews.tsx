import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Star, Quote } from "lucide-react";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Avis clients — ArtisanConnect" },
      { name: "description", content: "Découvrez les avis et témoignages des clients sur les artisans d'ArtisanConnect au Maroc." },
    ],
  }),
  component: ReviewsPage,
});

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  artisan_id: string;
  client_id: string;
};

function ReviewsPage() {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews", "all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, artisan_id, client_id")
        .order("created_at", { ascending: false })
        .limit(60);
      return (data ?? []) as ReviewRow[];
    },
  });

  const ids = Array.from(new Set([...(reviews ?? []).map((r) => r.artisan_id), ...(reviews ?? []).map((r) => r.client_id)]));
  const { data: profiles } = useQuery({
    queryKey: ["profiles", "by-ids", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, city").in("id", ids);
      const map = new Map<string, { full_name: string; city: string | null }>();
      (data ?? []).forEach((p: any) => map.set(p.id, { full_name: p.full_name, city: p.city }));
      return map;
    },
  });

  const avg = reviews && reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="border-b bg-accent/30">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <h1 className="text-3xl md:text-5xl font-bold">Avis clients</h1>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              Les retours de la communauté ArtisanConnect — pour vous aider à choisir l'artisan qui vous convient.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
                <span className="text-2xl font-bold">{avg}</span>
                <span className="text-muted-foreground">/ 5</span>
              </div>
              <Badge variant="secondary">{reviews?.length ?? 0} avis</Badge>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          {isLoading ? (
            <p className="text-muted-foreground">Chargement…</p>
          ) : reviews && reviews.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((r) => {
                const artisan = profiles?.get(r.artisan_id);
                const client = profiles?.get(r.client_id);
                return (
                  <Card key={r.id} className="p-6 flex flex-col gap-4">
                    <Quote className="h-6 w-6 text-primary/40" />
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed flex-1">{r.comment || "Excellent service."}</p>
                    <div className="pt-4 border-t text-sm">
                      <div className="font-medium">{client?.full_name || "Client"}</div>
                      <div className="text-muted-foreground">
                        Pour{" "}
                        <Link to="/artisans/$id" params={{ id: r.artisan_id }} className="text-primary hover:underline">
                          {artisan?.full_name || "un artisan"}
                        </Link>
                        {artisan?.city ? ` · ${artisan.city}` : ""}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Aucun avis pour le moment. Soyez le premier à laisser un témoignage après une prestation.</p>
            </Card>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
