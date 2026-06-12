import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ShieldCheck, Upload, CheckCircle2, Clock, XCircle } from "lucide-react";

export const Route = createFileRoute("/dashboard/verification")({
  head: () => ({ meta: [{ title: "Vérification — ArtisanConnect" }] }),
  component: VerificationPage,
});

function VerificationPage() {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading) {
      if (!user) navigate({ to: "/auth" });
      else if (!roles.includes("artisan")) navigate({ to: "/" });
    }
  }, [user, roles, loading, navigate]);

  const { data: req, refetch } = useQuery({
    enabled: !!user,
    queryKey: ["my-verif", user?.id],
    queryFn: async () => (await supabase.from("verification_requests").select("*").eq("artisan_id", user!.id).order("created_at", { ascending: false }).limit(1).maybeSingle()).data,
  });

  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<{ cin?: File; photo?: File; doc?: File }>({});

  const upload = async (file: File, key: string) => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${key}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("verification-docs").upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.cin && !files.photo && !files.doc && !req) { toast.error("Téléversez au moins un document"); return; }
    setUploading(true);
    try {
      const cin_url = files.cin ? await upload(files.cin, "cin") : req?.cin_url;
      const photo_url = files.photo ? await upload(files.photo, "photo") : req?.photo_url;
      const doc_url = files.doc ? await upload(files.doc, "doc") : req?.doc_url;
      const payload = { artisan_id: user!.id, cin_url, photo_url, doc_url, status: "pending" };
      if (req) {
        const { error } = await supabase.from("verification_requests").update(payload).eq("id", req.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("verification_requests").insert(payload);
        if (error) throw error;
      }
      await supabase.from("artisans").update({ verification_status: "pending" }).eq("id", user!.id);
      toast.success("Documents envoyés. Un administrateur examinera votre demande.");
      setFiles({});
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const statusInfo: Record<string, { icon: any; label: string; cls: string }> = {
    pending: { icon: Clock, label: "En attente d'examen", cls: "bg-warning/15 text-warning border-warning/30" },
    approved: { icon: CheckCircle2, label: "Vérifié", cls: "bg-success/15 text-success border-success/30" },
    rejected: { icon: XCircle, label: "Refusé", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldCheck className="h-7 w-7 text-primary" /> Vérification d'identité</h1>
        <p className="text-muted-foreground mt-2">Obtenez le badge « Artisan vérifié » pour rassurer vos clients.</p>

        {req && (
          <Card className="mt-6 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Statut actuel</span>
              {(() => {
                const s = statusInfo[req.status] ?? statusInfo.pending;
                const Icon = s.icon;
                return <Badge variant="outline" className={s.cls}><Icon className="h-3 w-3 mr-1" />{s.label}</Badge>;
              })()}
            </div>
            {req.admin_notes && <p className="text-xs text-muted-foreground mt-2">Note admin : {req.admin_notes}</p>}
          </Card>
        )}

        <Card className="mt-6 p-6">
          <form onSubmit={submit} className="space-y-4">
            <FileField label="Carte d'identité (CIN)" current={req?.cin_url} onChange={(f) => setFiles({ ...files, cin: f })} />
            <FileField label="Photo de profil" current={req?.photo_url} onChange={(f) => setFiles({ ...files, photo: f })} />
            <FileField label="Document complémentaire (diplôme, attestation…)" current={req?.doc_url} onChange={(f) => setFiles({ ...files, doc: f })} />
            <Button type="submit" disabled={uploading} className="w-full" size="lg">
              <Upload className="h-4 w-4 mr-2" />{uploading ? "Envoi…" : req ? "Mettre à jour" : "Envoyer pour vérification"}
            </Button>
          </form>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

function FileField({ label, current, onChange }: { label: string; current?: string | null; onChange: (f: File) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="file" accept="image/*,application/pdf" onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])} />
      {current && <p className="text-xs text-muted-foreground">✓ Fichier déjà envoyé</p>}
    </div>
  );
}
