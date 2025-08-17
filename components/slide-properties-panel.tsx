"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Settings, Palette, Play, StickyNote, Layers, ChevronLeft, ChevronRight } from "lucide-react"
import type { Slide, SlideElement } from "@/types/slide-types"
import { Slider } from "@/components/ui/slider"

interface SlidePropertiesPanelProps {
  slide: Slide
  selectedElement: SlideElement | null
  onUpdateSlide: (updates: Partial<Slide>) => void
  onUpdateElement: (elementId: string, updates: Partial<SlideElement>) => void
}

const transitions = ["none", "fade", "slide", "convex", "concave", "zoom"]
const transitionSpeeds = ["default", "fast", "slow"]
const fragmentTypes = [
  "fade-in",
  "fade-out",
  "highlight-red",
  "highlight-green",
  "highlight-blue",
  "grow",
  "shrink",
  "strike",
  "highlight-current-red",
  "highlight-current-green",
  "highlight-current-blue",
]

export function SlidePropertiesPanel({
  slide,
  selectedElement,
  onUpdateSlide,
  onUpdateElement,
}: SlidePropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<"slide" | "element">("slide")
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [debouncedColor, setDebouncedColor] = useState(slide.backgroundColor || "#ffffff")

  const handleSlideUpdate = useCallback((field: keyof Slide, value: any) => {
    onUpdateSlide({ [field]: value })
  }, [onUpdateSlide])

  const handleColorChange = useCallback((value: string) => {
    setDebouncedColor(value)
    // Only update after 100ms of no changes
    const timeoutId = setTimeout(() => {
      handleSlideUpdate("backgroundColor", value)
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [handleSlideUpdate])

  const handleElementUpdate = (field: keyof SlideElement, value: any) => {
    if (selectedElement) {
      onUpdateElement(selectedElement.id, { [field]: value })
    }
  }

  return (
    <div
      className={`${isPanelCollapsed ? "w-12" : "w-80"} bg-white border-l border-gray-200 flex flex-col transition-all duration-300`}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isPanelCollapsed && (
            <div className="flex gap-2">
              <Button
                variant={activeTab === "slide" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("slide")}
                className="flex-1"
              >
                <Settings className="w-4 h-4 mr-1" />
                Slide
              </Button>
              <Button
                variant={activeTab === "element" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("element")}
                className="flex-1"
                disabled={!selectedElement}
              >
                <Layers className="w-4 h-4 mr-1" />
                Element
              </Button>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setIsPanelCollapsed(!isPanelCollapsed)} className="p-1">
            {isPanelCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {!isPanelCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "slide" && (
            <>
              {/* Slide Transitions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Transitions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Transition Type</Label>
                    <Select
                      value={slide.transition || "slide"}
                      onValueChange={(value) => handleSlideUpdate("transition", value)}
                    >
                      <SelectTrigger className="h-8">
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
                    <Label className="text-xs">Transition Speed</Label>
                    <Select
                      value={slide.transitionSpeed || "default"}
                      onValueChange={(value) => handleSlideUpdate("transitionSpeed", value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {transitionSpeeds.map((speed) => (
                          <SelectItem key={speed} value={speed}>
                            {speed.charAt(0).toUpperCase() + speed.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Background Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Background
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={debouncedColor}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="w-12 h-8 p-1 border rounded"
                      />
                      <Input
                        value={debouncedColor}
                        onChange={(e) => handleColorChange(e.target.value)}
                        placeholder="#ffffff"
                        className="flex-1 h-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Background Image URL</Label>
                    <Input
                      value={slide.backgroundImage || ""}
                      onChange={(e) => handleSlideUpdate("backgroundImage", e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="h-8"
                    />
                  </div>

                  {slide.backgroundImage && (
                    <div className="space-y-2">
                      <Label className="text-xs">Background Size</Label>
                      <Select
                        value={slide.backgroundSize || "cover"}
                        onValueChange={(value) => handleSlideUpdate("backgroundSize", value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cover">Cover</SelectItem>
                          <SelectItem value="contain">Contain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Speaker Notes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <StickyNote className="w-4 h-4" />
                    Transcript
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={slide.transcript || ""}
                    onChange={(e) => onUpdateSlide({transcript:e.target.value})}
                    placeholder="Add Transcript for this slide..."
                    className="min-h-[100px] text-sm"
                  />
                 </CardContent>
              </Card>
            </>
          )}

          {activeTab === "element" && selectedElement && (
            <>
              {/* Element Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Element Properties
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedElement.type}</Badge>
                    <span className="text-xs text-gray-500">ID: {selectedElement.id}</span>
                  </div>

                  <Separator />

                  {/* Position */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">X Position</Label>
                      <Input
                        type="number"
                        value={selectedElement.x || 0}
                        onChange={(e) => handleElementUpdate("x", Number.parseInt(e.target.value) || 0)}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Y Position</Label>
                      <Input
                        type="number"
                        value={selectedElement.y || 0}
                        onChange={(e) => handleElementUpdate("y", Number.parseInt(e.target.value) || 0)}
                        className="h-8"
                      />
                    </div>
                  </div>

                  {/* Size */}
                  {selectedElement.type === "image" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Width</Label>
                        <Input
                          type="number"
                          value={selectedElement.width || 300}
                          onChange={(e) => handleElementUpdate("width", Number.parseInt(e.target.value) || 300)}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Height</Label>
                        <Input
                          type="number"
                          value={selectedElement.height || 200}
                          onChange={(e) => handleElementUpdate("height", Number.parseInt(e.target.value) || 200)}
                          className="h-8"
                        />
                      </div>
                    </div>
                  )}

                  {/* Text Properties */}
                  {selectedElement.type === "text" && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs">Font Size</Label>
                        <Input
                          type="number"
                          value={selectedElement.fontSize || 16}
                          onChange={(e) => handleElementUpdate("fontSize", Number.parseInt(e.target.value) || 16)}
                          className="h-8"
                          min="8"
                          max="72"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Text Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={selectedElement.color || "#000000"}
                            onChange={(e) => handleElementUpdate("color", e.target.value)}
                            className="w-12 h-8 p-1 border rounded"
                          />
                          <Input
                            value={selectedElement.color || "#000000"}
                            onChange={(e) => handleElementUpdate("color", e.target.value)}
                            placeholder="#000000"
                            className="flex-1 h-8"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={selectedElement.backgroundColor?.replace(/rgba?$$[^)]+$$/, "") || "#ffffff"}
                            onChange={(e) => handleElementUpdate("backgroundColor", `${e.target.value}cc`)}
                            className="w-12 h-8 p-1 border rounded"
                          />
                          <Input
                            value={selectedElement.backgroundColor || "rgba(255, 255, 255, 0.9)"}
                            onChange={(e) => handleElementUpdate("backgroundColor", e.target.value)}
                            placeholder="rgba(255, 255, 255, 0.9)"
                            className="flex-1 h-8"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Background Opacity</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            min={0}
                            max={1}
                            step={0.1}
                            value={(() => {
                              const bg = selectedElement.backgroundColor || "rgba(255, 255, 255, 0.9)"
                              const match = bg.match(/rgba?\([^,]+,[^,]+,[^,]+,?\s*([^)]*)\)/)
                              return [Number(match ? match[1] || "0.9" : "0.9")]
                            })()}
                            onValueChange={([val]) => {
                              const bg = selectedElement.backgroundColor || "rgba(255, 255, 255, 0.9)"
                              const colorMatch = bg.match(/rgba?\(([^,]+),\s*([^,]+),\s*([^,]+)/)
                              if (colorMatch) {
                                const newBg = `rgba(${colorMatch[1]}, ${colorMatch[2]}, ${colorMatch[3]}, ${val})`
                                handleElementUpdate("backgroundColor", newBg)
                              }
                            }}
                            className="w-32"
                          />
                          <span className="text-xs w-8 text-right">{(() => {
                            const bg = selectedElement.backgroundColor || "rgba(255, 255, 255, 0.9)"
                            const match = bg.match(/rgba?\([^,]+,[^,]+,[^,]+,?\s*([^)]*)\)/)
                            return match ? match[1] || "0.9" : "0.9"
                          })()}</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Element Animation */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Element Animation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Animation Type</Label>
                    <Select
                      value={selectedElement.animation || "none"}
                      onValueChange={(value) => handleElementUpdate("animation", value === "none" ? undefined : value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="fadeIn">Fade In</SelectItem>
                        <SelectItem value="slideInLeft">Slide In Left</SelectItem>
                        <SelectItem value="slideInRight">Slide In Right</SelectItem>
                        <SelectItem value="slideInUp">Slide In Up</SelectItem>
                        <SelectItem value="slideInDown">Slide In Down</SelectItem>
                        <SelectItem value="zoomIn">Zoom In</SelectItem>
                        <SelectItem value="zoomOut">Zoom Out</SelectItem>
                        <SelectItem value="rotateIn">Rotate In</SelectItem>
                        <SelectItem value="bounce">Bounce</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedElement.animation && selectedElement.animation !== "none" && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Delay (ms)</Label>
                          <Input
                            type="number"
                            value={selectedElement.animationDelay || 0}
                            onChange={(e) =>
                              handleElementUpdate("animationDelay", Number.parseInt(e.target.value) || 0)
                            }
                            className="h-8"
                            min="0"
                            max="5000"
                            step="100"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Duration (ms)</Label>
                          <Input
                            type="number"
                            value={selectedElement.animationDuration || 1000}
                            onChange={(e) =>
                              handleElementUpdate("animationDuration", Number.parseInt(e.target.value) || 1000)
                            }
                            className="h-8"
                            min="100"
                            max="5000"
                            step="100"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Size Constraints */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Size Constraints</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Min Width</Label>
                      <Input
                        type="number"
                        value={selectedElement.minWidth || 50}
                        onChange={(e) => handleElementUpdate("minWidth", Number.parseInt(e.target.value) || 50)}
                        className="h-8"
                        min="10"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Min Height</Label>
                      <Input
                        type="number"
                        value={selectedElement.minHeight || 30}
                        onChange={(e) => handleElementUpdate("minHeight", Number.parseInt(e.target.value) || 30)}
                        className="h-8"
                        min="10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Max Width</Label>
                      <Input
                        type="number"
                        value={selectedElement.maxWidth || 800}
                        onChange={(e) => handleElementUpdate("maxWidth", Number.parseInt(e.target.value) || 800)}
                        className="h-8"
                        min="50"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Max Height</Label>
                      <Input
                        type="number"
                        value={selectedElement.maxHeight || 600}
                        onChange={(e) => handleElementUpdate("maxHeight", Number.parseInt(e.target.value) || 600)}
                        className="h-8"
                        min="30"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fragment Animation */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Fragment Animation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Animation Type</Label>
                    <Select
                      value={selectedElement.fragmentType || "none"}
                      onValueChange={(value) =>
                        handleElementUpdate("fragmentType", value === "none" ? undefined : value)
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {fragmentTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedElement.fragmentType && (
                    <div className="space-y-2">
                      <Label className="text-xs">Fragment Order</Label>
                      <Input
                        type="number"
                        value={selectedElement.fragmentIndex || 0}
                        onChange={(e) => handleElementUpdate("fragmentIndex", Number.parseInt(e.target.value) || 0)}
                        className="h-8"
                        min="0"
                        max="10"
                      />
                      <p className="text-xs text-gray-500">Lower numbers appear first</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "element" && !selectedElement && (
            <div className="text-center py-8 text-gray-500">
              <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Select an element to edit its properties</p>
            </div>
          )}
        </div>
      )}

      {isPanelCollapsed && (
        <div className="flex flex-col items-center gap-2 p-2">
          <Button
            variant={activeTab === "slide" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setActiveTab("slide")
              setIsPanelCollapsed(false)
            }}
            className="w-8 h-8 p-0"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant={activeTab === "element" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setActiveTab("element")
              setIsPanelCollapsed(false)
            }}
            className="w-8 h-8 p-0"
            disabled={!selectedElement}
          >
            <Layers className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
