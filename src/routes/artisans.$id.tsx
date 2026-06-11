import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Briefcase, Phone, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/artisans/$id")({
  head: () => ({ meta: [{ title: "Profil artisan — ArtisanConnect" }] }),
  component: ArtisanDetail,
});

function ArtisanDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["artisan", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("artisans")
        .select("*, category:categories(name, slug), profile:profiles!artisans_id_fkey(full_name, phone, avatar_url, city)")
        .eq("id", id).maybeSingle();
      return data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*, client:profiles!reviews_client_id_fkey(full_name)")
        .eq("artisan_id", id).order("created_at", { ascending: false }).limit(20);
      return data ?? [];
    },
  });

  if (isLoading) return <div className="min-h-screen flex flex-col"><Header /><main className="flex-1 container mx-auto px-4 py-10">Chargement…</main><Footer /></div>;
  if (!data) return <div className="min-h-screen flex flex-col"><Header /><main className="flex-1 container mx-auto px-4 py-10">Artisan introuvable.</main><Footer /></div>;

  const a: any = data;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <Link to="/artisans" className="text-sm text-muted-foreground hover:text-foreground">← Retour aux artisans</Link>
        <div className="grid lg:grid-cols-3 gap-6 mt-4">
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-full gradient-hero text-primary-foreground flex items-center justify-center text-2xl font-bold">
                {a.profile?.full_name?.charAt(0)?.toUpperCase() ?? "A"}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{a.profile?.full_name}</h1>
                {a.category && <Badge variant="secondary" className="mt-2">{a.category.name}</Badge>}
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {a.city && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{a.city}</span>}
                  {a.experience_years > 0 && <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{a.experience_years} ans d'expérience</span>}
                  <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-warning text-warning" />{Number(a.rating_avg).toFixed(1)} ({a.rating_count} avis)</span>
                </div>
              </div>
            </div>
            {a.bio && <><h2 className="font-semibold mt-6 mb-2">À propos</h2><p className="text-muted-foreground whitespace-pre-line">{a.bio}</p></>}
            {a.skills && a.skills.length > 0 && (
              <>
                <h2 className="font-semibold mt-6 mb-2">Compétences</h2>
                <div className="flex flex-wrap gap-2">{a.skills.map((s: string) => <Badge key={s} variant="outline">{s}</Badge>)}</div>
              </>
            )}
            <h2 className="font-semibold mt-8 mb-4">Avis clients</h2>
            {reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((r: any) => (
                  <div key={r.id} className="border-l-2 border-primary pl-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{r.client?.full_name ?? "Client"}</span>
                      <span className="flex items-center text-warning text-xs">
                        {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                      </span>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Aucun avis pour le moment.</p>}
          </Card>

          <Card className="p-6 h-fit sticky top-20">
            {a.hourly_rate && <div className="mb-4"><span className="text-3xl font-bold text-primary">{a.hourly_rate} DH</span><span className="text-muted-foreground">/heure</span></div>}
            <Button className="w-full" size="lg" onClick={() => user ? navigate({ to: "/requests/new", search: { artisan_id: id } }) : navigate({ to: "/auth" })}>
              <Calendar className="mr-2 h-4 w-4" />Demander un service
            </Button>
            {a.profile?.phone && user && <Button variant="outline" className="w-full mt-2" asChild><a href={`tel:${a.profile.phone}`}><Phone className="mr-2 h-4 w-4" />{a.profile.phone}</a></Button>}
            <div className="mt-4 text-xs text-muted-foreground">
              {a.available ? <span className="text-success">● Disponible</span> : <span>● Indisponible</span>}
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
