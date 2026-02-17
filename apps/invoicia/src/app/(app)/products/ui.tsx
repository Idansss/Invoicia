"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProductAction } from "./actions";

const schema = z.object({
  name: z.string().min(1),
  unitPriceCents: z.string().min(1),
  unit: z.string().min(1),
  taxPercent: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function NewProductForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", unitPriceCents: "0", unit: "each", taxPercent: "7" },
  });

  async function onSubmit(values: FormValues) {
    setMessage(null);
    setError(null);
    try {
      await createProductAction(values);
      setMessage("Product created.");
      form.reset({ name: "", unitPriceCents: "0", unit: "each", taxPercent: "7" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create product.");
    }
  }

  return (
    <form className="grid gap-3" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" className="h-11" {...form.register("name")} placeholder="Consulting (hour)" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="unitPriceCents">Unit price (cents)</Label>
        <Input id="unitPriceCents" className="h-11" type="number" {...form.register("unitPriceCents")} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="unit">Unit</Label>
        <Input id="unit" className="h-11" {...form.register("unit")} placeholder="hour" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="taxPercent">Tax percent</Label>
        <Input id="taxPercent" className="h-11" type="number" {...form.register("taxPercent")} />
      </div>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
      ) : null}
      <Button type="submit" className="h-11" disabled={form.formState.isSubmitting}>
        Add product
      </Button>
    </form>
  );
}
