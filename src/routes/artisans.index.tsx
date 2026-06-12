import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, MapPin, Briefcase, ShieldCheck } from "lucide-react";

const MOROCCAN_CITIES = ["Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir"];

const search = z.object({
  category: z.string().optional(),
  city: z.string().optional(),
  rating: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  available: z.coerce.boolean().optional(),
  verified: z.coerce.boolean().optional(),
});

export const Route = createFileRoute("/artisans/")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Trouver un artisan — ArtisanConnect" }] }),
  component: ArtisansList,
});

function ArtisansList() {
  const { category, city, rating, priceMax, available, verified } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: cats } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [],
  });

  const { data: artisans, isLoading } = useQuery({
    queryKey: ["artisans", category, city, rating, priceMax, available, verified],
    queryFn: async () => {
      let q = supabase
        .from("artisans")
        .select("id, bio, description, profession, skills, experience_years, hourly_rate, price_min, price_max, city, rating_avg, rating_count, available, is_verified, completed_jobs, profile_photo_url, category:categories(name, slug), profile:profiles!artisans_id_fkey(full_name, avatar_url, city)")
        .eq("approved", true)
        .eq("suspended", false);
      if (city) q = q.ilike("city", `%${city}%`);
      if (rating) q = q.gte("rating_avg", rating);
      if (priceMax) q = q.lte("hourly_rate", priceMax);
      if (available) q = q.eq("available", true);
      if (verified) q = q.eq("is_verified", true);
      const { data } = await q;
      let rows = data ?? [];
      if (category) rows = rows.filter((r: any) => r.category?.slug === category);
      return rows;
    },
  });

  const updateSearch = (patch: Record<string, any>) =>
    navigate({ search: (s: any) => ({ ...s, ...patch }) });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Nos artisans</h1>
          <p className="text-muted-foreground mt-2">Filtrez et trouvez le professionnel qu'il vous faut</p>
        </div>

        <Card className="p-4 mb-8 grid md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <Label className="text-xs">Métier</Label>
            <Select value={category ?? "all"} onValueChange={(v) => updateSearch({ category: v === "all" ? undefined : v })}>
              <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les métiers</SelectItem>
                {cats?.map((c) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Ville</Label>
            <Select value={city ?? "all"} onValueChange={(v) => updateSearch({ city: v === "all" ? undefined : v })}>
              <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les villes</SelectItem>
                {MOROCCAN_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Note min.</Label>
            <Select value={rating ? String(rating) : "all"} onValueChange={(v) => updateSearch({ rating: v === "all" ? undefined : Number(v) })}>
              <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="4.5">4.5 ★ +</SelectItem>
                <SelectItem value="4">4 ★ +</SelectItem>
                <SelectItem value="3">3 ★ +</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Prix max (DH/h)</Label>
            <Select value={priceMax ? String(priceMax) : "all"} onValueChange={(v) => updateSearch({ priceMax: v === "all" ? undefined : Number(v) })}>
              <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les prix</SelectItem>
                <SelectItem value="100">≤ 100 DH</SelectItem>
                <SelectItem value="200">≤ 200 DH</SelectItem>
                <SelectItem value="400">≤ 400 DH</SelectItem>
                <SelectItem value="800">≤ 800 DH</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between border rounded-md p-2">
            <Label className="text-xs">Disponible</Label>
            <Switch checked={!!available} onCheckedChange={(v) => updateSearch({ available: v || undefined })} />
          </div>
          <div className="flex items-center justify-between border rounded-md p-2">
            <Label className="text-xs">Vérifiés uniquement</Label>
            <Switch checked={!!verified} onCheckedChange={(v) => updateSearch({ verified: v || undefined })} />
          </div>
          <div className="md:col-span-3 lg:col-span-6 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => navigate({ search: {} as any })}>Réinitialiser les filtres</Button>
          </div>
        </Card>

        {isLoading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : artisans && artisans.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {artisans.map((a: any) => (
              <Link key={a.id} to="/artisans/$id" params={{ id: a.id }}>
                <Card className="p-5 hover:shadow-card transition-all hover:-translate-y-0.5 h-full">
                  <div className="flex items-start gap-3">
                    {a.profile_photo_url || a.profile?.avatar_url ? (
                      <img src={a.profile_photo_url || a.profile.avatar_url} alt={a.profile?.full_name} className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                      <div className="h-14 w-14 rounded-full gradient-hero text-primary-foreground flex items-center justify-center font-bold text-lg">
                        {a.profile?.full_name?.charAt(0)?.toUpperCase() ?? "A"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold truncate">{a.profile?.full_name ?? "Artisan"}</h3>
                        {a.is_verified && <ShieldCheck className="h-4 w-4 text-primary shrink-0" aria-label="Artisan vérifié" />}
                      </div>
                      {a.category && <Badge variant="secondary" className="mt-1">{a.category.name}</Badge>}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    {a.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{a.city}</span>}
                    {a.experience_years > 0 && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{a.experience_years} ans</span>}
                    {a.completed_jobs > 0 && <span>{a.completed_jobs} missions</span>}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-warning text-warning" />{Number(a.rating_avg).toFixed(1)} <span className="text-muted-foreground">({a.rating_count})</span></span>
                    {a.hourly_rate && <span className="text-sm font-semibold text-primary">{a.hourly_rate} DH/h</span>}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center text-muted-foreground">
            Aucun artisan trouvé. Modifiez vos filtres.
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
