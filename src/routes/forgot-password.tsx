import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Mot de passe oublié — ArtisanConnect" }] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { setSent(true); toast.success("Email envoyé"); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8">
          <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
          <p className="text-sm text-muted-foreground mt-1">Nous vous enverrons un lien de réinitialisation.</p>
          {sent ? (
            <div className="mt-6 text-sm">
              <p>Si un compte existe avec cet email, vous recevrez un lien sous peu. Vérifiez votre boîte de réception.</p>
              <Link to="/auth" className="text-primary hover:underline mt-4 inline-block">← Retour à la connexion</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading} className="w-full">{loading ? "…" : "Envoyer le lien"}</Button>
              <Link to="/auth" className="block text-xs text-center text-muted-foreground hover:underline">← Retour à la connexion</Link>
            </form>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  );
}
