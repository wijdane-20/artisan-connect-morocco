import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Users, Briefcase, ClipboardList, Star, ShieldCheck, Ban, Wallet, Settings as SettingsIcon } from "lucide-react";
import { getBookingFee, setBookingFee } from "@/lib/payments";

export const Route = createFileRoute("/dashboard/admin")({
  head: () => ({ meta: [{ title: "Administration — ArtisanConnect" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) navigate({ to: "/auth" });
      else if (!roles.includes("admin")) navigate({ to: "/" });
    }
  }, [user, roles, loading, navigate]);

  const { data: stats } = useQuery({
    enabled: roles.includes("admin"),
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [u, a, r, rev, pay] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("artisans").select("id", { count: "exact", head: true }),
        supabase.from("service_requests").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
        supabase.from("payments").select("amount").eq("status", "paid"),
      ]);
      const revenue = (pay.data ?? []).reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0);
      return { users: u.count ?? 0, artisans: a.count ?? 0, requests: r.count ?? 0, reviews: rev.count ?? 0, revenue };
    },
  });

  const { data: payments } = useQuery({
    enabled: roles.includes("admin"),
    queryKey: ["all-payments"],
    queryFn: async () => (await supabase.from("payments")
      .select("*, client:profiles!payments_client_id_fkey(full_name), request:service_requests(title)")
      .order("created_at", { ascending: false }).limit(100)).data ?? [],
  });

  const { data: pending, refetch: refetchPending } = useQuery({
    enabled: roles.includes("admin"),
    queryKey: ["pending-artisans"],
    queryFn: async () => (await supabase.from("artisans")
      .select("*, profile:profiles!artisans_id_fkey(full_name, phone, city), category:categories(name)")
      .eq("approved", false).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: verifs, refetch: refetchVerifs } = useQuery({
    enabled: roles.includes("admin"),
    queryKey: ["pending-verifs"],
    queryFn: async () => (await supabase.from("verification_requests")
      .select("*, artisan:profiles!verification_requests_artisan_id_fkey(full_name, city)")
      .eq("status", "pending").order("created_at", { ascending: false })).data ?? [],
  });

  const { data: users, refetch: refetchUsers } = useQuery({
    enabled: roles.includes("admin"),
    queryKey: ["all-users"],
    queryFn: async () => (await supabase.from("profiles").select("*, roles:user_roles(role)").order("created_at", { ascending: false }).limit(100)).data ?? [],
  });

  const { data: allRequests } = useQuery({
    enabled: roles.includes("admin"),
    queryKey: ["all-requests"],
    queryFn: async () => (await supabase.from("service_requests")
      .select("*, client:profiles!service_requests_client_id_fkey(full_name), artisan:profiles!service_requests_artisan_id_fkey(full_name)")
      .order("created_at", { ascending: false }).limit(50)).data ?? [],
  });

  const { data: allReviews, refetch: refetchReviews } = useQuery({
    enabled: roles.includes("admin"),
    queryKey: ["all-reviews"],
    queryFn: async () => (await supabase.from("reviews")
      .select("*, client:profiles!reviews_client_id_fkey(full_name), artisan:profiles!reviews_artisan_id_fkey(full_name)")
      .order("created_at", { ascending: false }).limit(50)).data ?? [],
  });

  const approve = async (id: string, approved: boolean) => {
    const { error } = await supabase.from("artisans").update({ approved }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(approved ? "Artisan approuvé" : "Artisan rejeté"); refetchPending(); }
  };

  const decideVerif = async (v: any, decision: "approved" | "rejected") => {
    await supabase.from("verification_requests").update({ status: decision }).eq("id", v.id);
    await supabase.from("artisans").update({
      is_verified: decision === "approved",
      verification_status: decision,
    }).eq("id", v.artisan_id);
    toast.success(decision === "approved" ? "Vérifié" : "Rejeté");
    refetchVerifs();
  };

  const suspend = async (id: string, suspended: boolean) => {
    await supabase.from("profiles").update({ is_suspended: suspended }).eq("id", id);
    await supabase.from("artisans").update({ suspended }).eq("id", id);
    toast.success(suspended ? "Compte suspendu" : "Compte réactivé");
    refetchUsers();
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Supprimer ce profil ?")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Supprimé"); refetchUsers(); }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Supprimer cet avis ?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Supprimé"); refetchReviews(); }
  };

  if (!roles.includes("admin")) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold">Administration</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
          <StatCard icon={Users} label="Utilisateurs" value={stats?.users} />
          <StatCard icon={Briefcase} label="Artisans" value={stats?.artisans} />
          <StatCard icon={ClipboardList} label="Demandes" value={stats?.requests} />
          <StatCard icon={Star} label="Avis" value={stats?.reviews} />
          <StatCard icon={Wallet} label="Revenus (MAD)" value={stats?.revenue?.toFixed(2)} />
        </div>

        <Tabs defaultValue="verifs" className="mt-8">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="verifs">Vérifications ({verifs?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="pending">Artisans à approuver ({pending?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="requests">Demandes</TabsTrigger>
            <TabsTrigger value="payments">Paiements</TabsTrigger>
            <TabsTrigger value="reviews">Avis</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="verifs" className="mt-4 space-y-3">
            {verifs && verifs.length > 0 ? verifs.map((v: any) => <VerifRow key={v.id} v={v} onDecide={decideVerif} />) : <Card className="p-8 text-center text-muted-foreground">Aucune demande de vérification.</Card>}
          </TabsContent>

          <TabsContent value="pending" className="mt-4 space-y-3">
            {pending && pending.length > 0 ? pending.map((a: any) => (
              <Card key={a.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-semibold">{a.profile?.full_name}</div>
                  <div className="text-sm text-muted-foreground">{a.category?.name ?? "—"} • {a.city ?? "—"} • {a.profile?.phone ?? ""}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => approve(a.id, true)}>Approuver</Button>
                  <Button size="sm" variant="outline" onClick={() => approve(a.id, false)}>Rejeter</Button>
                </div>
              </Card>
            )) : <Card className="p-8 text-center text-muted-foreground">Aucun artisan en attente.</Card>}
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <Card className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Rôles</TableHead><TableHead>Ville</TableHead><TableHead>Statut</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {users?.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                      <TableCell><div className="flex gap-1 flex-wrap">{u.roles?.map((r: any, i: number) => <Badge key={i} variant="secondary">{r.role}</Badge>)}</div></TableCell>
                      <TableCell>{u.city ?? "—"}</TableCell>
                      <TableCell>{u.is_suspended ? <Badge variant="destructive">Suspendu</Badge> : <Badge variant="outline">Actif</Badge>}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => suspend(u.id, !u.is_suspended)}><Ban className="h-3.5 w-3.5 mr-1" />{u.is_suspended ? "Réactiver" : "Suspendre"}</Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteUser(u.id)}>Supprimer</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="mt-4">
            <Card className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Titre</TableHead><TableHead>Client</TableHead><TableHead>Artisan</TableHead><TableHead>Statut</TableHead><TableHead>Paiement</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {allRequests?.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell>{r.client?.full_name}</TableCell>
                      <TableCell>{r.artisan?.full_name}</TableCell>
                      <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={r.payment_status === "paid" ? "default" : r.payment_status === "failed" ? "destructive" : "secondary"}>
                          {r.payment_status ?? "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString("fr-FR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <Card className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Client</TableHead><TableHead>Demande</TableHead><TableHead>Montant</TableHead><TableHead>Mode</TableHead><TableHead>Référence</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
                <TableBody>
                  {payments && payments.length > 0 ? payments.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{new Date(p.created_at).toLocaleString("fr-FR")}</TableCell>
                      <TableCell>{p.client?.full_name ?? "—"}</TableCell>
                      <TableCell>{p.request?.title ?? "—"}</TableCell>
                      <TableCell className="font-medium">{p.amount} {p.currency}</TableCell>
                      <TableCell className="capitalize">{p.provider}</TableCell>
                      <TableCell className="font-mono text-xs">{p.reference ?? "—"}</TableCell>
                      <TableCell><Badge variant={p.status === "paid" ? "default" : p.status === "failed" ? "destructive" : "secondary"}>{p.status}</Badge></TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucun paiement.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4 space-y-3">
            {allReviews?.map((r: any) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-sm"><strong>{r.client?.full_name}</strong> → <strong>{r.artisan?.full_name}</strong> — <span className="text-warning">{"★".repeat(r.rating)}</span></div>
                    {r.comment && <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteReview(r.id)}>Supprimer</Button>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <FeeSettings />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

function VerifRow({ v, onDecide }: { v: any; onDecide: (v: any, d: "approved" | "rejected") => void }) {
  const [urls, setUrls] = useState<{ cin?: string; photo?: string; doc?: string }>({});
  useEffect(() => {
    (async () => {
      const out: any = {};
      for (const k of ["cin", "photo", "doc"] as const) {
        const path = v[`${k}_url`];
        if (path) {
          const { data } = await supabase.storage.from("verification-docs").createSignedUrl(path, 3600);
          if (data) out[k] = data.signedUrl;
        }
      }
      setUrls(out);
    })();
  }, [v]);
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />{v.artisan?.full_name}</div>
          <div className="text-xs text-muted-foreground">{v.artisan?.city ?? "—"} • Demandé le {new Date(v.created_at).toLocaleDateString("fr-FR")}</div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onDecide(v, "approved")}>Approuver</Button>
          <Button size="sm" variant="outline" onClick={() => onDecide(v, "rejected")}>Rejeter</Button>
        </div>
      </div>
      <div className="flex gap-3 mt-3 flex-wrap text-xs">
        {urls.cin && <a href={urls.cin} target="_blank" rel="noopener" className="text-primary hover:underline">📄 CIN</a>}
        {urls.photo && <a href={urls.photo} target="_blank" rel="noopener" className="text-primary hover:underline">🖼️ Photo</a>}
        {urls.doc && <a href={urls.doc} target="_blank" rel="noopener" className="text-primary hover:underline">📎 Document</a>}
      </div>
    </Card>
  );
}

function StatCard({ icon: Icon, label, value }: any) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="text-3xl font-bold mt-2">{value ?? "—"}</div>
    </Card>
  );
}
