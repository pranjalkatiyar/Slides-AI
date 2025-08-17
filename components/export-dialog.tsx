"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, FileText, Code, Presentation } from "lucide-react"
import type { Slide } from "@/types/slide-types"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slides: Slide[]
  currentSlide: Slide
  onRevealExport: () => void
}

export function ExportDialog({ open, onOpenChange, slides, currentSlide, onRevealExport }: ExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<"json" | "html">("json")
  const [exportScope, setExportScope] = useState<"all" | "current">("all")
  const [includeAudio, setIncludeAudio] = useState(true)
  const [includeTranscripts, setIncludeTranscripts] = useState(true)

  const handleExport = () => {
    const slidesToExport = exportScope === "all" ? slides : [currentSlide]

    switch (exportFormat) {
      case "json":
        exportAsJSON(slidesToExport)
        break
      case "html":
        exportAsHTML(slidesToExport)
        break
    }

    onOpenChange(false)
  }

  const exportAsJSON = (slides: Slide[]) => {
    const exportData = {
      slides: slides.map((slide) => ({
        ...slide,
        audio: includeAudio ? slide.audio : undefined,
        transcript: includeTranscripts ? slide.transcript : undefined,
      })),
      exportedAt: new Date().toISOString(),
      format: "slide-editor-v2",
      version: "2.0.0",
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", `slides-${new Date().toISOString().split("T")[0]}.json`)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  const exportAsHTML = (slides: Slide[]) => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Slide Presentation</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .slide { background: white; margin: 20px 0; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); position: relative; min-height: 400px; }
        .slide-title { font-size: 2em; font-weight: bold; margin-bottom: 10px; }
        .slide-summary { font-size: 1.2em; color: #666; margin-bottom: 20px; }
        .element { position: absolute; }
        .element-text { font-size: 1.1em; line-height: 1.6; background: white; padding: 10px; border-radius: 4px; }
        .element-image { border-radius: 4px; }
        .element-code { background: #1a1a1a; color: #00ff00; padding: 15px; border-radius: 4px; font-family: 'Courier New', monospace; overflow-x: auto; }
        .element-list { background: white; padding: 15px; border-radius: 4px; }
        .element-list ul { margin: 0; padding-left: 20px; }
        .element-quiz { background: #f0f0ff; padding: 15px; border-radius: 4px; border-left: 4px solid #6366f1; }
        .transcript { background: #f9f9f9; padding: 15px; border-radius: 4px; margin-top: 20px; }
        .audio-controls { margin: 10px 0; }
        
        /* Animation classes */
        .animate-fadeIn { animation: fadeIn 1s ease-in; }
        .animate-slideInLeft { animation: slideInLeft 1s ease-out; }
        .animate-slideInRight { animation: slideInRight 1s ease-out; }
        .animate-slideInUp { animation: slideInUp 1s ease-out; }
        .animate-slideInDown { animation: slideInDown 1s ease-out; }
        .animate-zoomIn { animation: zoomIn 1s ease-out; }
        .animate-zoomOut { animation: zoomOut 1s ease-out; }
        .animate-rotateIn { animation: rotateIn 1s ease-out; }
        .animate-bounce { animation: bounce 1s ease-out; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slideInUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes slideInDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        @keyframes zoomIn { from { transform: scale(0); } to { transform: scale(1); } }
        @keyframes zoomOut { from { transform: scale(2); } to { transform: scale(1); } }
        @keyframes rotateIn { from { transform: rotate(-360deg); } to { transform: rotate(0deg); } }
        @keyframes bounce { 0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); } 40%, 43% { transform: translate3d(0, -30px, 0); } 70% { transform: translate3d(0, -15px, 0); } 90% { transform: translate3d(0,-4px,0); } }
    </style>
</head>
<body>
    <h1>Slide Presentation</h1>
    ${slides
      .map(
        (slide, index) => `
    <div class="slide" style="${slide.backgroundColor ? `background-color: ${slide.backgroundColor};` : ""} ${slide.backgroundImage ? `background-image: url(${slide.backgroundImage}); background-size: ${slide.backgroundSize || "cover"}; background-position: center;` : ""}">
        ${slide.title ? `<div class="slide-title">${slide.title}</div>` : ""}
        ${slide.summary ? `<div class="slide-summary">${slide.summary}</div>` : ""}
        
        ${slide.elements
          .map((element) => {
            const animationClass =
              element.animation && element.animation !== "none" ? `animate-${element.animation}` : ""
            const animationStyle = `
              ${element.animationDelay ? `animation-delay: ${element.animationDelay}ms;` : ""}
              ${element.animationDuration ? `animation-duration: ${element.animationDuration}ms;` : ""}
            `

            switch (element.type) {
              case "text":
                return `<div class="element element-text ${animationClass}" style="left: ${element.x || 0}px; top: ${element.y || 0}px; width: ${element.width || "auto"}; height: ${element.height || "auto"}; font-size: ${element.fontSize || 16}px; color: ${element.color || "#000"}; ${animationStyle}">
                  <p>${element.content.replace(/\n/g, "<br>")}</p>
                </div>`
              case "image":
                return `<div class="element ${animationClass}" style="left: ${element.x || 0}px; top: ${element.y || 0}px; ${animationStyle}">
                  <img src="${element.content}" alt="Slide image" class="element-image" style="width: ${element.width || 300}px; height: ${element.height || 200}px; object-fit: cover;" />
                </div>`
              case "code":
                return `<div class="element element-code ${animationClass}" style="left: ${element.x || 0}px; top: ${element.y || 0}px; width: ${element.width || 400}px; height: ${element.height || 200}px; ${animationStyle}">
                  <pre>${element.content}</pre>
                </div>`
              case "list":
                return `<div class="element element-list ${animationClass}" style="left: ${element.x || 0}px; top: ${element.y || 0}px; width: ${element.width || 250}px; height: ${element.height || "auto"}; font-size: ${element.fontSize || 14}px; color: ${element.color || "#000"}; ${animationStyle}">
                  <ul>${element.content
                    .split("\n")
                    .filter((item) => item.trim())
                    .map((item) => `<li>${item.trim()}</li>`)
                    .join("")}</ul>
                </div>`
              case "quiz":
                try {
                  const quizData = JSON.parse(element.content)
                  return `<div class="element element-quiz ${animationClass}" style="left: ${element.x || 0}px; top: ${element.y || 0}px; width: ${element.width || "auto"}; height: ${element.height || "auto"}; ${animationStyle}">
                    <h3>${quizData.question}</h3>
                    <ul>${quizData.options.map((option: string, idx: number) => `<li class="${idx === quizData.correct ? "correct" : ""}">${option}</li>`).join("")}</ul>
                  </div>`
                } catch {
                  return `<div class="element element-quiz ${animationClass}" style="left: ${element.x || 0}px; top: ${element.y || 0}px; ${animationStyle}">Quiz: ${element.content}</div>`
                }
              default:
                return ""
            }
          })
          .join("")}
        
        ${slide.audio && includeAudio ? `<div class="audio-controls"><audio controls><source src="${slide.audio}" /></audio></div>` : ""}
        ${slide.transcript && includeTranscripts ? `<div class="transcript"><strong>Transcript:</strong><br>${slide.transcript.replace(/\n/g, "<br>")}</div>` : ""}
    </div>
    `,
      )
      .join("")}
</body>
</html>
    `

    const blob = new Blob([htmlContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `slides-${new Date().toISOString().split("T")[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Options
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="standard" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="standard">Standard Export</TabsTrigger>
            <TabsTrigger value="reveal">Reveal.js Export</TabsTrigger>
          </TabsList>

          <TabsContent value="standard" className="space-y-4">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      JSON (Editable)
                    </div>
                  </SelectItem>
                  <SelectItem value="html">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      HTML (Web Page)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Export Scope</Label>
              <Select value={exportScope} onValueChange={(value: any) => setExportScope(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Slides ({slides.length})</SelectItem>
                  <SelectItem value="current">Current Slide Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Include</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="audio" checked={includeAudio} onCheckedChange={setIncludeAudio} />
                  <Label htmlFor="audio" className="text-sm">
                    Audio files
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="transcripts" checked={includeTranscripts} onCheckedChange={setIncludeTranscripts} />
                  <Label htmlFor="transcripts" className="text-sm">
                    Transcripts
                  </Label>
                </div>
              </div>
            </div>

            <Button onClick={handleExport} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Export {exportScope === "all" ? `${slides.length} Slides` : "Current Slide"}
            </Button>
          </TabsContent>

          <TabsContent value="reveal" className="space-y-4">
            <div className="text-center py-6">
              <Presentation className="w-16 h-16 mx-auto mb-4 text-blue-500" />
              <h3 className="text-lg font-semibold mb-2">Reveal.js Presentation</h3>
              <p className="text-sm text-gray-600 mb-4">
                Export as a professional interactive presentation with animations, fragments, and speaker notes.
              </p>
              <Button onClick={onRevealExport} className="w-full">
                <Presentation className="w-4 h-4 mr-2" />
                Configure Reveal.js Export
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
