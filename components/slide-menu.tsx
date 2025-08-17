"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Download, Upload, GripVertical, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react"
import type { Slide } from "@/types/slide-types"

interface SlideMenuProps {
  slides: Slide[]
  currentIdx: number
  onSlideSelect: (idx: number) => void
  onAddSlide: () => void
  onDeleteSlide: (idx: number) => void
  onReorderSlides: (fromIdx: number, toIdx: number) => void
  onExport: () => void
  onImport: (file: File) => void
}

export function SlideMenu({
  slides,
  currentIdx,
  onSlideSelect,
  onAddSlide,
  onDeleteSlide,
  onReorderSlides,
  onExport,
  onImport,
}: SlideMenuProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const filteredSlides = slides.filter(
    (slide) =>
      slide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slide.summary.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault()
    if (draggedIdx !== null && draggedIdx !== dropIdx) {
      onReorderSlides(draggedIdx, dropIdx)
    }
    setDraggedIdx(null)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImport(file)
      e.target.value = ""
    }
  }

  return (
    <div
      className={`${isCollapsed ? "w-16" : "w-80"} bg-white border-r overflow-auto border-gray-200 flex flex-col transition-all duration-300`}
    >
      <div className="p-2 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-lg font-semibold text-gray-900 ${isCollapsed ? "hidden" : ""}`}>Slides</h2>
          <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="p-1">
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {!isCollapsed && (
          <>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search slides..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button onClick={onAddSlide} className="w-full mb-2">
              <Plus className="w-4 h-4 mr-2" />
              Add Slide
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onExport} className="flex-1 bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={handleImportClick} className="flex-1 bg-transparent">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </div>
          </>
        )}

        {isCollapsed && (
          <div className="flex flex-col gap-2">
            <Button onClick={onAddSlide} size="sm" className="w-full p-2">
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={onExport} size="sm" className="w-full p-2 bg-transparent">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <ScrollArea className="flex overflow-auto">
        <div className="p-2">
          {filteredSlides.map((slide, idx) => {
            const originalIdx = slides.findIndex((s) => s.id === slide.id)
            const isActive = originalIdx === currentIdx

            return (
              <div
                key={slide.id}
                draggable={!isCollapsed}
                onDragStart={(e) => !isCollapsed && handleDragStart(e, originalIdx)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, originalIdx)}
                className={`group relative ${isCollapsed ? "p-2 mb-1" : "p-3 mb-2"} rounded-lg border cursor-pointer transition-all ${
                  isActive ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => onSlideSelect(originalIdx)}
              >
                {isCollapsed ? (
                  <div className="text-center">
                    <span className={`text-xs font-medium ${isActive ? "text-blue-900" : "text-gray-900"}`}>
                      {originalIdx + 1}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 max-w-[17rem]">
                    <GripVertical className="w-2 h-2 text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium truncate ${isActive ? "text-blue-900" : "text-gray-900"}`}>
                          {slide.title || "Untitled"}
                        </h3>
                        <span className="text-xs text-gray-500 ml-2">{originalIdx + 1}</span>
                      </div>
                      {slide.summary && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{slide.summary}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">{slide.elements.length} elements</span>
                        {slide.audio && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Audio</span>
                        )}
                        {slide.transcript && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Script</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteSlide(originalIdx)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
