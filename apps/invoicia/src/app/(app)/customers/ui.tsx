"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCustomerAction } from "./actions";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  defaultPaymentTermsDays: z.string().min(1),
  requirePurchaseOrder: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export function NewCustomerForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      defaultPaymentTermsDays: "14",
      requirePurchaseOrder: false,
    },
  });

  async function onSubmit(values: FormValues) {
    setMessage(null);
    setError(null);
    try {
      await createCustomerAction(values);
      setMessage("Customer created.");
      form.reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create customer.");
    }
  }

  return (
    <form className="grid gap-3" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" className="h-11" {...form.register("name")} placeholder="Acme Procurement" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" className="h-11" type="email" {...form.register("email")} placeholder="billing@acme.com" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="terms">Default terms (days)</Label>
        <Input id="terms" className="h-11" type="number" {...form.register("defaultPaymentTermsDays")} />
      </div>
      <label className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
        <input type="checkbox" className="h-4 w-4" {...form.register("requirePurchaseOrder")} />
        Require purchase order number
      </label>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
      ) : null}
      <Button type="submit" className="h-11" disabled={form.formState.isSubmitting}>
        Add customer
      </Button>
    </form>
  );
}
