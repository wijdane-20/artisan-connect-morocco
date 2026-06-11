import { Badge } from "@/components/ui/badge";

const map: Record<string, { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "bg-warning/15 text-warning border-warning/30" },
  accepted: { label: "Acceptée", cls: "bg-primary/15 text-primary border-primary/30" },
  rejected: { label: "Refusée", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  in_progress: { label: "En cours", cls: "bg-accent text-accent-foreground" },
  completed: { label: "Terminée", cls: "bg-success/15 text-success border-success/30" },
  cancelled: { label: "Annulée", cls: "bg-muted text-muted-foreground" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = map[status] ?? { label: status, cls: "" };
  return <Badge variant="outline" className={s.cls}>{s.label}</Badge>;
}
