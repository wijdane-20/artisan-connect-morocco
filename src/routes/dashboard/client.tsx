import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { StatusBadge } from "@/components/StatusBadge";
import { ReviewDialog } from "@/components/ReviewDialog";

export const Route = createFileRoute("/dashboard/client")({
  head: () => ({ meta: [{ title: "Mon espace — ArtisanConnect" }] }),
  component: ClientDashboard,
});

function PaymentBadge({ status }: { status: string }) {
  if (status === "paid") return <Badge className="bg-green-600 hover:bg-green-600">Payé</Badge>;
  if (status === "failed") return <Badge variant="destructive">Échec</Badge>;
  return <Badge variant="secondary">En attente</Badge>;
}

function ClientDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);

  const { data: requests, refetch } = useQuery({
    enabled: !!user,
    queryKey: ["my-requests", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("service_requests")
        .select("*, artisan:profiles!service_requests_artisan_id_fkey(full_name), category:categories(name)")
        .eq("client_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: payments } = useQuery({
    enabled: !!user,
    queryKey: ["my-payments", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("payments")
        .select("*, request:service_requests(title)")
        .eq("client_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold">Mon espace</h1>
        <p className="text-muted-foreground mt-1">Suivez vos demandes et vos paiements</p>

        <Tabs defaultValue="bookings" className="mt-6">
          <TabsList>
            <TabsTrigger value="bookings">Mes demandes ({requests?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="payments">Paiements ({payments?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="mt-4 space-y-3">
            {requests && requests.length > 0 ? requests.map((r: any) => (
              <Card key={r.id} className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{r.title}</h3>
                    <StatusBadge status={r.status} />
                    <PaymentBadge status={r.payment_status} />
                    {r.category && <Badge variant="outline">{r.category.name}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Artisan : {r.artisan?.full_name} • {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    {r.payment_amount && <> • Frais : {r.payment_amount} MAD</>}
                  </p>
                </div>
                {r.status === "completed" && <ReviewDialog requestId={r.id} artisanId={r.artisan_id} onDone={refetch} />}
              </Card>
            )) : <Card className="p-10 text-center text-muted-foreground">Aucune demande pour l'instant.</Card>}
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <Card className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Demande</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments && payments.length > 0 ? payments.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{new Date(p.created_at).toLocaleString("fr-FR")}</TableCell>
                      <TableCell>{p.request?.title ?? "—"}</TableCell>
                      <TableCell className="font-medium">{p.amount} {p.currency}</TableCell>
                      <TableCell className="capitalize">{p.provider}</TableCell>
                      <TableCell className="font-mono text-xs">{p.reference ?? "—"}</TableCell>
                      <TableCell><PaymentBadge status={p.status} /></TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun paiement.</TableCell></TableRow>
                  )}
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
