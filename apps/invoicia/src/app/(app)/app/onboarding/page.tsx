"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Building2, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/app/page-header";
import { createOrgAction } from "./actions";

const schema = z.object({
  name: z.string().min(2),
  currency: z.enum(["NGN", "USD", "EUR", "GBP"]),
  timezone: z.string().min(1),
  taxLabel: z.string().optional(),
  taxPercent: z.string().optional(),
  invoicePrefix: z.string().min(2).max(10),
});

type FormValues = z.infer<typeof schema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      currency: "NGN",
      timezone: "Africa/Lagos",
      taxLabel: "VAT",
      taxPercent: "7",
      invoicePrefix: "INV",
    },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid form input.");
      return;
    }
    try {
      await createOrgAction(parsed.data);
      router.push("/app");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create organization.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create your organization"
        description="This is your tenant workspace where invoices, customers, and settings are scoped."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Workspace setup
          </CardTitle>
          <CardDescription>Start with organization and numbering defaults.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="name">Organization name</Label>
              <Input id="name" className="h-11" {...form.register("name")} placeholder="Acme Ltd" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" className="h-11" {...form.register("timezone")} placeholder="Africa/Lagos" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoicePrefix">Invoice prefix</Label>
              <Input id="invoicePrefix" className="h-11" {...form.register("invoicePrefix")} placeholder="INV" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={form.watch("currency")} onValueChange={(value: string) => form.setValue("currency", value as FormValues["currency"])}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">NGN</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="taxPercent">Default tax percent</Label>
              <Input id="taxPercent" className="h-11" type="number" {...form.register("taxPercent")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="taxLabel">Tax label</Label>
              <Input id="taxLabel" className="h-11" {...form.register("taxLabel")} placeholder="VAT" />
            </div>
            {error ? (
              <p className="text-sm text-red-600 md:col-span-2" role="alert">
                {error}
              </p>
            ) : null}
            <div className="md:col-span-2">
              <Button type="submit" className="h-11" disabled={form.formState.isSubmitting}>
                <Settings2 className="mr-2 h-4 w-4" />
                Create workspace
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
