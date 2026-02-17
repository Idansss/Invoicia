"use client"

import { useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { FileText, Eye, Upload, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { getActionErrorMessage, runUiAction } from "@/lib/ui-action-client"

const templates = [
  { id: "1", name: "Classic Professional", description: "Clean, minimal design with structured layout", preview: "Standard header, itemized table, and footer with payment details.", active: true },
  { id: "2", name: "Modern Accent", description: "Bold accent colors with contemporary typography", preview: "Color-block header, modern line items, and branded footer.", active: false },
  { id: "3", name: "Compact", description: "Space-efficient design for simple invoices", preview: "Single-column layout with condensed line items.", active: false },
]

export default function TemplatesPage() {
  const [activeTemplate, setActiveTemplate] = useState("1")
  const [accentColor, setAccentColor] = useState("#6366f1")
  const [previewLoading, setPreviewLoading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [uploadedLogoName, setUploadedLogoName] = useState("")
  const logoInputRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Logo must be smaller than 10MB")
      return
    }

    setLogoUploading(true)
    try {
      await runUiAction({
        type: "templates.logo.upload",
        payload: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        },
      })
      setUploadedLogoName(file.name)
      toast.success("Logo uploaded")
    } catch (error) {
      toast.error(getActionErrorMessage(error))
    } finally {
      setLogoUploading(false)
      event.target.value = ""
    }
  }

  const handlePreview = async () => {
    setPreviewLoading(true)
    try {
      await runUiAction({
        type: "templates.preview.pdf",
        payload: {
          templateId: activeTemplate,
          accentColor,
        },
      })
      toast.success("PDF preview generated")
    } catch (error) {
      toast.error(getActionErrorMessage(error))
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Templates</h1>
        <p className="text-sm text-muted-foreground mt-1">Customize your invoice branding and appearance</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Template Gallery */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Template Gallery</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md ${activeTemplate === template.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setActiveTemplate(template.id)}
              >
                <CardContent className="pt-6">
                  <div className="aspect-[3/4] rounded-md bg-muted/50 border border-border mb-3 flex items-center justify-center">
                    <FileText className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </div>
                    {activeTemplate === template.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Branding Editor */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Branding</h2>
          <Card>
            <CardContent className="pt-6 space-y-5">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label className="text-xs">Company Logo</Label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => logoInputRef.current?.click()}
                  role="button"
                  aria-label="Upload company logo"
                >
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">
                    {logoUploading ? "Uploading logo..." : uploadedLogoName ? `Uploaded: ${uploadedLogoName}` : "Click to upload logo"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Color Picker */}
              <div className="space-y-2">
                <Label className="text-xs">Primary Accent Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 rounded-md cursor-pointer border border-border"
                  />
                  <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-9 font-mono text-sm" />
                </div>
              </div>

              <Separator />

              {/* Company Details */}
              <div className="space-y-3">
                <Label className="text-xs">Company Details Preview</Label>
                <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                  <p className="text-sm font-semibold text-foreground">Acme Corporation</p>
                  <p className="text-xs text-muted-foreground">123 Business Ave, Suite 100</p>
                  <p className="text-xs text-muted-foreground">San Francisco, CA 94105</p>
                  <p className="text-xs text-muted-foreground">billing@acmecorp.com</p>
                </div>
              </div>

              <Button className="w-full gap-1.5" type="button" onClick={handlePreview} disabled={previewLoading}>
                <Eye className="h-4 w-4" /> {previewLoading ? "Generating..." : "Preview PDF"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
