"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function DisputeForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(formData: FormData) {
    setError(null);
    setSending(true);
    try {
      const res = await fetch(`/api/public/invoices/${token}/dispute`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to submit request.");
      router.push(`/i/${token}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit request.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form action={submit} className="grid gap-3">
      <div className="grid gap-2">
        <Label>Reason</Label>
        <select
          name="reasonCode"
          className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          defaultValue="OTHER"
        >
          <option value="WRONG_QUANTITY">Wrong quantity</option>
          <option value="WRONG_TAX">Wrong tax</option>
          <option value="WRONG_PRICE">Wrong price</option>
          <option value="WRONG_PO">Wrong purchase order</option>
          <option value="DUPLICATE_INVOICE">Duplicate invoice</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div className="grid gap-2">
        <Label>Message (optional)</Label>
        <Textarea name="message" placeholder="Tell us what needs changing..." />
      </div>

      <div className="grid gap-2">
        <Label>Attachment (optional)</Label>
        <input name="file" type="file" className="text-sm" />
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={sending}>
        Submit request
      </Button>
    </form>
  );
}

