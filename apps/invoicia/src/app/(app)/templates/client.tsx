"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Eye, FileText, Palette, RotateCcw, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { getTemplatePreviewUrlAction, saveTemplateBrandingAction } from "./actions"

const templates = [
  {
    id: "1",
    name: "Classic Professional",
    description: "Clean, minimal design with structured layout",
  },
  {
    id: "2",
    name: "Modern Accent",
    description: "Bold accent colors with contemporary typography",
  },
  {
    id: "3",
    name: "Compact",
    description: "Space-efficient design for simple invoices",
  },
]

interface TemplatesClientProps {
  initialTemplateId: string
  initialAccentColor: string
  initialLogoPath: string
  initialLogoUrl: string
  companyPreview: {
    name: string
    addressLine1: string
    city: string
    state: string
    email: string
  }
}

function normalizeHex(input: string) {
  const value = input.trim()
  if (!value) return ""
  return value.startsWith("#") ? value : `#${value}`
}

function isValidHex(input: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(input)
}

export default function TemplatesClient({
  initialTemplateId,
  initialAccentColor,
  initialLogoPath,
  initialLogoUrl,
  companyPreview,
}: TemplatesClientProps) {
  const router = useRouter()
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [activeTemplate, setActiveTemplate] = useState(initialTemplateId)
  const [accentColor, setAccentColor] = useState(initialAccentColor)
  const [logoName, setLogoName] = useState(initialLogoPath ? initialLogoPath.split(/[\\/]/).pop() || "" : "")
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl)
  const [savingBranding, setSavingBranding] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)

  const normalizedColor = normalizeHex(accentColor)
  const validColor = isValidHex(normalizedColor)
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === activeTemplate) || templates[0],
    [activeTemplate],
  )

  const hasUnsavedChanges =
    activeTemplate !== initialTemplateId ||
    normalizeHex(accentColor).toLowerCase() !== initialAccentColor.toLowerCase()

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      event.target.value = ""
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Logo must be smaller than 10MB")
      event.target.value = ""
      return
    }

    setLogoUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/app/settings/logo", { method: "POST", body: formData })
      const body = (await response.json().catch(() => null)) as
        | { ok: boolean; error?: string; logoUrl?: string; fileName?: string }
        | null
      if (!response.ok || !body?.ok) {
        throw new Error(body?.error || "Failed to upload logo")
      }

      setLogoName(body.fileName || file.name)
      setLogoUrl(body.logoUrl || `/api/app/settings/logo?ts=${Date.now()}`)
      toast.success("Logo uploaded")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload logo")
    } finally {
      setLogoUploading(false)
      event.target.value = ""
    }
  }

  const handleSaveBranding = async () => {
    const color = normalizeHex(accentColor)
    if (!isValidHex(color)) {
      toast.error("Accent color must be a valid hex code (e.g. #6366F1)")
      return
    }

    setSavingBranding(true)
    try {
      await saveTemplateBrandingAction({
        templateId: activeTemplate,
        accentColor: color,
      })
      toast.success("Template branding saved")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save branding")
    } finally {
      setSavingBranding(false)
    }
  }

  const handlePreview = async () => {
    setPreviewLoading(true)
    try {
      const result = await getTemplatePreviewUrlAction()
      if (result.kind === "setup") {
        toast.info("Create an invoice first to preview template output.")
        router.push(result.previewUrl)
      } else {
        window.location.assign(result.previewUrl)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to open preview")
    } finally {
      setPreviewLoading(false)
    }
  }

  const resetBranding = () => {
    setActiveTemplate(initialTemplateId)
    setAccentColor(initialAccentColor)
    toast.success("Unsaved branding changes reset")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Templates</h1>
        <p className="mt-1 text-sm text-muted-foreground">Customize your invoice branding and appearance</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Template Gallery</h2>
            {hasUnsavedChanges ? <Badge variant="outline">Unsaved changes</Badge> : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => {
              const selected = activeTemplate === template.id
              return (
                <button
                  key={template.id}
                  type="button"
                  className={`rounded-xl border text-left transition-all ${selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40 hover:shadow-md"}`}
                  onClick={() => setActiveTemplate(template.id)}
                >
                  <div className="p-4">
                    <div className="mb-3 flex aspect-[3/4] items-center justify-center rounded-md border border-border bg-muted/40">
                      <FileText className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </div>
                      {selected ? <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" /> : null}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Live preview</p>
                  <p className="text-xs text-muted-foreground">How this template will feel with your current branding</p>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Palette className="h-3 w-3" /> {selectedTemplate.name}
                </Badge>
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between rounded-md p-3" style={{ backgroundColor: validColor ? normalizedColor : initialAccentColor }}>
                  <div className="text-sm font-semibold text-white">{companyPreview.name || "Your company"}</div>
                  <div className="text-xs text-white/90">Invoice #INV-2026-000001</div>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-5/6 rounded bg-muted" />
                  <div className="h-3 w-4/6 rounded bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Branding</h2>
          <Card>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label className="text-xs">Company Logo</Label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <button
                  type="button"
                  className="w-full rounded-lg border-2 border-dashed border-border p-4 text-center transition-colors hover:border-primary/50"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                >
                  {logoUrl ? (
                    <div className="space-y-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoUrl} alt="Company logo" className="mx-auto h-12 max-w-full object-contain" />
                      <p className="text-xs text-muted-foreground">{logoName || "Uploaded logo"}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {logoUploading ? "Uploading..." : "Click to upload logo"}
                      </p>
                    </div>
                  )}
                </button>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs">Primary Accent Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={validColor ? normalizedColor : initialAccentColor}
                    onChange={(event) => setAccentColor(event.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-md border border-border"
                  />
                  <Input
                    value={accentColor}
                    onChange={(event) => setAccentColor(event.target.value)}
                    className="h-9 font-mono text-sm"
                  />
                </div>
                {!validColor ? (
                  <p className="text-xs text-destructive">Enter a valid hex value like `#6366F1`.</p>
                ) : null}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs">Company Details Preview</Label>
                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  <p className="text-sm font-semibold text-foreground">{companyPreview.name || "Invoicia"}</p>
                  {companyPreview.addressLine1 ? <p>{companyPreview.addressLine1}</p> : null}
                  {companyPreview.city || companyPreview.state ? (
                    <p>{[companyPreview.city, companyPreview.state].filter(Boolean).join(", ")}</p>
                  ) : null}
                  {companyPreview.email ? <p>{companyPreview.email}</p> : null}
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full gap-1.5"
                  type="button"
                  onClick={handleSaveBranding}
                  disabled={savingBranding || !hasUnsavedChanges || !validColor}
                >
                  {savingBranding ? "Saving..." : "Save branding"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-1.5 bg-transparent"
                  type="button"
                  onClick={handlePreview}
                  disabled={previewLoading}
                >
                  <Eye className="h-4 w-4" /> {previewLoading ? "Opening..." : "Preview PDF"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full gap-1.5"
                  type="button"
                  onClick={resetBranding}
                  disabled={!hasUnsavedChanges}
                >
                  <RotateCcw className="h-4 w-4" /> Reset changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
