import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, MapPin, Briefcase } from "lucide-react";
import { useState } from "react";

const search = z.object({ category: z.string().optional(), city: z.string().optional() });

export const Route = createFileRoute("/artisans/")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Trouver un artisan — ArtisanConnect" }] }),
  component: ArtisansList,
});

function ArtisansList() {
  const { category, city } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [cityInput, setCityInput] = useState(city ?? "");

  const { data: cats } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [],
  });

  const { data: artisans, isLoading } = useQuery({
    queryKey: ["artisans", category, city],
    queryFn: async () => {
      let q = supabase
        .from("artisans")
        .select("id, bio, skills, experience_years, hourly_rate, city, rating_avg, rating_count, category:categories(name, slug), profile:profiles!artisans_id_fkey(full_name, avatar_url, city)")
        .eq("approved", true);
      if (city) q = q.ilike("city", `%${city}%`);
      const { data } = await q;
      let rows = data ?? [];
      if (category) rows = rows.filter((r: any) => r.category?.slug === category);
      return rows;
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Nos artisans</h1>
          <p className="text-muted-foreground mt-2">Découvrez les professionnels disponibles près de chez vous</p>
        </div>

        <Card className="p-4 mb-8 grid md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Métier</Label>
            <Select value={category ?? "all"} onValueChange={(v) => navigate({ search: (s) => ({ ...s, category: v === "all" ? undefined : v }) })}>
              <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les métiers</SelectItem>
                {cats?.map((c) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Ville</Label>
            <Input placeholder="Casablanca, Rabat…" value={cityInput} onChange={(e) => setCityInput(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={() => navigate({ search: (s) => ({ ...s, city: cityInput || undefined }) })}>Rechercher</Button>
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
                    <div className="h-14 w-14 rounded-full gradient-hero text-primary-foreground flex items-center justify-center font-bold text-lg">
                      {a.profile?.full_name?.charAt(0)?.toUpperCase() ?? "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{a.profile?.full_name ?? "Artisan"}</h3>
                      {a.category && <Badge variant="secondary" className="mt-1">{a.category.name}</Badge>}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    {a.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{a.city}</span>}
                    {a.experience_years > 0 && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{a.experience_years} ans</span>}
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
            Aucun artisan trouvé. Modifiez vos filtres ou revenez plus tard.
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
