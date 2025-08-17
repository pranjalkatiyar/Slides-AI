"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useGrid } from "@/contexts/grid-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Type,
  ImageIcon,
  HelpCircle,
  Eye,
  EyeOff,
  Palette,
  Download,
  Grid,
  Layers,
  Code,
  List,
  ChevronDown,
  ChevronUp,
  Presentation,
  Sparkles,
  Settings,
  Grip,
} from "lucide-react"
import type { Slide, SlideTheme } from "@/types/slide-types"

const ELEMENT_BUTTONS = [
  {
    type: "text" as const,
    icon: Type,
    label: "Text",
    colors: "bg-blue-50 hover:bg-blue-100 border-blue-200"
  },
  {
    type: "image" as const,
    icon: ImageIcon,
    label: "Image",
    colors: "bg-green-50 hover:bg-green-100 border-green-200"
  },
  {
    type: "quiz" as const,
    icon: HelpCircle,
    label: "Quiz",
    colors: "bg-purple-50 hover:bg-purple-100 border-purple-200"
  },
  {
    type: "code" as const,
    icon: Code,
    label: "Code",
    colors: "bg-orange-50 hover:bg-orange-100 border-orange-200"
  },
  {
    type: "list" as const,
    icon: List,
    label: "List",
    colors: "bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
  }
] as const

const themes: SlideTheme[] = [
  {
    id: "default",
    name: "Default",
    background: "bg-white",
    text: "text-gray-900",
    accent: "bg-blue-600",
    border: "border-gray-200",
  },
  {
    id: "dark",
    name: "Dark",
    background: "bg-gray-900",
    text: "text-white",
    accent: "bg-blue-500",
    border: "border-gray-700",
  },
  {
    id: "minimal",
    name: "Minimal",
    background: "bg-gray-50",
    text: "text-gray-800",
    accent: "bg-gray-800",
    border: "border-gray-300",
  },
  {
    id: "vibrant",
    name: "Vibrant",
    background: "bg-gradient-to-br from-purple-50 to-pink-50",
    text: "text-gray-900",
    accent: "bg-purple-600",
    border: "border-purple-200",
  },
]

interface ToolbarProps {
  theme: SlideTheme
  onThemeChange: (theme: SlideTheme) => void
  isPreviewMode: boolean
  onPreviewModeChange: (preview: boolean) => void
  onAddElement: (type: "text" | "image" | "quiz" | "code" | "list") => void
  currentSlide: Slide
  onUpdateSlide: (updates: Partial<Slide>) => void
  onExport: () => void
  onPresentationPreview: () => void
  onToggleAI?: () => void
  showAIPanel?: boolean
}

export function Toolbar({
  theme,
  onThemeChange,
  isPreviewMode,
  onPreviewModeChange,
  onAddElement,
  currentSlide,
  onUpdateSlide,
  onExport,
  onPresentationPreview,
  onToggleAI,
  showAIPanel = false,
}: ToolbarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { showGridLines, setShowGridLines, snapToGrid, setSnapToGrid } = useGrid()

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Collapse Toggle */}
            <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="p-1">
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>

            {!isCollapsed && (
              <>
                {/* Theme Selector */}
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-gray-600" />
                  <Select
                    value={theme.id}
                    onValueChange={(value) => {
                      const selectedTheme = themes.find((t) => t.id === value)
                      if (selectedTheme) onThemeChange(selectedTheme)
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {themes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* Add Elements */}
                {!isPreviewMode && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Layers className="w-4 h-4" />
                      Add:
                    </span>
                    {ELEMENT_BUTTONS.map(({ type, icon: Icon, label, colors }) => (
                      <Button
                        key={type}
                        variant="outline"
                        size="sm"
                        onClick={() => onAddElement(type)}
                        className={colors}
                      >
                        <Icon className="w-4 h-4  " />
                        {/* {label} */}
                      </Button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {!isCollapsed && (
              <>
                {/* Slide Info */}
                <div className="flex items-center gap-2 text-lg">
                  {currentSlide.audio && <Badge variant="secondary">Audio</Badge>}
                  {currentSlide.transcript && <Badge variant="secondary">Transcript</Badge>}
                  <Badge variant="outline" className="flex items-center gap-1 text-lg">
                    <Grid className="w-5 h-5" />
                    {currentSlide.elements.length}
                  </Badge>
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* Canvas Controls */}
                    <div className="flex items-center gap-2 border rounded-lg p-1">
                      <Button
                        variant={showGridLines ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowGridLines(!showGridLines)}
                        title="Toggle Grid Lines"
                        className={showGridLines ? "bg-blue-500 text-white hover:bg-blue-600" : ""}
                      >
                        <Grid className="w-4 h-4 mr-2" />
                        Grid
                      </Button>
                      <Button
                        variant={snapToGrid ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSnapToGrid(!snapToGrid)}
                        title="Snap to Grid"
                        className={snapToGrid ? "bg-green-500 text-white hover:bg-green-600" : ""}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Snap
                      </Button>
                    </div>

                {/* AI Assistant Toggle */}
                {onToggleAI && (
                  <Button
                    variant={showAIPanel ? "default" : "outline"}
                    onClick={onToggleAI}
                    className={
                      showAIPanel
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-purple-50 hover:bg-purple-100 border-purple-200"
                    }
                  >
                    <Sparkles className="w-4 h-4 " />
                    {/* AI Assistant */}
                  </Button>
                )}

                {/* Export Button */}
                <Button
                  variant="outline"
                  onClick={onExport}
                  className="bg-green-50 hover:bg-green-100 border-green-200"
                >
                  <Download className="w-4 h-4 " />
                  {/* Export */}
                </Button>

                {/* Presentation Preview Button */}
                <Button
                  variant="outline"
                  onClick={onPresentationPreview}
                  className="bg-purple-50 hover:bg-purple-100 border-purple-200"
                >
                  <Presentation className="w-4 h-4" />
                  {/* Present */}
                </Button>
              </>
            )}

            {/* Preview Toggle */}
            <Button variant={isPreviewMode ? "default" : "outline"} onClick={() => onPreviewModeChange(!isPreviewMode)}>
              {isPreviewMode ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Edit Mode
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 " />
                  {/* Preview */}
                </>
              )}
            </Button>

            {/* Panel Toggle */}
            {!isPreviewMode && onToggleAI && (
              <Button variant="ghost" size="sm" onClick={onToggleAI} title="Toggle Right Panel">
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
