import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [
    { title: "Contact — ArtisanConnect" },
    { name: "description", content: "Contactez l'équipe ArtisanConnect" },
  ]}),
  component: Contact,
});

const FAQ = [
  { q: "Comment réserver un artisan ?", a: "Recherchez un artisan par métier ou ville, consultez son profil, ses avis, et cliquez sur \"Réserver maintenant\" pour envoyer une demande." },
  { q: "Comment devenir artisan partenaire ?", a: "Inscrivez-vous en tant qu'artisan, complétez votre profil et soumettez vos documents de vérification. Notre équipe valide votre compte sous 48h." },
  { q: "Les paiements se font-ils sur la plateforme ?", a: "Pour l'instant, le paiement se fait directement entre le client et l'artisan, en espèces ou par virement." },
  { q: "Que faire en cas de litige ?", a: "Contactez-nous via ce formulaire, notre équipe interviendra rapidement pour résoudre le différend." },
  { q: "Le service est-il disponible dans toutes les villes ?", a: "Nous couvrons les principales villes marocaines : Casablanca, Rabat, Marrakech, Fès, Tanger, Agadir et nous étendons régulièrement notre réseau." },
];

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const schema = z.object({
      name: z.string().trim().min(2).max(100),
      email: z.string().trim().email("Email invalide").max(255),
      message: z.string().trim().min(10).max(2000),
    });
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    // No backend — simulate. (Hook up later if requested.)
    setTimeout(() => {
      setLoading(false);
      setForm({ name: "", email: "", message: "" });
      toast.success("Message envoyé ! Nous vous répondrons bientôt.");
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold">Contact</h1>
          <p className="text-muted-foreground mt-2">Une question ? Notre équipe vous répond.</p>

          <div className="grid md:grid-cols-3 gap-4 mt-8">
            {[
              { i: Mail, t: "Email", v: "contact@artisanconnect.ma" },
              { i: Phone, t: "Téléphone", v: "+212 5XX-XXXXXX" },
              { i: MapPin, t: "Adresse", v: "Casablanca, Maroc" },
            ].map(({ i: Icon, t, v }) => (
              <Card key={t} className="p-6">
                <Icon className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold">{t}</h3>
                <p className="text-sm text-muted-foreground mt-1">{v}</p>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-10">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Envoyer un message</h2>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2"><Label>Nom</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Message</Label><Textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
                <Button type="submit" disabled={loading} className="w-full">{loading ? "…" : "Envoyer"}</Button>
              </form>
            </Card>

            <div>
              <h2 className="text-xl font-bold mb-4">Questions fréquentes</h2>
              <Accordion type="single" collapsible>
                {FAQ.map((f, i) => (
                  <AccordionItem key={i} value={`q${i}`}>
                    <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
