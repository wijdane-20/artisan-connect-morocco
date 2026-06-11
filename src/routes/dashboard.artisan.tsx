import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Star } from "lucide-react";
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

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("service_requests").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Statut mis à jour"); refetchReq(); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold">Espace artisan</h1>
        {artisan && !artisan.approved && (
          <Card className="mt-4 p-4 border-warning bg-warning/10">
            <p className="text-sm">⏳ Votre profil est en attente de validation par un administrateur.</p>
          </Card>
        )}
        <Tabs defaultValue="requests" className="mt-6">
          <TabsList>
            <TabsTrigger value="requests">Demandes ({requests?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="profile">Mon profil</TabsTrigger>
            <TabsTrigger value="stats">Statistiques</TabsTrigger>
          </TabsList>
          <TabsContent value="requests" className="mt-6 space-y-3">
            {requests && requests.length > 0 ? requests.map((r: any) => (
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
                  </div>
                </div>
              </Card>
            )) : <Card className="p-10 text-center text-muted-foreground">Aucune demande pour l'instant.</Card>}
          </TabsContent>
          <TabsContent value="profile" className="mt-6">
            {artisan && cats && <ArtisanProfileForm artisan={artisan} categories={cats} onSaved={refetch} />}
          </TabsContent>
          <TabsContent value="stats" className="mt-6">
            {artisan && (
              <div className="grid sm:grid-cols-3 gap-4">
                <Card className="p-6"><div className="text-sm text-muted-foreground">Note moyenne</div><div className="text-3xl font-bold mt-1 flex items-center gap-2">{Number(artisan.rating_avg).toFixed(1)}<Star className="h-6 w-6 fill-warning text-warning" /></div></Card>
                <Card className="p-6"><div className="text-sm text-muted-foreground">Avis reçus</div><div className="text-3xl font-bold mt-1">{artisan.rating_count}</div></Card>
                <Card className="p-6"><div className="text-sm text-muted-foreground">Demandes totales</div><div className="text-3xl font-bold mt-1">{requests?.length ?? 0}</div></Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

function ArtisanProfileForm({ artisan, categories, onSaved }: any) {
  const [form, setForm] = useState({
    category_id: artisan.category_id ?? "",
    bio: artisan.bio ?? "",
    skills: (artisan.skills ?? []).join(", "),
    experience_years: artisan.experience_years ?? 0,
    hourly_rate: artisan.hourly_rate ?? "",
    city: artisan.city ?? "",
    available: artisan.available,
  });
  const [saving, setSaving] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("artisans").update({
      category_id: form.category_id || null,
      bio: form.bio,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      experience_years: Number(form.experience_years) || 0,
      hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
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
        <div className="space-y-2">
          <Label>Catégorie</Label>
          <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
            <SelectTrigger><SelectValue placeholder="Choisir un métier" /></SelectTrigger>
            <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Bio</Label><Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Décrivez votre activité…" /></div>
        <div className="space-y-2"><Label>Compétences (séparées par virgules)</Label><Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Installation, dépannage, rénovation" /></div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-2"><Label>Années d'expérience</Label><Input type="number" min="0" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value as any })} /></div>
          <div className="space-y-2"><Label>Tarif horaire (DH)</Label><Input type="number" min="0" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value as any })} /></div>
          <div className="space-y-2"><Label>Ville</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
        </div>
        <div className="flex items-center justify-between border rounded-md p-3">
          <div><Label>Disponible</Label><p className="text-xs text-muted-foreground">Apparaître dans les recherches</p></div>
          <Switch checked={form.available} onCheckedChange={(v) => setForm({ ...form, available: v })} />
        </div>
        <Button type="submit" disabled={saving}>{saving ? "..." : "Enregistrer"}</Button>
      </form>
    </Card>
  );
}
