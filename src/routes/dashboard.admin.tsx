import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Users, Briefcase, ClipboardList, Star } from "lucide-react";

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
      const [u, a, r, rev] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("artisans").select("id", { count: "exact", head: true }),
        supabase.from("service_requests").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
      ]);
      return { users: u.count ?? 0, artisans: a.count ?? 0, requests: r.count ?? 0, reviews: rev.count ?? 0 };
    },
  });

  const { data: pending, refetch: refetchPending } = useQuery({
    enabled: roles.includes("admin"),
    queryKey: ["pending-artisans"],
    queryFn: async () => (await supabase.from("artisans")
      .select("*, profile:profiles!artisans_id_fkey(full_name, phone, city), category:categories(name)")
      .eq("approved", false).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: users, refetch: refetchUsers } = useQuery({
    enabled: roles.includes("admin"),
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*, roles:user_roles(role)").order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  const { data: allRequests } = useQuery({
    enabled: roles.includes("admin"),
    queryKey: ["all-requests"],
    queryFn: async () => (await supabase.from("service_requests")
      .select("*, client:profiles!service_requests_client_id_fkey(full_name), artisan:profiles!service_requests_artisan_id_fkey(full_name)")
      .order("created_at", { ascending: false }).limit(50)).data ?? [],
  });

  const approve = async (id: string, approved: boolean) => {
    const { error } = await supabase.from("artisans").update({ approved }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(approved ? "Artisan approuvé" : "Artisan rejeté"); refetchPending(); }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Supprimer ce profil ?")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Supprimé"); refetchUsers(); }
  };

  if (!roles.includes("admin")) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold">Administration</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <StatCard icon={Users} label="Utilisateurs" value={stats?.users} />
          <StatCard icon={Briefcase} label="Artisans" value={stats?.artisans} />
          <StatCard icon={ClipboardList} label="Demandes" value={stats?.requests} />
          <StatCard icon={Star} label="Avis" value={stats?.reviews} />
        </div>

        <Tabs defaultValue="pending" className="mt-8">
          <TabsList>
            <TabsTrigger value="pending">À approuver ({pending?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="requests">Demandes</TabsTrigger>
          </TabsList>

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
                <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Rôles</TableHead><TableHead>Ville</TableHead><TableHead>Tél</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {users?.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                      <TableCell><div className="flex gap-1 flex-wrap">{u.roles?.map((r: any, i: number) => <Badge key={i} variant="secondary">{r.role}</Badge>)}</div></TableCell>
                      <TableCell>{u.city ?? "—"}</TableCell>
                      <TableCell>{u.phone ?? "—"}</TableCell>
                      <TableCell><Button size="sm" variant="ghost" onClick={() => deleteUser(u.id)}>Supprimer</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="mt-4">
            <Card className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Titre</TableHead><TableHead>Client</TableHead><TableHead>Artisan</TableHead><TableHead>Statut</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {allRequests?.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell>{r.client?.full_name}</TableCell>
                      <TableCell>{r.artisan?.full_name}</TableCell>
                      <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString("fr-FR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
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
