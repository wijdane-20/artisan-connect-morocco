import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { StatusBadge } from "@/components/StatusBadge";
import { ReviewDialog } from "@/components/ReviewDialog";

export const Route = createFileRoute("/dashboard/client-area")({
  head: () => ({ meta: [{ title: "Mon espace — ArtisanConnect" }] }),
  component: ClientDashboard,
});

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold">Mes demandes</h1>
        <p className="text-muted-foreground mt-1">Suivez l'état de vos demandes de service</p>
        <div className="mt-6 space-y-3">
          {requests && requests.length > 0 ? requests.map((r: any) => (
            <Card key={r.id} className="p-5 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{r.title}</h3>
                  <StatusBadge status={r.status} />
                  {r.category && <Badge variant="outline">{r.category.name}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                <p className="text-xs text-muted-foreground mt-2">Artisan : {r.artisan?.full_name} • {new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
              </div>
              {r.status === "completed" && <ReviewDialog requestId={r.id} artisanId={r.artisan_id} onDone={refetch} />}
            </Card>
          )) : <Card className="p-10 text-center text-muted-foreground">Aucune demande pour l'instant.</Card>}
        </div>
      </main>
      <Footer />
    </div>
  );
}
