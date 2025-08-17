"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit3, ImageIcon, Volume2 } from "lucide-react"
import type { Slide, SlideElement, SlideTheme } from "@/types/slide-types"

interface SlideCanvasProps {
  slide: Slide
  theme: SlideTheme
  isPreviewMode: boolean
  onUpdateSlide: (updates: Partial<Slide>) => void
  onUpdateElement: (elementId: string, updates: Partial<SlideElement>) => void
  onDeleteElement: (elementId: string) => void
}

export function SlideCanvas({
  slide,
  theme,
  isPreviewMode,
  onUpdateSlide,
  onUpdateElement,
  onDeleteElement,
}: SlideCanvasProps) {
  const [editingElement, setEditingElement] = useState<string | null>(null)
  const audioInputRef = React.useRef<HTMLInputElement>(null)

  const handleImageUpload = (elementId?: string) => {
    if (elementId) {
      onUpdateElement(elementId, {
        content: "/placeholder.svg?height=200&width=300",
      })
    }
  }

  const handleAudioUpload = () => {
    audioInputRef.current?.click()
  }

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        onUpdateSlide({ audio: result })
      }
      reader.readAsDataURL(file)
      e.target.value = ""
    }
  }

  const renderElement = (element: SlideElement) => {
    const isEditing = editingElement === element.id && !isPreviewMode

    switch (element.type) {
      case "text":
        return (
          <div key={element.id} className="group relative">
            {isEditing ? (
              <Textarea
                value={element.content}
                onChange={(e) => onUpdateElement(element.id, { content: e.target.value })}
                onBlur={() => setEditingElement(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    setEditingElement(null)
                  }
                }}
                className="w-full text-lg resize-none"
                autoFocus
              />
            ) : (
              <div
                className={`p-4 rounded-lg cursor-pointer transition-colors ${isPreviewMode ? "" : "hover:bg-gray-50"}`}
                onClick={() => !isPreviewMode && setEditingElement(element.id)}
              >
                <p className="text-lg leading-relaxed whitespace-pre-wrap">{element.content}</p>
              </div>
            )}
            {!isPreviewMode && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditingElement(element.id)}>
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteElement(element.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )

      case "image":
        return (
          <div key={element.id} className="group relative">
            <div className="relative">
              <img
                src={element.content || "/placeholder.svg"}
                alt="Slide content"
                className="max-w-full h-auto rounded-lg shadow-sm"
              />
              {!isPreviewMode && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleImageUpload(element.id)}
                    className="bg-white/90 hover:bg-white"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteElement(element.id)}
                    className="bg-white/90 hover:bg-white text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )

      case "quiz":
        return (
          <Card key={element.id} className="p-4 border-dashed border-2 border-blue-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Quiz</Badge>
                <span className="text-sm text-gray-600">Interactive quiz placeholder</span>
              </div>
              {!isPreviewMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteElement(element.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            {isEditing ? (
              <Textarea
                value={element.content}
                onChange={(e) => onUpdateElement(element.id, { content: e.target.value })}
                onBlur={() => setEditingElement(null)}
                placeholder="Quiz configuration (JSON)"
                className="mt-2"
              />
            ) : (
              <p
                className="mt-2 text-sm font-mono cursor-pointer"
                onClick={() => !isPreviewMode && setEditingElement(element.id)}
              >
                {element.content}
              </p>
            )}
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className={`p-8 min-h-[500px] ${theme.background} ${theme.text} shadow-lg`}>
        {!isPreviewMode ? (
          <div className="space-y-4">
            <Input
              value={slide.title}
              onChange={(e) => onUpdateSlide({ title: e.target.value })}
              placeholder="Slide Title"
              className="text-3xl font-bold border-none bg-transparent p-0 focus:ring-0"
            />
            <Input
              value={slide.summary}
              onChange={(e) => onUpdateSlide({ summary: e.target.value })}
              placeholder="Slide Summary"
              className="text-xl text-gray-600 border-none bg-transparent p-0 focus:ring-0"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">{slide.title}</h1>
            {slide.summary && <p className="text-xl text-gray-600">{slide.summary}</p>}
          </div>
        )}

        <div className="mt-8 space-y-6">
          {slide.elements.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No content yet. Add some elements to get started.</p>
            </div>
          ) : (
            slide.elements.map(renderElement)
          )}
        </div>

        {/* Audio Section */}
        {(slide.audio || !isPreviewMode) && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Audio
              </h3>
              {!isPreviewMode && (
                <Button variant="outline" size="sm" onClick={handleAudioUpload}>
                  {slide.audio ? "Replace" : "Add"} Audio
                </Button>
              )}
            </div>
            {slide.audio && (
              <audio controls className="w-full">
                <source src={slide.audio} />
              </audio>
            )}
          </div>
        )}

        {/* Transcript Section */}
        {(slide.transcript || !isPreviewMode) && (
          <div className="mt-6">
            <h3 className="font-medium mb-2">Transcript</h3>
            {isPreviewMode ? (
              slide.transcript && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="whitespace-pre-wrap">{slide.transcript}</p>
                </div>
              )
            ) : (
              <Textarea
                value={slide.transcript || ""}
                onChange={(e) => onUpdateSlide({ transcript: e.target.value })}
                placeholder="Add transcript for this slide..."
                className="min-h-[100px]"
              />
            )}
          </div>
        )}
      </Card>

      {/* Hidden file inputs */}
      <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioChange} className="hidden" />
    </div>
  )
}
