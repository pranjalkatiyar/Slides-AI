"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Presentation } from "lucide-react"
import type { Slide, RevealConfig } from "@/types/slide-types"

interface RevealExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slides: Slide[]
  currentSlide: Slide
}

const revealThemes = [
  "black",
  "white",
  "league",
  "beige",
  "sky",
  "night",
  "serif",
  "simple",
  "solarized",
  "blood",
  "moon",
]

const transitions = ["none", "fade", "slide", "convex", "concave", "zoom"]

export function RevealExportDialog({ open, onOpenChange, slides, currentSlide }: RevealExportDialogProps) {
  const [exportScope, setExportScope] = useState<"all" | "current">("all")
  const [presentationTitle, setPresentationTitle] = useState("My Presentation")
  const [authorName, setAuthorName] = useState("")
  const [description, setDescription] = useState("")

  const [revealConfig, setRevealConfig] = useState<RevealConfig>({
    hash: true,
    history: true,
    controls: true,
    progress: true,
    center: true,
    touch: true,
    loop: false,
    rtl: false,
    navigationMode: "default",
    shuffle: false,
    fragments: true,
    fragmentInURL: false,
    embedded: false,
    help: true,
    showNotes: false,
    autoSlide: 0,
    autoSlideStoppable: true,
    mouseWheel: false,
    hideInactiveCursor: true,
    previewLinks: false,
    transition: "slide",
    transitionSpeed: "default",
    backgroundTransition: "fade",
  })

  const [selectedTheme, setSelectedTheme] = useState("white")
  const [includePlugins, setIncludePlugins] = useState({
    notes: true,
    search: true,
    zoom: true,
    highlight: true,
    math: false,
    markdown: false,
  })

  const handleExport = () => {
    const slidesToExport = exportScope === "all" ? slides : [currentSlide]
    exportAsRevealJS(slidesToExport)
    onOpenChange(false)
  }

  const exportAsRevealJS = (slides: Slide[]) => {
    const revealHTML = generateRevealHTML(slides, {
      title: presentationTitle,
      author: authorName,
      description,
      theme: selectedTheme,
      config: revealConfig,
      plugins: includePlugins,
    })

    const blob = new Blob([revealHTML], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${presentationTitle.toLowerCase().replace(/\s+/g, "-")}-reveal.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generateRevealHTML = (slides: Slide[], options: any) => {
    const { title, author, description, theme, config, plugins } = options

    const pluginScripts = []
    const pluginCSS = []

    if (plugins.notes) {
      pluginScripts.push("RevealNotes")
    }
    if (plugins.search) {
      pluginScripts.push("RevealSearch")
    }
    if (plugins.zoom) {
      pluginScripts.push("RevealZoom")
    }
    if (plugins.highlight) {
      pluginScripts.push("RevealHighlight")
      pluginCSS.push(
        '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/default.min.css">',
      )
    }
    if (plugins.math) {
      pluginScripts.push("RevealMath.KaTeX")
    }

    const slidesHTML = slides
      .map((slide) => {
        const slideAttrs = []

        if (slide.transition) slideAttrs.push(`data-transition="${slide.transition}"`)
        if (slide.transitionSpeed) slideAttrs.push(`data-transition-speed="${slide.transitionSpeed}"`)
        if (slide.backgroundColor) slideAttrs.push(`data-background-color="${slide.backgroundColor}"`)
        if (slide.backgroundImage) slideAttrs.push(`data-background-image="${slide.backgroundImage}"`)
        if (slide.backgroundVideo) slideAttrs.push(`data-background-video="${slide.backgroundVideo}"`)
        if (slide.backgroundSize) slideAttrs.push(`data-background-size="${slide.backgroundSize}"`)

        // Calculate proper spacing for title and subtitle
        const titleHeight = slide.title ? 60 : 0
        const subtitleHeight = slide.summary ? 40 : 0
        const headerHeight = titleHeight + subtitleHeight + (slide.title && slide.summary ? 20 : 0)

        // Create elements with proper positioning and animations
        const elementsHTML = slide.elements
          .sort((a, b) => (a.fragmentIndex || 0) - (b.fragmentIndex || 0))
          .map((element) => {
            let elementHTML = ""
            let fragmentClass = ""
            let animationClass = ""

            // Add fragment animation
            if (element.fragmentType) {
              fragmentClass = `fragment ${element.fragmentType}`
              if (element.fragmentIndex !== undefined) {
                fragmentClass += ` data-fragment-index="${element.fragmentIndex}"`
              }
            }

            // Add element animation
            if (element.animation && element.animation !== "none") {
              animationClass = `animate-${element.animation}`
            }

            const combinedClass = `${fragmentClass} ${animationClass}`.trim()

            const style = `
              position: absolute;
              left: ${element.x || 0}px;
              top: ${(element.y || 0) + headerHeight}px;
              ${element.width ? `width: ${element.width}px;` : ""}
              ${element.height ? `height: ${element.height}px;` : ""}
              ${element.fontSize ? `font-size: ${element.fontSize}px;` : ""}
              ${element.color ? `color: ${element.color};` : ""}
              ${element.rotation ? `transform: rotate(${element.rotation}deg);` : ""}
            `.trim()

            switch (element.type) {
              case "text":
                elementHTML = `<div class="${combinedClass}" style="${style}">
                  <div class="text-element" style="background-color: ${element.backgroundColor || "rgba(255, 255, 255, 0.9)"}; backdrop-filter: blur(4px);">
                    <p>${element.content.replace(/\n/g, "<br>")}</p>
                  </div>
                </div>`
                break
              case "image":
                elementHTML = `<div class="${combinedClass}" style="${style}">
                  <img src="${element.content}" alt="Slide image" style="max-width: 100%; height: auto; border-radius: 8px;" />
                </div>`
                break
              case "code":
                elementHTML = `<div class="${combinedClass}" style="${style}">
                  <pre><code class="hljs">${element.content}</code></pre>
                </div>`
                break
              case "quiz":
                try {
                  const quizData = JSON.parse(element.content)
                  elementHTML = `<div class="${combinedClass}" style="${style}">
                    <div class="quiz-container">
                      <h3>${quizData.question}</h3>
                      <ul class="quiz-options">
                        ${quizData.options
                          .map(
                            (option: string, idx: number) =>
                              `<li class="quiz-option ${idx === quizData.correct ? "correct" : ""}" onclick="selectQuizAnswer(this, ${idx}, ${quizData.correct})">${option}</li>`,
                          )
                          .join("")}
                      </ul>
                    </div>
                  </div>`
                } catch {
                  elementHTML = `<div class="${combinedClass}" style="${style}">
                    <div class="quiz-placeholder">Quiz: ${element.content}</div>
                  </div>`
                }
                break
              case "list":
                elementHTML = `<div class="${combinedClass}" style="${style}">
                    <ul class="reveal-list" style="background-color: ${element.backgroundColor || "rgba(255, 255, 255, 0.9)"}; backdrop-filter: blur(4px);">
                      ${element.content
                        .split("\n")
                        .filter((item) => item.trim())
                        .map((item) => `<li class="fragment fade-in">${item.trim()}</li>`)
                        .join("")}
                    </ul>
                  </div>`
                break
              default:
                elementHTML = `<div class="${combinedClass}" style="${style}">${element.content}</div>`
            }

            return elementHTML
          })
          .join("\n")

        const speakerNotes = slide.speakerNotes || slide.transcript || ""
        const notesHTML = speakerNotes ? `<aside class="notes">${speakerNotes}</aside>` : ""

        return `
    <section ${slideAttrs.join(" ")}>
      <div class="slide-content" style="position: relative; width: 100%; height: 100vh; overflow: hidden;">
        ${slide.title ? `<h1 style="position: absolute; top: 20px; left: 20px; right: 20px; z-index: 100; margin: 0; line-height: 1.2;">${slide.title}</h1>` : ""}
        ${slide.summary ? `<h2 style="position: absolute; top: ${slide.title ? "80px" : "20px"}; left: 20px; right: 20px; font-size: 1.2em; color: #666; z-index: 100; margin: 0; line-height: 1.4;">${slide.summary}</h2>` : ""}
        <div class="elements-container" style="position: absolute; top: ${headerHeight + 20}px; left: 0; right: 0; bottom: 0;">
          ${elementsHTML}
        </div>
      </div>
      ${notesHTML}
    </section>
  `
      })
      .join("\n")

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="author" content="${author}">

  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/reveal.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/theme/${theme}.min.css">
  ${pluginCSS.join("\n  ")}

  <style>
    .reveal .slides section {
      text-align: left;
      height: 100vh;
    }
    
    .slide-content {
      position: relative !important;
      width: 100% !important;
      height: 100vh !important;
    }
    
    .elements-container {
      position: relative !important;
    }
    
    .text-element {
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }
    
    .quiz-container {
      background: #f8f9fa;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      max-width: 500px;
    }
    
    .quiz-container h3 {
      margin-top: 0;
      color: #495057;
    }
    
    .quiz-options {
      list-style: none;
      padding: 0;
    }
    
    .quiz-option {
      background: #fff;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 10px 15px;
      margin: 8px 0;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .quiz-option:hover {
      background: #e9ecef;
      border-color: #adb5bd;
    }
    
    .quiz-option.selected {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }
    
    .quiz-option.correct-answer {
      background: #28a745 !important;
      color: white !important;
      border-color: #28a745 !important;
    }
    
    .quiz-option.wrong-answer {
      background: #dc3545 !important;
      color: white !important;
      border-color: #dc3545 !important;
    }

    .reveal-list {
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }

    .reveal-list li {
      margin: 8px 0;
      padding: 5px 0;
    }

    pre code {
      background: #1a1a1a !important;
      color: #00ff00 !important;
      padding: 20px !important;
      border-radius: 8px !important;
      font-family: 'Courier New', monospace !important;
    }

    /* Fragment animations */
    .reveal .fragment.highlight-current-red.current-fragment {
      color: #ff2c2d;
    }
    
    .reveal .fragment.highlight-current-green.current-fragment {
      color: #17ff2e;
    }
    
    .reveal .fragment.highlight-current-blue.current-fragment {
      color: #1b91ff;
    }

    /* Enhanced animations for Reveal.js */
    .animate-fadeIn { 
      animation: revealFadeIn 1s ease-in forwards; 
      opacity: 0;
    }
    .animate-slideInLeft { 
      animation: revealSlideInLeft 1s ease-out forwards; 
      transform: translateX(-100%);
    }
    /* ... other animations ... */

    @keyframes revealFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes revealSlideInLeft {
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  </style>
</head>

<body>
  <div class="reveal">
    <div class="slides">
      ${slidesHTML}
    </div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/reveal.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/plugin/notes/notes.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/plugin/search/search.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/plugin/zoom/zoom.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/plugin/highlight/highlight.min.js"></script>
  ${plugins.math ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/plugin/math/math.min.js"></script>' : ""}

  <script>
    Reveal.initialize({
      hash: ${config.hash},
      history: ${config.history},
      controls: ${config.controls},
      progress: ${config.progress},
      center: ${config.center},
      touch: ${config.touch},
      loop: ${config.loop},
      rtl: ${config.rtl},
      navigationMode: '${config.navigationMode}',
      shuffle: ${config.shuffle},
      fragments: ${config.fragments},
      fragmentInURL: ${config.fragmentInURL},
      embedded: ${config.embedded},
      help: ${config.help},
      showNotes: ${config.showNotes},
      autoSlide: ${config.autoSlide},
      autoSlideStoppable: ${config.autoSlideStoppable},
      mouseWheel: ${config.mouseWheel},
      hideInactiveCursor: ${config.hideInactiveCursor},
      previewLinks: ${config.previewLinks},
      transition: '${config.transition}',
      transitionSpeed: '${config.transitionSpeed}',
      backgroundTransition: '${config.backgroundTransition}',

      plugins: [${pluginScripts.join(", ")}]
    });

    // Quiz interaction functionality
    function selectQuizAnswer(element, selectedIndex, correctIndex) {
      const quizContainer = element.closest('.quiz-container');
      const options = quizContainer.querySelectorAll('.quiz-option');
      
      // Remove previous selections
      options.forEach(opt => {
        opt.classList.remove('selected', 'correct-answer', 'wrong-answer');
      });
      
      // Mark selected answer
      element.classList.add('selected');
      
      // Show correct/incorrect after a brief delay
      setTimeout(() => {
        if (selectedIndex === correctIndex) {
          element.classList.add('correct-answer');
        } else {
          element.classList.add('wrong-answer');
          // Also highlight the correct answer
          options[correctIndex].classList.add('correct-answer');
        }
      }, 500);
    }

    // Audio and animation synchronization
    Reveal.addEventListener('slidechanged', function(event) {
      const slide = event.currentSlide;
      const audio = slide.querySelector('audio');
      
      if (audio) {
        // Play audio when slide changes
        audio.play();
        
        // Trigger animations based on audio timing
        const animatedElements = slide.querySelectorAll('[data-animation-delay]');
        animatedElements.forEach(element => {
          const delay = parseInt(element.dataset.animationDelay) || 0;
          setTimeout(() => {
            element.classList.add('animate');
          }, delay);
        });
      }
    });
  </script>
</body>
</html>`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Presentation className="w-5 h-5" />
            Export to Reveal.js
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
            <TabsTrigger value="plugins">Plugins</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="space-y-2">
              <Label>Presentation Title</Label>
              <Input
                value={presentationTitle}
                onChange={(e) => setPresentationTitle(e.target.value)}
                placeholder="My Awesome Presentation"
              />
            </div>

            <div className="space-y-2">
              <Label>Author</Label>
              <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Your Name" />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your presentation"
                rows={3}
              />
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
          </TabsContent>

          <TabsContent value="theme" className="space-y-4">
            <div className="space-y-2">
              <Label>Reveal.js Theme</Label>
              <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {revealThemes.map((theme) => (
                    <SelectItem key={theme} value={theme}>
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Transition</Label>
              <Select
                value={revealConfig.transition}
                onValueChange={(value: any) => setRevealConfig((prev) => ({ ...prev, transition: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {transitions.map((transition) => (
                    <SelectItem key={transition} value={transition}>
                      {transition.charAt(0).toUpperCase() + transition.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Transition Speed</Label>
              <Select
                value={revealConfig.transitionSpeed}
                onValueChange={(value: any) => setRevealConfig((prev) => ({ ...prev, transitionSpeed: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="fast">Fast</SelectItem>
                  <SelectItem value="slow">Slow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="controls"
                  checked={revealConfig.controls}
                  onCheckedChange={(checked) => setRevealConfig((prev) => ({ ...prev, controls: !!checked }))}
                />
                <Label htmlFor="controls">Show Controls</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="progress"
                  checked={revealConfig.progress}
                  onCheckedChange={(checked) => setRevealConfig((prev) => ({ ...prev, progress: !!checked }))}
                />
                <Label htmlFor="progress">Progress Bar</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="center"
                  checked={revealConfig.center}
                  onCheckedChange={(checked) => setRevealConfig((prev) => ({ ...prev, center: !!checked }))}
                />
                <Label htmlFor="center">Center Slides</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fragments"
                  checked={revealConfig.fragments}
                  onCheckedChange={(checked) => setRevealConfig((prev) => ({ ...prev, fragments: !!checked }))}
                />
                <Label htmlFor="fragments">Enable Fragments</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="loop"
                  checked={revealConfig.loop}
                  onCheckedChange={(checked) => setRevealConfig((prev) => ({ ...prev, loop: !!checked }))}
                />
                <Label htmlFor="loop">Loop Presentation</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mouseWheel"
                  checked={revealConfig.mouseWheel}
                  onCheckedChange={(checked) => setRevealConfig((prev) => ({ ...prev, mouseWheel: !!checked }))}
                />
                <Label htmlFor="mouseWheel">Mouse Wheel Navigation</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Auto Slide (seconds, 0 = disabled)</Label>
              <Input
                type="number"
                value={revealConfig.autoSlide}
                onChange={(e) =>
                  setRevealConfig((prev) => ({ ...prev, autoSlide: Number.parseInt(e.target.value) || 0 }))
                }
                min="0"
                max="60"
              />
            </div>
          </TabsContent>

          <TabsContent value="plugins" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notes"
                  checked={includePlugins.notes}
                  onCheckedChange={(checked) => setIncludePlugins((prev) => ({ ...prev, notes: !!checked }))}
                />
                <Label htmlFor="notes">Speaker Notes (Press 'S' to open)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="search"
                  checked={includePlugins.search}
                  onCheckedChange={(checked) => setIncludePlugins((prev) => ({ ...prev, search: !!checked }))}
                />
                <Label htmlFor="search">Search (Ctrl+Shift+F)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="zoom"
                  checked={includePlugins.zoom}
                  onCheckedChange={(checked) => setIncludePlugins((prev) => ({ ...prev, zoom: !!checked }))}
                />
                <Label htmlFor="zoom">Zoom (Alt+Click)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="highlight"
                  checked={includePlugins.highlight}
                  onCheckedChange={(checked) => setIncludePlugins((prev) => ({ ...prev, highlight: !!checked }))}
                />
                <Label htmlFor="highlight">Code Highlighting</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="math"
                  checked={includePlugins.math}
                  onCheckedChange={(checked) => setIncludePlugins((prev) => ({ ...prev, math: !!checked }))}
                />
                <Label htmlFor="math">Math (KaTeX)</Label>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Export Reveal.js Presentation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
