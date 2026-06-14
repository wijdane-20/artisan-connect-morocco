import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Lock, CheckCircle2 } from "lucide-react";
import { processPayment, type BookingFee, type PaymentProvider } from "@/lib/payments";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fee: BookingFee;
  onPaid: (info: { provider: PaymentProvider; reference: string; amount: number; currency: string }) => Promise<void> | void;
}

export function PaymentDialog({ open, onOpenChange, fee, onPaid }: Props) {
  const [provider, setProvider] = useState<PaymentProvider>("mock");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    setLoading(true);
    setError(null);
    const res = await processPayment({ provider, amount: fee.amount, currency: fee.currency });
    if (!res.success) { setError(res.error ?? "Échec du paiement"); setLoading(false); return; }
    try {
      await onPaid({ provider, reference: res.reference, amount: fee.amount, currency: fee.currency });
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors de la création de la demande");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Paiement des frais de demande</DialogTitle>
          <DialogDescription>
            Pour envoyer votre demande, veuillez régler les frais de service.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Frais de demande</span>
            <span className="text-2xl font-bold">{fee.amount} {fee.currency}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Mode de paiement</Label>
          <RadioGroup value={provider} onValueChange={(v) => setProvider(v as PaymentProvider)} className="gap-2">
            <label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="mock" id="m" /><span className="text-sm">Paiement test (démo)</span>
            </label>
            <label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer opacity-60">
              <RadioGroupItem value="cmi" id="c" disabled /><span className="text-sm">CMI (bientôt)</span>
            </label>
            <label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer opacity-60">
              <RadioGroupItem value="stripe" id="s" disabled /><span className="text-sm">Stripe (bientôt)</span>
            </label>
            <label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer opacity-60">
              <RadioGroupItem value="paypal" id="p" disabled /><span className="text-sm">PayPal (bientôt)</span>
            </label>
          </RadioGroup>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <p className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="h-3 w-3" />Paiement sécurisé. Votre demande est créée uniquement après confirmation.</p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Annuler</Button>
          <Button onClick={pay} disabled={loading}>
            {loading ? "Traitement…" : (<><CheckCircle2 className="h-4 w-4 mr-1" />Payer {fee.amount} {fee.currency}</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
