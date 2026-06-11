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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const search = z.object({ artisan_id: z.string() });

export const Route = createFileRoute("/requests/new")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Nouvelle demande — ArtisanConnect" }] }),
  component: NewRequest,
});

function NewRequest() {
  const { artisan_id } = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", address: "", city: "", preferred_date: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!authLoading && !user) navigate({ to: "/auth" }); }, [user, authLoading, navigate]);

  const { data: artisan } = useQuery({
    queryKey: ["artisan-mini", artisan_id],
    queryFn: async () => (await supabase.from("artisans").select("category_id, profile:profiles!artisans_id_fkey(full_name)").eq("id", artisan_id).maybeSingle()).data,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = z.object({
      title: z.string().min(3).max(120),
      description: z.string().min(10).max(2000),
      address: z.string().max(200).optional(),
      city: z.string().max(60).optional(),
    });
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    const { error } = await supabase.from("service_requests").insert({
      client_id: user!.id,
      artisan_id,
      category_id: (artisan as any)?.category_id ?? null,
      title: form.title,
      description: form.description,
      address: form.address || null,
      city: form.city || null,
      preferred_date: form.preferred_date || null,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Demande envoyée !"); navigate({ to: "/dashboard/client" }); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Demander un service</h1>
        {artisan && <p className="text-muted-foreground mb-6">À : <strong>{(artisan as any).profile?.full_name}</strong></p>}
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2"><Label>Titre</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex : Fuite robinet cuisine" /></div>
            <div className="space-y-2"><Label>Description détaillée</Label><Textarea required rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Décrivez votre besoin…" /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Ville</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div className="space-y-2"><Label>Date souhaitée</Label><Input type="date" value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Adresse (optionnel)</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <Button type="submit" disabled={loading} className="w-full" size="lg">{loading ? "Envoi…" : "Envoyer la demande"}</Button>
          </form>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
