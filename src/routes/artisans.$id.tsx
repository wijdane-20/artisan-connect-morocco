import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Briefcase, Phone, Calendar, ShieldCheck, MessageCircle, CheckCircle2 } from "lucide-react";
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
    queryFn: async () => (await supabase.from("artisans")
      .select("*, category:categories(name, slug), profile:profiles!artisans_id_fkey(full_name, phone, avatar_url, city)")
      .eq("id", id).maybeSingle()).data,
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => (await supabase.from("reviews")
      .select("*, client:profiles!reviews_client_id_fkey(full_name)")
      .eq("artisan_id", id).order("created_at", { ascending: false }).limit(50)).data ?? [],
  });

  const { data: portfolio } = useQuery({
    queryKey: ["portfolio", id],
    queryFn: async () => (await supabase.from("portfolio_items").select("*").eq("artisan_id", id).order("created_at", { ascending: false })).data ?? [],
  });

  if (isLoading) return <Shell>Chargement…</Shell>;
  if (!data) return <Shell>Artisan introuvable.</Shell>;

  const a: any = data;
  const phone = a.phone || a.profile?.phone;
  const photo = a.profile_photo_url || a.profile?.avatar_url;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <Link to="/artisans" className="text-sm text-muted-foreground hover:text-foreground">← Retour aux artisans</Link>
        <div className="grid lg:grid-cols-3 gap-6 mt-4">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-start gap-4 flex-wrap">
                {photo ? (
                  <img src={photo} alt={a.profile?.full_name} className="h-24 w-24 rounded-full object-cover" />
                ) : (
                  <div className="h-24 w-24 rounded-full gradient-hero text-primary-foreground flex items-center justify-center text-3xl font-bold">
                    {a.profile?.full_name?.charAt(0)?.toUpperCase() ?? "A"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold">{a.profile?.full_name}</h1>
                    {a.is_verified && (
                      <Badge className="bg-primary/15 text-primary border-primary/30" variant="outline">
                        <ShieldCheck className="h-3 w-3 mr-1" /> Artisan vérifié
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1">{a.profession ?? a.category?.name}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {a.city && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{a.city}</span>}
                    {a.experience_years > 0 && <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{a.experience_years} ans d'expérience</span>}
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-success" />{a.completed_jobs ?? 0} missions</span>
                    <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-warning text-warning" />{Number(a.rating_avg).toFixed(1)} ({a.rating_count} avis)</span>
                  </div>
                </div>
              </div>
              {(a.description || a.bio) && <><h2 className="font-semibold mt-6 mb-2">À propos</h2><p className="text-muted-foreground whitespace-pre-line">{a.description || a.bio}</p></>}
              {a.skills && a.skills.length > 0 && (
                <>
                  <h2 className="font-semibold mt-6 mb-2">Compétences</h2>
                  <div className="flex flex-wrap gap-2">{a.skills.map((s: string) => <Badge key={s} variant="outline">{s}</Badge>)}</div>
                </>
              )}
            </Card>

            {portfolio && portfolio.length > 0 && (
              <Card className="p-6">
                <h2 className="font-semibold mb-4">Galerie de réalisations</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {portfolio.map((p: any) => (
                    <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
                      <img src={p.image_url} alt={p.title ?? "Réalisation"} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      {p.title && <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white text-xs">{p.title}</div>}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-6">
              <h2 className="font-semibold mb-4">Avis clients ({reviews?.length ?? 0})</h2>
              {reviews && reviews.length > 0 ? (
                <div className="space-y-5">
                  {reviews.map((r: any) => (
                    <div key={r.id} className="border-l-2 border-primary pl-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{r.client?.full_name ?? "Client"}</span>
                        <span className="flex items-center text-warning">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : "opacity-30"}`} />
                          ))}
                        </span>
                        <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
                      </div>
                      {r.comment && <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">Aucun avis pour le moment.</p>}
            </Card>
          </div>

          <Card className="p-6 h-fit lg:sticky lg:top-20">
            {a.hourly_rate && <div className="mb-4"><span className="text-3xl font-bold text-primary">{a.hourly_rate} DH</span><span className="text-muted-foreground">/heure</span></div>}
            {a.price_min && a.price_max && (
              <div className="text-sm text-muted-foreground mb-4">Fourchette : {a.price_min} – {a.price_max} DH</div>
            )}
            <Button className="w-full" size="lg" onClick={() => user ? navigate({ to: "/requests/new", search: { artisan_id: id } }) : navigate({ to: "/auth" })}>
              <Calendar className="mr-2 h-4 w-4" />Réserver maintenant
            </Button>
            {user && user.id !== id && (
              <Button variant="outline" className="w-full mt-2" onClick={() => navigate({ to: "/messages", search: { peer: id } })}>
                <MessageCircle className="mr-2 h-4 w-4" />Envoyer un message
              </Button>
            )}
            {phone && user && (
              <Button variant="outline" className="w-full mt-2" asChild>
                <a href={`tel:${phone}`}><Phone className="mr-2 h-4 w-4" />{phone}</a>
              </Button>
            )}
            <div className="mt-4 text-xs">
              {a.available ? <span className="text-success">● Disponible</span> : <span className="text-muted-foreground">● Indisponible</span>}
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">{children}</main>
      <Footer />
    </div>
  );
}
