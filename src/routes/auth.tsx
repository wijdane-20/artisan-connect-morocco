import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const authSearchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: authSearchSchema,
  head: () => ({ meta: [{ title: "Connexion — ArtisanConnect" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user, roles, loading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">(mode ?? "signin");

  useEffect(() => {
    if (!loading && user) {
      const dest = roles.includes("admin") ? "/dashboard/admin" :
        roles.includes("artisan") ? "/dashboard/artisan" : "/dashboard/client";
      navigate({ to: dest });
    }
  }, [user, roles, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-6 md:p-8 shadow-card">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Bienvenue</h1>
            <p className="text-muted-foreground text-sm mt-1">Connectez-vous ou créez un compte</p>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>
            <TabsContent value="signin"><SignInForm /></TabsContent>
            <TabsContent value="signup"><SignUpForm /></TabsContent>
          </Tabs>
          <p className="text-xs text-center text-muted-foreground mt-6">
            <Link to="/" className="hover:underline">← Retour à l'accueil</Link>
          </p>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Connecté !");
  };
  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : "Se connecter"}</Button>
    </form>
  );
}

function SignUpForm() {
  const [form, setForm] = useState({ email: "", password: "", full_name: "", phone: "", city: "", role: "client" as "client" | "artisan" });
  const [loading, setLoading] = useState(false);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = z.object({
      email: z.string().email("Email invalide"),
      password: z.string().min(6, "Mot de passe trop court (min 6)"),
      full_name: z.string().min(2, "Nom requis").max(100),
      phone: z.string().max(30).optional(),
      city: z.string().max(60).optional(),
      role: z.enum(["client", "artisan"]),
    });
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: form.full_name, phone: form.phone, city: form.city, role: form.role },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Compte créé ! Connexion en cours…");
  };
  return (
    <form onSubmit={onSubmit} className="space-y-3 mt-4">
      <div className="space-y-2">
        <Label>Je suis</Label>
        <RadioGroup value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "client" | "artisan" })} className="grid grid-cols-2 gap-2">
          <Label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-accent">
            <RadioGroupItem value="client" /> Client
          </Label>
          <Label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-accent">
            <RadioGroupItem value="artisan" /> Artisan
          </Label>
        </RadioGroup>
      </div>
      <div className="space-y-2"><Label>Nom complet</Label><Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label>Téléphone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="space-y-2"><Label>Ville</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
      </div>
      <div className="space-y-2"><Label>Email</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
      <div className="space-y-2"><Label>Mot de passe</Label><Input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
      <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : "Créer mon compte"}</Button>
    </form>
  );
}
