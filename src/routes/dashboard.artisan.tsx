import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Star, ShieldCheck, Trash2, Plus, DollarSign, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/dashboard/artisan")({
  head: () => ({ meta: [{ title: "Espace artisan — ArtisanConnect" }] }),
  component: ArtisanDashboard,
});

function ArtisanDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);

  const { data: artisan, refetch } = useQuery({
    enabled: !!user,
    queryKey: ["my-artisan", user?.id],
    queryFn: async () => (await supabase.from("artisans").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  const { data: cats } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [],
  });

  const { data: requests, refetch: refetchReq } = useQuery({
    enabled: !!user,
    queryKey: ["artisan-requests", user?.id],
    queryFn: async () => (await supabase.from("service_requests")
      .select("*, client:profiles!service_requests_client_id_fkey(full_name, phone)")
      .eq("artisan_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: myReviews } = useQuery({
    enabled: !!user,
    queryKey: ["artisan-reviews", user?.id],
    queryFn: async () => (await supabase.from("reviews")
      .select("*, client:profiles!reviews_client_id_fkey(full_name)")
      .eq("artisan_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("service_requests").update({ status: status as any }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Statut mis à jour"); refetchReq(); }
  };

  const pending = (requests ?? []).filter((r: any) => r.status === "pending");
  const accepted = (requests ?? []).filter((r: any) => ["accepted", "in_progress"].includes(r.status));
  const completed = (requests ?? []).filter((r: any) => r.status === "completed");
  const earnings = completed.reduce((sum: number, r: any) => sum + Number(artisan?.hourly_rate ?? 0) * 4, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Espace artisan
              {artisan?.is_verified && <Badge className="bg-primary/15 text-primary border-primary/30" variant="outline"><ShieldCheck className="h-3 w-3 mr-1" />Vérifié</Badge>}
            </h1>
            <p className="text-muted-foreground mt-1">Gérez vos demandes, votre profil et votre vérification.</p>
          </div>
          <Button variant="outline" asChild><Link to="/dashboard/verification"><ShieldCheck className="h-4 w-4 mr-2" />Vérification</Link></Button>
        </div>

        {artisan && !artisan.approved && (
          <Card className="mt-4 p-4 border-warning bg-warning/10">
            <p className="text-sm">⏳ Votre profil est en attente de validation par un administrateur.</p>
          </Card>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          <Stat label="Note moyenne" value={`${Number(artisan?.rating_avg ?? 0).toFixed(1)} ★`} />
          <Stat label="Avis reçus" value={artisan?.rating_count ?? 0} />
          <Stat label="Missions terminées" value={artisan?.completed_jobs ?? 0} icon={<CheckCircle2 className="h-5 w-5 text-success" />} />
          <Stat label="Revenus estimés" value={`${earnings} DH`} icon={<DollarSign className="h-5 w-5 text-primary" />} />
        </div>

        <Tabs defaultValue="requests" className="mt-8">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="requests">Nouvelles ({pending.length})</TabsTrigger>
            <TabsTrigger value="accepted">En cours ({accepted.length})</TabsTrigger>
            <TabsTrigger value="completed">Terminées ({completed.length})</TabsTrigger>
            <TabsTrigger value="reviews">Avis ({myReviews?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="profile">Mon profil</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          </TabsList>

          {[
            { key: "requests", list: pending, empty: "Aucune nouvelle demande." },
            { key: "accepted", list: accepted, empty: "Aucune demande en cours." },
            { key: "completed", list: completed, empty: "Aucune mission terminée." },
          ].map(({ key, list, empty }) => (
            <TabsContent key={key} value={key} className="mt-6 space-y-3">
              {list.length > 0 ? list.map((r: any) => (
                <Card key={r.id} className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap"><h3 className="font-semibold">{r.title}</h3><StatusBadge status={r.status} /></div>
                      <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Client : {r.client?.full_name} {r.client?.phone && `• ${r.client.phone}`} • {r.city ?? "—"} • {r.preferred_date ?? "Date flexible"}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {r.status === "pending" && <>
                        <Button size="sm" onClick={() => updateStatus(r.id, "accepted")}>Accepter</Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "rejected")}>Refuser</Button>
                      </>}
                      {r.status === "accepted" && <Button size="sm" onClick={() => updateStatus(r.id, "in_progress")}>Démarrer</Button>}
                      {r.status === "in_progress" && <Button size="sm" onClick={() => updateStatus(r.id, "completed")}>Terminer</Button>}
                      <Button size="sm" variant="ghost" asChild><Link to="/messages" search={{ peer: r.client_id }}>Message</Link></Button>
                    </div>
                  </div>
                </Card>
              )) : <Card className="p-10 text-center text-muted-foreground">{empty}</Card>}
            </TabsContent>
          ))}

          <TabsContent value="reviews" className="mt-6 space-y-3">
            {myReviews && myReviews.length > 0 ? myReviews.map((r: any) => (
              <Card key={r.id} className="p-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{r.client?.full_name}</span>
                  <span className="flex items-center text-warning">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : "opacity-30"}`} />)}</span>
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
                {r.comment && <p className="text-sm text-muted-foreground mt-2">{r.comment}</p>}
              </Card>
            )) : <Card className="p-10 text-center text-muted-foreground">Aucun avis reçu.</Card>}
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            {artisan && cats && <ArtisanProfileForm artisan={artisan} categories={cats} onSaved={refetch} />}
          </TabsContent>

          <TabsContent value="portfolio" className="mt-6">
            {user && <PortfolioManager artisanId={user.id} />}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: any; icon?: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon ?? <Star className="h-5 w-5 fill-warning text-warning" />}
      </div>
      <div className="text-2xl font-bold mt-2">{value}</div>
    </Card>
  );
}

function ArtisanProfileForm({ artisan, categories, onSaved }: any) {
  const [form, setForm] = useState({
    category_id: artisan.category_id ?? "",
    profession: artisan.profession ?? "",
    description: artisan.description ?? artisan.bio ?? "",
    phone: artisan.phone ?? "",
    profile_photo_url: artisan.profile_photo_url ?? "",
    skills: (artisan.skills ?? []).join(", "),
    experience_years: artisan.experience_years ?? 0,
    hourly_rate: artisan.hourly_rate ?? "",
    price_min: artisan.price_min ?? "",
    price_max: artisan.price_max ?? "",
    city: artisan.city ?? "",
    available: artisan.available,
  });
  const [saving, setSaving] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("artisans").update({
      category_id: form.category_id || null,
      profession: form.profession || null,
      description: form.description,
      bio: form.description,
      phone: form.phone || null,
      profile_photo_url: form.profile_photo_url || null,
      skills: String(form.skills).split(",").map((s: string) => s.trim()).filter(Boolean),
      experience_years: Number(form.experience_years) || 0,
      hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
      price_min: form.price_min ? Number(form.price_min) : null,
      price_max: form.price_max ? Number(form.price_max) : null,
      city: form.city,
      available: form.available,
    }).eq("id", artisan.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Profil enregistré"); onSaved(); }
  };
  return (
    <Card className="p-6">
      <form onSubmit={save} className="space-y-4 max-w-2xl">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choisir un métier" /></SelectTrigger>
              <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Profession (libellé)</Label><Input value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} placeholder="Ex : Plombier certifié" /></div>
        </div>
        <div className="space-y-2"><Label>Description / À propos</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="space-y-2"><Label>Compétences (séparées par virgules)</Label><Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} /></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Téléphone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="space-y-2"><Label>Photo de profil (URL)</Label><Input value={form.profile_photo_url} onChange={(e) => setForm({ ...form, profile_photo_url: e.target.value })} placeholder="https://…" /></div>
        </div>
        <div className="grid sm:grid-cols-4 gap-3">
          <div className="space-y-2"><Label>Années d'exp.</Label><Input type="number" min="0" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value as any })} /></div>
          <div className="space-y-2"><Label>Tarif horaire</Label><Input type="number" min="0" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value as any })} /></div>
          <div className="space-y-2"><Label>Prix min</Label><Input type="number" min="0" value={form.price_min} onChange={(e) => setForm({ ...form, price_min: e.target.value as any })} /></div>
          <div className="space-y-2"><Label>Prix max</Label><Input type="number" min="0" value={form.price_max} onChange={(e) => setForm({ ...form, price_max: e.target.value as any })} /></div>
        </div>
        <div className="space-y-2"><Label>Ville</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
        <div className="flex items-center justify-between border rounded-md p-3">
          <div><Label>Disponible</Label><p className="text-xs text-muted-foreground">Apparaître dans les recherches</p></div>
          <Switch checked={form.available} onCheckedChange={(v) => setForm({ ...form, available: v })} />
        </div>
        <Button type="submit" disabled={saving}>{saving ? "..." : "Enregistrer"}</Button>
      </form>
    </Card>
  );
}

function PortfolioManager({ artisanId }: { artisanId: string }) {
  const { data: items, refetch } = useQuery({
    queryKey: ["my-portfolio", artisanId],
    queryFn: async () => (await supabase.from("portfolio_items").select("*").eq("artisan_id", artisanId).order("created_at", { ascending: false })).data ?? [],
  });
  const [form, setForm] = useState({ image_url: "", title: "", caption: "" });
  const [adding, setAdding] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url) { toast.error("URL d'image requise"); return; }
    setAdding(true);
    const { error } = await supabase.from("portfolio_items").insert({ artisan_id: artisanId, ...form });
    setAdding(false);
    if (error) toast.error(error.message);
    else { setForm({ image_url: "", title: "", caption: "" }); refetch(); toast.success("Ajouté"); }
  };
  const remove = async (id: string) => {
    if (!confirm("Supprimer cette réalisation ?")) return;
    const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
    if (error) toast.error(error.message);
    else refetch();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-semibold mb-3">Ajouter une réalisation</h3>
        <p className="text-xs text-muted-foreground mb-4">Collez l'URL d'une image hébergée (ex : Imgur, Unsplash, votre site).</p>
        <form onSubmit={add} className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2 sm:col-span-2"><Label>URL de l'image</Label><Input required value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" /></div>
          <div className="space-y-2"><Label>Titre</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-2"><Label>Légende</Label><Input value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} /></div>
          <Button type="submit" disabled={adding} className="sm:col-span-2"><Plus className="h-4 w-4 mr-2" />{adding ? "..." : "Ajouter"}</Button>
        </form>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items && items.length > 0 ? items.map((p: any) => (
          <Card key={p.id} className="overflow-hidden group relative">
            <img src={p.image_url} alt={p.title ?? ""} className="w-full aspect-square object-cover" />
            <div className="p-2">
              {p.title && <div className="text-sm font-medium truncate">{p.title}</div>}
              {p.caption && <div className="text-xs text-muted-foreground truncate">{p.caption}</div>}
            </div>
            <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => remove(p.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </Card>
        )) : <p className="col-span-full text-muted-foreground text-sm">Aucune réalisation pour l'instant.</p>}
      </div>
    </div>
  );
}
