import { supabase } from "@/integrations/supabase/client";

export type PaymentProvider = "mock" | "cmi" | "stripe" | "paypal";

export interface BookingFee {
  amount: number;
  currency: string;
}

export async function getBookingFee(): Promise<BookingFee> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "booking_fee")
    .maybeSingle();
  const v = (data?.value as any) ?? {};
  return { amount: Number(v.amount ?? 20), currency: String(v.currency ?? "MAD") };
}

export async function setBookingFee(fee: BookingFee) {
  return supabase.from("app_settings").update({ value: fee as any }).eq("key", "booking_fee");
}

/**
 * Process a payment. Currently uses a mock provider that always succeeds
 * (simulating a 1.2s gateway round-trip). Stripe / CMI / PayPal hooks are
 * stubbed so we can swap them in later without touching call sites.
 */
export async function processPayment(opts: {
  provider: PaymentProvider;
  amount: number;
  currency: string;
}): Promise<{ success: boolean; reference: string; error?: string }> {
  await new Promise((r) => setTimeout(r, 1200));
  switch (opts.provider) {
    case "cmi":
    case "stripe":
    case "paypal":
      return { success: false, reference: "", error: `${opts.provider} non encore configuré` };
    case "mock":
    default:
      return { success: true, reference: `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}` };
  }
}
