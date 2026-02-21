"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Eye,
  Send,
  Save,
  MoreHorizontal,
  FileCode,
  Ban,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatMoney } from "@/lib/format";
import { createInvoiceAction } from "../actions";
import { AlertCircle } from "lucide-react";

const schema = z.object({
  customerId: z.string().min(1),
  paymentTermsDays: z.string().min(1),
  dueDate: z.string().optional(),
  purchaseOrderNumber: z.string().optional(),
  notes: z.string().optional(),
  discountType: z.enum(["PERCENT", "FIXED"]).optional(),
  discountValue: z.string().optional(),
  taxPercent: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        productId: z.string().optional(),
        description: z.string().min(1),
        quantity: z.string().min(1),
        unitPriceCents: z.string().min(1),
        unit: z.string().min(1),
        taxPercent: z.string().optional(),
      }),
    )
    .min(1),
});

type FormValues = z.infer<typeof schema>;

export function InvoiceBuilder(props: {
  customers: { id: string; name: string; email?: string | null }[];
  products: {
    id: string;
    name: string;
    unitPriceCents: number;
    unit: string;
    taxPercent: number | null;
  }[];
  orgDefaults: {
    currency: "NGN" | "USD" | "EUR" | "GBP";
    taxPercent?: number;
    taxLabel?: string;
  };
}) {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [submitIntent, setSubmitIntent] = useState<"send" | "draft">("send");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: props.customers[0]?.id ?? "",
      paymentTermsDays: "14",
      taxPercent: String(props.orgDefaults.taxPercent ?? 7),
      lineItems: [
        {
          description: "",
          quantity: "1",
          unitPriceCents: "0.00",
          unit: "each",
          taxPercent: String(props.orgDefaults.taxPercent ?? 7),
        },
      ],
    },
  });
  const items = useFieldArray({ control: form.control, name: "lineItems" });

  const productById = useMemo(
    () => new Map(props.products.map((p) => [p.id, p])),
    [props.products],
  );

  function onSelectProduct(index: number, productId: string) {
    const p = productById.get(productId);
    if (!p) return;
    form.setValue(`lineItems.${index}.productId`, p.id);
    form.setValue(`lineItems.${index}.description`, p.name);
    // unitPriceCents field now holds dollar amount for display; divide by 100
    form.setValue(`lineItems.${index}.unitPriceCents`, String((p.unitPriceCents / 100).toFixed(2)));
    form.setValue(`lineItems.${index}.unit`, p.unit);
    if (p.taxPercent != null)
      form.setValue(`lineItems.${index}.taxPercent`, String(p.taxPercent));
  }

  const watchLines = form.watch("lineItems");
  const discountType = form.watch("discountType") ?? "PERCENT";
  const discountValue = Number(form.watch("discountValue") || 0);

  // unitPriceCents field now holds a dollar value (better UX); convert to cents for display math
  const subtotal = watchLines.reduce(
    (sum, li) =>
      sum + Math.round(Number(li.quantity || 0) * Number(li.unitPriceCents || 0) * 100),
    0,
  );

  const taxTotal = watchLines.reduce((sum, li) => {
    const lineTotalCents = Math.round(Number(li.quantity || 0) * Number(li.unitPriceCents || 0) * 100);
    const taxPercent = Number(li.taxPercent || props.orgDefaults.taxPercent || 0);
    return sum + Math.round((lineTotalCents * taxPercent) / 100);
  }, 0);

  const discountAmount = discountEnabled
    ? discountType === "PERCENT"
      ? Math.round((subtotal * discountValue) / 100)
      : Math.round(discountValue * 100)
    : 0;

  const total = subtotal + taxTotal - discountAmount;

  async function onSubmit(values: FormValues) {
    try {
      // Convert dollar amounts to cents before sending to server
      const payload = {
        ...values,
        lineItems: values.lineItems.map((li) => ({
          ...li,
          unitPriceCents: String(Math.round(Number(li.unitPriceCents || 0) * 100)),
        })),
        discountValue: discountEnabled && values.discountValue && values.discountType === "FIXED"
          ? String(Math.round(Number(values.discountValue) * 100))
          : values.discountValue,
        sendNow: submitIntent === "send",
      };
      await createInvoiceAction(payload);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create invoice.");
    }
  }

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Attachment must be under 10MB");
      event.target.value = "";
      return;
    }
    setAttachments((prev) => [...prev, file]);
    toast.info(`${file.name} selected — it will be available to upload after saving the invoice.`);
    event.target.value = "";
  };

  if (props.customers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <Link href="/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">New Invoice</h1>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">No customers yet</p>
              <p className="text-sm text-muted-foreground">You need at least one customer before creating an invoice.</p>
            </div>
            <Button asChild>
              <Link href="/customers">Add your first customer</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
          <Link href="/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">New Invoice</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create and send a new invoice</p>
        </div>
      </div>

      <form className="grid gap-6 lg:grid-cols-3" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={form.watch("customerId")} onValueChange={(value) => form.setValue("customerId", value)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {props.customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex flex-col">
                        <span>{c.name}</span>
                        <span className="text-xs text-muted-foreground">{c.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs">Payment terms (days)</Label>
                  <Input className="h-9" type="number" {...form.register("paymentTermsDays")} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">PO Number</Label>
                  <Input className="h-9" placeholder="Optional" {...form.register("purchaseOrderNumber")} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Due Date</Label>
                  <Input className="h-9" type="date" {...form.register("dueDate")} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Tax %</Label>
                  <Input className="h-9" type="number" {...form.register("taxPercent")} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">Line Items</CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 text-xs bg-transparent"
                onClick={() =>
                  items.append({
                    description: "",
                    quantity: "1",
                    unitPriceCents: "0.00",
                    unit: "each",
                    taxPercent: String(props.orgDefaults.taxPercent ?? 7),
                  })
                }
                type="button"
              >
                <Plus className="h-3.5 w-3.5" /> Add item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.fields.map((field, idx) => (
                <div key={field.id} className="space-y-3 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => items.remove(idx)} type="button" disabled={items.fields.length === 1}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs">Product</Label>
                      <Select value={form.watch(`lineItems.${idx}.productId`) || ""} onValueChange={(value) => onSelectProduct(idx, value)}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Select product" /></SelectTrigger>
                        <SelectContent>
                          {props.products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} - {formatMoney(p.unitPriceCents, props.orgDefaults.currency)}/{p.unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs">Description</Label>
                      <Input className="h-9" {...form.register(`lineItems.${idx}.description`)} placeholder="Line item description" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Quantity</Label>
                      <Input className="h-9" type="number" step="0.01" min="0" {...form.register(`lineItems.${idx}.quantity`)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Unit</Label>
                      <Input className="h-9" placeholder="each" {...form.register(`lineItems.${idx}.unit`)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Unit Price</Label>
                      <Input className="h-9" type="number" step="0.01" min="0" placeholder="0.00" {...form.register(`lineItems.${idx}.unitPriceCents`)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tax (%)</Label>
                      <Input className="h-9" type="number" step="0.01" min="0" max="100" {...form.register(`lineItems.${idx}.taxPercent`)} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs">Line Total</Label>
                      <div className="flex items-center h-9 px-3 rounded-md bg-muted text-sm font-medium text-foreground">
                        {formatMoney(
                          Math.round(
                            Number(form.watch(`lineItems.${idx}.quantity`) || 0) *
                              Number(form.watch(`lineItems.${idx}.unitPriceCents`) || 0) *
                              100,
                          ),
                          props.orgDefaults.currency,
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">Discount</CardTitle>
                <Switch
                  checked={discountEnabled}
                  onCheckedChange={(checked) => {
                    setDiscountEnabled(checked);
                    if (checked && !form.getValues("discountType")) {
                      form.setValue("discountType", "PERCENT");
                    }
                    if (!checked) {
                      form.setValue("discountType", undefined);
                      form.setValue("discountValue", "");
                    }
                  }}
                />
              </div>
            </CardHeader>
            {discountEnabled ? (
              <CardContent>
                <div className="flex gap-3">
                  <Select value={discountType} onValueChange={(value: "PERCENT" | "FIXED") => form.setValue("discountType", value)}>
                    <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENT">Percentage</SelectItem>
                      <SelectItem value="FIXED">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input className="h-9 w-32" type="number" step="0.01" min="0" {...form.register("discountValue")} placeholder={discountType === "PERCENT" ? "e.g. 10" : "e.g. 50.00"} />
                </div>
              </CardContent>
            ) : null}
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Notes & Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea className="min-h-[80px] resize-none" placeholder="Add a note for your customer..." {...form.register("notes")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer block">
                <input type="file" className="hidden" onChange={handleAttachmentUpload} />
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">
                  Click to select files
                </p>
                <p className="text-xs text-muted-foreground mt-1">PDF, images, or documents up to 10MB</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Attachments are uploaded from the invoice detail page after saving.</p>
                {attachments.length > 0 ? (
                  <p className="text-xs text-muted-foreground mt-2">{attachments.length} file(s) noted — upload after saving</p>
                ) : null}
              </label>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">{formatMoney(subtotal, props.orgDefaults.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium text-foreground">{formatMoney(taxTotal, props.orgDefaults.currency)}</span>
                </div>
                {discountEnabled && discountAmount > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-emerald-600">-{formatMoney(discountAmount, props.orgDefaults.currency)}</span>
                  </div>
                ) : null}
                <Separator />
                <div className="flex justify-between text-base">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-foreground">{formatMoney(total, props.orgDefaults.currency)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  className="w-full gap-1.5 font-medium"
                  type="submit"
                  onClick={() => setSubmitIntent("send")}
                >
                  <Send className="h-4 w-4" /> Send invoice
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-1.5 bg-transparent"
                  type="submit"
                  onClick={() => setSubmitIntent("draft")}
                >
                  <Save className="h-4 w-4" /> Save draft
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-1.5 bg-transparent"
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  title="Print this page"
                >
                  <Eye className="h-4 w-4" /> Print preview
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full gap-1 text-xs text-muted-foreground">
                    <MoreHorizontal className="h-3.5 w-3.5" /> More actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-44">
                  <DropdownMenuItem
                    onSelect={() => {
                      const payload = {
                        customerId: form.getValues("customerId"),
                        paymentTermsDays: form.getValues("paymentTermsDays"),
                        dueDate: form.getValues("dueDate"),
                        notes: form.getValues("notes"),
                        totalCents: total,
                        lineItems: form.getValues("lineItems"),
                      };
                      const xml = `<invoice><customer>${payload.customerId}</customer><dueDate>${payload.dueDate || ""}</dueDate><totalCents>${payload.totalCents}</totalCents><items>${payload.lineItems.length}</items></invoice>`;
                      const blob = new Blob([xml], { type: "application/xml" });
                      const url = URL.createObjectURL(blob);
                      const anchor = document.createElement("a");
                      anchor.href = url;
                      anchor.download = `invoice-draft-${Date.now()}.xml`;
                      anchor.click();
                      URL.revokeObjectURL(url);
                      toast.success("XML exported");
                    }}
                  >
                    <FileCode className="h-4 w-4 mr-2" /> Export XML
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      const current = form.getValues("lineItems");
                      const last = current[current.length - 1];
                      if (!last) return;
                      items.append({ ...last });
                      toast.success("Last line item duplicated");
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onSelect={() => {
                      form.reset({
                        customerId: props.customers[0]?.id ?? "",
                        paymentTermsDays: "14",
                        taxPercent: String(props.orgDefaults.taxPercent ?? 7),
                        lineItems: [
                          {
                            description: "",
                            quantity: "1",
                            unitPriceCents: "0",
                            unit: "each",
                            taxPercent: String(props.orgDefaults.taxPercent ?? 7),
                          },
                        ],
                      });
                      setAttachments([]);
                      setDiscountEnabled(false);
                      toast.success("Draft cleared");
                    }}
                  >
                    <Ban className="h-4 w-4 mr-2" /> Clear form
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
