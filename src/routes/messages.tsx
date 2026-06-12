import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Send } from "lucide-react";

const search = z.object({ peer: z.string().optional() });

export const Route = createFileRoute("/messages")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Messagerie — ArtisanConnect" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { peer } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activePeer, setActivePeer] = useState<string | null>(peer ?? null);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);
  useEffect(() => { if (peer) setActivePeer(peer); }, [peer]);

  const { data: conversations, refetch: refetchConvs } = useQuery({
    enabled: !!user,
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("messages")
        .select("sender_id, receiver_id, content, created_at")
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      const map = new Map<string, { peer_id: string; last: string; at: string }>();
      (data ?? []).forEach((m: any) => {
        const peerId = m.sender_id === user!.id ? m.receiver_id : m.sender_id;
        if (!map.has(peerId)) map.set(peerId, { peer_id: peerId, last: m.content, at: m.created_at });
      });
      const peers = Array.from(map.values());
      if (peers.length === 0) return [];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", peers.map((p) => p.peer_id));
      return peers.map((p) => ({ ...p, profile: profiles?.find((x: any) => x.id === p.peer_id) }));
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Messagerie</h1>
        <div className="grid md:grid-cols-3 gap-4 h-[70vh]">
          <Card className="p-2 overflow-y-auto">
            {conversations && conversations.length > 0 ? conversations.map((c: any) => (
              <button key={c.peer_id} onClick={() => setActivePeer(c.peer_id)} className={`w-full text-left p-3 rounded-md hover:bg-accent transition-colors ${activePeer === c.peer_id ? "bg-accent" : ""}`}>
                <div className="font-medium text-sm">{c.profile?.full_name ?? "Utilisateur"}</div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">{c.last}</div>
              </button>
            )) : (
              <div className="p-6 text-center text-sm text-muted-foreground">Aucune conversation. Démarrez-en une depuis un profil artisan.</div>
            )}
          </Card>
          <Card className="md:col-span-2 flex flex-col">
            {activePeer && user ? (
              <ChatThread peer={activePeer} me={user.id} onSent={refetchConvs} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">Sélectionnez une conversation</div>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ChatThread({ peer, me, onSent }: { peer: string; me: string; onSent: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [peerProfile, setPeerProfile] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from("messages")
        .select("*")
        .or(`and(sender_id.eq.${me},receiver_id.eq.${peer}),and(sender_id.eq.${peer},receiver_id.eq.${me})`)
        .order("created_at", { ascending: true });
      if (active) setMessages(data ?? []);
      const { data: p } = await supabase.from("profiles").select("id, full_name, avatar_url").eq("id", peer).maybeSingle();
      if (active) setPeerProfile(p);
    })();
    const channel = supabase
      .channel(`chat-${[me, peer].sort().join("-")}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m: any = payload.new;
        if ((m.sender_id === me && m.receiver_id === peer) || (m.sender_id === peer && m.receiver_id === me)) {
          setMessages((prev) => prev.find((x) => x.id === m.id) ? prev : [...prev, m]);
        }
      })
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [peer, me]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setText("");
    const { error } = await supabase.from("messages").insert({ sender_id: me, receiver_id: peer, content });
    if (error) toast.error(error.message);
    else onSent();
  };

  return (
    <>
      <div className="border-b p-3 font-medium">{peerProfile?.full_name ?? "Conversation"}</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_id === me ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${m.sender_id === me ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {m.content}
              <div className={`text-[10px] mt-1 opacity-70`}>{new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="border-t p-3 flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Écrivez un message…" />
        <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
      </form>
    </>
  );
}
