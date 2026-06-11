import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function ReviewDialog({ requestId, artisanId, onDone }: { requestId: string; artisanId: string; onDone: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("reviews").insert({
      request_id: requestId, client_id: user.id, artisan_id: artisanId, rating, comment: comment || null,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Avis publié"); setOpen(false); onDone(); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline">Laisser un avis</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Évaluer la prestation</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Note</Label>
            <div className="flex gap-1 mt-2">
              {[1,2,3,4,5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)}>
                  <Star className={`h-7 w-7 ${n <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2"><Label>Commentaire</Label><Textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} /></div>
          <Button onClick={submit} disabled={saving} className="w-full">{saving ? "..." : "Publier"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
