import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Calendar as CalendarIcon } from "lucide-react";

const MOROCCAN_CITIES = ["Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir"];
const search = z.object({ artisan_id: z.string() });

export const Route = createFileRoute("/requests/new")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Réserver — ArtisanConnect" }] }),
  component: NewRequest,
});

function NewRequest() {
  const { artisan_id } = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", phone: "", city: "", title: "", description: "", preferred_date: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!authLoading && !user) navigate({ to: "/auth" }); }, [user, authLoading, navigate]);

  const { data: artisan } = useQuery({
    queryKey: ["artisan-mini", artisan_id],
    queryFn: async () => (await supabase.from("artisans").select("category_id, profession, profile:profiles!artisans_id_fkey(full_name)").eq("id", artisan_id).maybeSingle()).data,
  });

  const { data: myProfile } = useQuery({
    enabled: !!user,
    queryKey: ["my-profile", user?.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  useEffect(() => {
    if (myProfile) setForm((f) => ({ ...f, full_name: f.full_name || myProfile.full_name || "", phone: f.phone || myProfile.phone || "", city: f.city || myProfile.city || "" }));
  }, [myProfile]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = z.object({
      full_name: z.string().min(2, "Nom requis").max(100),
      phone: z.string().min(6, "Téléphone requis").max(30),
      city: z.string().min(2, "Ville requise").max(60),
      title: z.string().min(3, "Titre court (min 3)").max(120),
      description: z.string().min(10, "Description trop courte").max(2000),
      preferred_date: z.string().min(1, "Date requise"),
    });
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    // Update profile contact info too
    await supabase.from("profiles").update({ full_name: form.full_name, phone: form.phone, city: form.city }).eq("id", user!.id);
    const { error } = await supabase.from("service_requests").insert({
      client_id: user!.id,
      artisan_id,
      category_id: (artisan as any)?.category_id ?? null,
      title: form.title,
      description: form.description,
      city: form.city,
      preferred_date: form.preferred_date,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Réservation envoyée !"); navigate({ to: "/dashboard/client" }); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Réserver un service</h1>
        {artisan && <p className="text-muted-foreground mb-6">Avec : <strong>{(artisan as any).profile?.full_name}</strong> — {(artisan as any).profession}</p>}
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Nom complet</Label><Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Téléphone</Label><Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+212 …" /></div>
            </div>
            <div className="space-y-2">
              <Label>Ville</Label>
              <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
                <SelectTrigger><SelectValue placeholder="Choisir une ville" /></SelectTrigger>
                <SelectContent>{MOROCCAN_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Titre du service</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex : Fuite robinet cuisine" /></div>
            <div className="space-y-2"><Label>Description détaillée</Label><Textarea required rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Décrivez votre besoin…" /></div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" />Date souhaitée</Label>
              <Input type="date" required value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} min={new Date().toISOString().split("T")[0]} />
            </div>
            <Button type="submit" disabled={loading} className="w-full" size="lg">{loading ? "Envoi…" : "Réserver maintenant"}</Button>
          </form>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
