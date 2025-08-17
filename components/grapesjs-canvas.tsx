"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Trash2,
  Move,
  RotateCcw,
  Copy,
  Volume2,
  Play,
  Settings,
  Grip,
  Link,
  Eye,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import type { Slide, SlideElement, SlideTheme } from "@/types/slide-types"
import { InteractiveQuiz } from "./interactive-quiz"
import { useGrid } from "@/contexts/grid-context"

interface GrapesJSCanvasProps {
  slide: Slide
  theme: SlideTheme
  isPreviewMode: boolean
  selectedElementId: string | null
  onSelectElement: (id: string | null) => void
  onUpdateSlide: (updates: Partial<Slide>) => void
  onUpdateElement: (elementId: string, updates: Partial<SlideElement>) => void
  onDeleteElement: (elementId: string) => void
  isPlaying?: boolean
  onAnimationComplete?: () => void
}

interface DragState {
  isDragging: boolean
  draggedElement: string | null
  startPos: { x: number; y: number }
  elementStartPos: { x: number; y: number }
}

interface ResizeState {
  isResizing: boolean
  resizeElement: string | null
  resizeHandle: string | null
  startPos: { x: number; y: number }
  elementStartSize: { width: number; height: number }
}

export function GrapesJSCanvas({
  slide,
  theme,
  isPreviewMode,
  selectedElementId,
  onSelectElement,
  onUpdateSlide,
  onUpdateElement,
  onDeleteElement,
  isPlaying = false,
  onAnimationComplete,
}: GrapesJSCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedElement: null,
    startPos: { x: 0, y: 0 },
    elementStartPos: { x: 0, y: 0 },
  })
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    resizeElement: null,
    resizeHandle: null,
    startPos: { x: 0, y: 0 },
    elementStartSize: { width: 0, height: 0 },
  })
  const [editingElement, setEditingElement] = useState<string | null>(null)
  const [animatingElements, setAnimatingElements] = useState<Set<string>>(new Set())
  const [playingAnimations, setPlayingAnimations] = useState<Set<string>>(new Set())
  const { showGridLines, snapToGrid, gridSize } = useGrid()
  const audioInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [audioUrl, setAudioUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false)
  const [showImageInput, setShowImageInput] = useState(false)
  const [showAudioInput, setShowAudioInput] = useState(false)

  // Auto-play animations when slide is playing
  useEffect(() => {
    if (isPlaying && isPreviewMode) {
      // Sort elements by animation delay and fragment index
      const elementsWithAnimations = slide.elements
        .filter((el) => el.animation && el.animation !== "none")
        .sort((a, b) => {
          const delayA = (a.animationDelay || 0) + (a.fragmentIndex || 0) * 1000
          const delayB = (b.animationDelay || 0) + (b.fragmentIndex || 0) * 1000
          return delayA - delayB
        })

      // Trigger animations in sequence
      elementsWithAnimations.forEach((element, index) => {
        const totalDelay = (element.animationDelay || 0) + (element.fragmentIndex || 0) * 1000

        setTimeout(() => {
          setPlayingAnimations((prev) => new Set(prev).add(element.id))

          // Remove animation after duration
          setTimeout(() => {
            setPlayingAnimations((prev) => {
              const newSet = new Set(prev)
              newSet.delete(element.id)
              return newSet
            })

            // Call completion callback for last animation
            if (index === elementsWithAnimations.length - 1) {
              onAnimationComplete?.()
            }
          }, element.animationDuration || 1000)
        }, totalDelay)
      })
    } else {
      setPlayingAnimations(new Set())
    }
  }, [isPlaying, isPreviewMode, slide.elements, onAnimationComplete])

  // Snap to grid function
  const snapToGridFn = useCallback(
    (value: number) => {
      if (!snapToGrid) return value
      return Math.round(value / gridSize) * gridSize
    },
    [snapToGrid, gridSize],
  )

  // Handle mouse down for dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      if (isPreviewMode) return

      e.preventDefault()
      e.stopPropagation()

      const element = slide.elements.find((el) => el.id === elementId)
      if (!element) return

      onSelectElement(elementId)

      const rect = e.currentTarget.getBoundingClientRect()
      const canvasRect = canvasRef.current?.getBoundingClientRect()
      if (!canvasRect) return

      setDragState({
        isDragging: true,
        draggedElement: elementId,
        startPos: { x: e.clientX, y: e.clientY },
        elementStartPos: { x: element.x || 0, y: element.y || 0 },
      })
    },
    [slide.elements, onSelectElement, isPreviewMode],
  )

  // Handle resize mouse down
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string, handle: string) => {
      if (isPreviewMode) return

      e.preventDefault()
      e.stopPropagation()

      const element = slide.elements.find((el) => el.id === elementId)
      if (!element) return

      setResizeState({
        isResizing: true,
        resizeElement: elementId,
        resizeHandle: handle,
        startPos: { x: e.clientX, y: e.clientY },
        elementStartSize: {
          width: typeof element.width === "number" ? element.width : 200,
          height: typeof element.height === "number" ? element.height : 100,
        },
      })
    },
    [slide.elements, isPreviewMode],
  )

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragState.isDragging && dragState.draggedElement && canvasRef.current) {
        const deltaX = e.clientX - dragState.startPos.x
        const deltaY = e.clientY - dragState.startPos.y

        let newX = dragState.elementStartPos.x + deltaX
        let newY = dragState.elementStartPos.y + deltaY

        // Apply snapping BEFORE clamping
        if (snapToGrid) {
          newX = Math.round(newX / gridSize) * gridSize
          newY = Math.round(newY / gridSize) * gridSize
        }

        const canvasRect = canvasRef.current.getBoundingClientRect()
        const clampedX = Math.max(0, Math.min(newX, canvasRect.width - 100))
        const clampedY = Math.max(0, Math.min(newY, canvasRect.height - 50))

        onUpdateElement(dragState.draggedElement, {
          x: clampedX,
          y: clampedY,
        })
      }

      if (resizeState.isResizing && resizeState.resizeElement) {
        const deltaX = e.clientX - resizeState.startPos.x
        const deltaY = e.clientY - resizeState.startPos.y

        const element = slide.elements.find((el) => el.id === resizeState.resizeElement)
        if (!element) return

        let newWidth = resizeState.elementStartSize.width
        let newHeight = resizeState.elementStartSize.height

        switch (resizeState.resizeHandle) {
          case "se":
            newWidth = resizeState.elementStartSize.width + deltaX
            newHeight = resizeState.elementStartSize.height + deltaY
            break
          case "sw":
            newWidth = resizeState.elementStartSize.width - deltaX
            newHeight = resizeState.elementStartSize.height + deltaY
            break
          case "ne":
            newWidth = resizeState.elementStartSize.width + deltaX
            newHeight = resizeState.elementStartSize.height - deltaY
            break
          case "nw":
            newWidth = resizeState.elementStartSize.width - deltaX
            newHeight = resizeState.elementStartSize.height - deltaY
            break
          case "n":
            newHeight = resizeState.elementStartSize.height - deltaY
            break
          case "s":
            newHeight = resizeState.elementStartSize.height + deltaY
            break
          case "e":
            newWidth = resizeState.elementStartSize.width + deltaX
            break
          case "w":
            newWidth = resizeState.elementStartSize.width - deltaX
            break
        }

        // Apply snapping to resize
        if (snapToGrid) {
          newWidth = Math.round(newWidth / gridSize) * gridSize
          newHeight = Math.round(newHeight / gridSize) * gridSize
        }

        // Apply constraints
        newWidth = Math.max(element.minWidth || 50, Math.min(newWidth, element.maxWidth || 800))
        newHeight = Math.max(element.minHeight || 30, Math.min(newHeight, element.maxHeight || 600))

        onUpdateElement(resizeState.resizeElement, {
          width: newWidth,
          height: newHeight,
        })
      }
    },
    [dragState, resizeState, onUpdateElement, slide.elements, snapToGrid, gridSize],
  )

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedElement: null,
      startPos: { x: 0, y: 0 },
      elementStartPos: { x: 0, y: 0 },
    })
    setResizeState({
      isResizing: false,
      resizeElement: null,
      resizeHandle: null,
      startPos: { x: 0, y: 0 },
      elementStartSize: { width: 0, height: 0 },
    })
  }, [])

  // Add event listeners
  useEffect(() => {
    if (dragState.isDragging || resizeState.isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [dragState.isDragging, resizeState.isResizing, handleMouseMove, handleMouseUp])

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectElement(null)
      setEditingElement(null)
    }
  }

  const handleElementDoubleClick = (elementId: string) => {
    if (!isPreviewMode) {
      setEditingElement(elementId)
    }
  }

  const handleImageUpload = (elementId?: string) => {
    if (elementId) {
      imageInputRef.current?.click()
      imageInputRef.current?.setAttribute("data-element-id", elementId)
    } else {
      imageInputRef.current?.click()
      imageInputRef.current?.removeAttribute("data-element-id")
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const elementId = e.target.getAttribute("data-element-id")

    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        if (elementId) {
          onUpdateElement(elementId, { content: result })
        } else {
          // Add new image element
          const newElement: SlideElement = {
            id: `el-${Date.now()}`,
            type: "image",
            content: result,
            x: 50,
            y: 100,
            width: 300,
            height: 200,
            minWidth: 100,
            minHeight: 50,
            maxWidth: 800,
            maxHeight: 600,
          }
          onUpdateSlide({
            elements: [...slide.elements, newElement],
          })
        }
      }
      reader.readAsDataURL(file)
      e.target.value = ""
    }
  }

  const handleImageUrlSubmit = (elementId?: string) => {
    if (imageUrl.trim()) {
      if (elementId) {
        onUpdateElement(elementId, { content: imageUrl.trim() })
      } else {
        // Add new image element
        const newElement: SlideElement = {
          id: `el-${Date.now()}`,
          type: "image",
          content: imageUrl.trim(),
          x: 50,
          y: 100,
          width: 300,
          height: 200,
          minWidth: 100,
          minHeight: 50,
          maxWidth: 800,
          maxHeight: 600,
        }
        onUpdateSlide({
          elements: [...slide.elements, newElement],
        })
      }
      setImageUrl("")
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

  const handleAudioUrlSubmit = () => {
    if (audioUrl.trim()) {
      onUpdateSlide({ audio: audioUrl.trim() })
      setAudioUrl("")
    }
  }

  const duplicateElement = (elementId: string) => {
    const element = slide.elements.find((el) => el.id === elementId)
    if (element) {
      const newElement = {
        ...element,
        id: `el-${Date.now()}`,
        x: (element.x || 0) + 20,
        y: (element.y || 0) + 20,
      }
      onUpdateSlide({
        elements: [...slide.elements, newElement],
      })
    }
  }

  const resetElementPosition = (elementId: string) => {
    onUpdateElement(elementId, { x: 0, y: 0 })
  }

  const previewAnimation = (elementId: string) => {
    setAnimatingElements((prev) => new Set(prev).add(elementId))
    setTimeout(() => {
      setAnimatingElements((prev) => {
        const newSet = new Set(prev)
        newSet.delete(elementId)
        return newSet
      })
    }, 2000)
  }

  const getAnimationClass = (element: SlideElement) => {
    if (!element.animation || element.animation === "none") return ""
    if (animatingElements.has(element.id) || playingAnimations.has(element.id)) {
      return `animate-${element.animation}`
    }
    return ""
  }

  const getAnimationStyle = (element: SlideElement) => {
    if (!element.animation || element.animation === "none") return {}
    if (!animatingElements.has(element.id) && !playingAnimations.has(element.id)) return {}

    return {
      animationDelay: `${element.animationDelay || 0}ms`,
      animationDuration: `${element.animationDuration || 1000}ms`,
    }
  }

  const renderResizeHandles = (elementId: string) => {
    if (selectedElementId !== elementId || isPreviewMode) return null

    const handles = [
      { position: "nw", cursor: "nw-resize", style: { top: -4, left: -4 } },
      { position: "n", cursor: "n-resize", style: { top: -4, left: "50%", transform: "translateX(-50%)" } },
      { position: "ne", cursor: "ne-resize", style: { top: -4, right: -4 } },
      { position: "e", cursor: "e-resize", style: { top: "50%", right: -4, transform: "translateY(-50%)" } },
      { position: "se", cursor: "se-resize", style: { bottom: -4, right: -4 } },
      { position: "s", cursor: "s-resize", style: { bottom: -4, left: "50%", transform: "translateX(-50%)" } },
      { position: "sw", cursor: "sw-resize", style: { bottom: -4, left: -4 } },
      { position: "w", cursor: "w-resize", style: { top: "50%", left: -4, transform: "translateY(-50%)" } },
    ]

    return (
      <>
        {handles.map((handle) => (
          <div
            key={handle.position}
            className="absolute w-2 h-2 bg-blue-500 border border-white rounded-sm z-30"
            style={{ ...handle.style, cursor: handle.cursor }}
            onMouseDown={(e) => handleResizeMouseDown(e, elementId, handle.position)}
          />
        ))}
      </>
    )
  }

  const renderElement = (element: SlideElement) => {
    const isSelected = selectedElementId === element.id
    const isEditing = editingElement === element.id
    const animationClass = getAnimationClass(element)
    const animationStyle = getAnimationStyle(element)

    const elementStyle = {
      position: "absolute" as const,
      left: element.x || 0,
      top: element.y || 0,
      width: element.width || "auto",
      height: element.height || "auto",
      zIndex: isSelected ? 20 : 1,
      ...animationStyle,
    }

    const commonProps = {
      style: elementStyle,
      onMouseDown: (e: React.MouseEvent) => handleMouseDown(e, element.id),
      onDoubleClick: () => handleElementDoubleClick(element.id),
      className: `group transition-all ${animationClass} ${
        isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""
      } ${isPreviewMode ? "cursor-default" : "cursor-move"}`,
    }

    switch (element.type) {
      case "text":
        return (
          <div key={element.id} {...commonProps}>
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
                className="min-w-[200px] resize-none border-2 border-blue-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div
                className={`p-4 rounded-lg shadow-sm border min-w-[100px] ${
                  isPreviewMode ? "" : "hover:shadow-md"
                } ${isSelected ? "border-blue-500" : "border-gray-200"}`}
                style={{
                  fontSize: element.fontSize || 16,
                  color: element.color || "#000",
                  backgroundColor: element.backgroundColor || "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <p className="whitespace-pre-wrap">{element.content}</p>
              </div>
            )}

            {isSelected && !isPreviewMode && (
              <>
                <div className="absolute -top-12 left-0 flex gap-1 bg-white rounded-md shadow-lg border p-1 z-40">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingElement(element.id)
                    }}
                    className="h-6 w-6 p-0"
                    title="Edit Text"
                  >
                    ✏️
                  </Button>
                  {element.animation && element.animation !== "none" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        previewAnimation(element.id)
                      }}
                      className="h-6 w-6 p-0"
                      title="Preview Animation"
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      duplicateElement(element.id)
                    }}
                    className="h-6 w-6 p-0"
                    title="Duplicate"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      resetElementPosition(element.id)
                    }}
                    className="h-6 w-6 p-0"
                    title="Reset Position"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteElement(element.id)
                    }}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                {renderResizeHandles(element.id)}
              </>
            )}
          </div>
        )

      case "image":
        return (
          <div key={element.id} {...commonProps}>
            <div
              className={`relative bg-white rounded-lg shadow-sm border overflow-hidden ${
                isSelected ? "border-blue-500 ring-2 ring-blue-500 ring-offset-2" : "border-gray-200"
              }`}
            >
              <img
                src={element.content || "/placeholder.svg?height=200&width=300"}
                alt="Slide content"
                className="block w-full h-full object-cover"
                style={{
                  width: element.width || 300,
                  height: element.height || 200,
                }}
                draggable={false}
              />

              {/* Always visible delete button for images when selected */}
              {isSelected && !isPreviewMode && (
                <>
                  {/* Prominent delete button overlay */}
                  <div className="absolute top-2 right-2 z-50">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteElement(element.id)
                      }}
                      className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white shadow-lg"
                      title="Delete Image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Toolbar */}
                  <div className="absolute -top-12 left-0 flex gap-1 bg-white rounded-md shadow-lg border p-1 z-40">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleImageUpload(element.id)
                      }}
                      className="h-6 w-6 p-0"
                      title="Upload Image"
                    >
                      📁
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        const url = prompt("Enter image URL:")
                        if (url) {
                          onUpdateElement(element.id, { content: url })
                        }
                      }}
                      className="h-6 w-6 p-0"
                      title="Set Image URL"
                    >
                      <Link className="w-3 h-3" />
                    </Button>
                    {element.animation && element.animation !== "none" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          previewAnimation(element.id)
                        }}
                        className="h-6 w-6 p-0"
                        title="Preview Animation"
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        duplicateElement(element.id)
                      }}
                      className="h-6 w-6 p-0"
                      title="Duplicate"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        resetElementPosition(element.id)
                      }}
                      className="h-6 w-6 p-0"
                      title="Reset Position"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  </div>
                  {renderResizeHandles(element.id)}
                </>
              )}
            </div>
          </div>
        )

      case "quiz":
        return (
          <div key={element.id} {...commonProps}>
            {isEditing ? (
              <div className="min-w-[300px]">
                <Textarea
                  value={element.content}
                  onChange={(e) => onUpdateElement(element.id, { content: e.target.value })}
                  onBlur={() => setEditingElement(null)}
                  placeholder='{"question": "Your question?", "options": ["A", "B", "C", "D"], "correct": 0}'
                  className="min-h-[120px] font-mono text-sm border-2 border-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ) : (
              <div className={isSelected ? "ring-2 ring-blue-500 ring-offset-1 rounded-lg" : ""}>
                <InteractiveQuiz content={element.content} isPreviewMode={isPreviewMode} />
              </div>
            )}

            {isSelected && !isPreviewMode && (
              <>
                <div className="absolute -top-12 left-0 flex gap-1 bg-white rounded-md shadow-lg border p-1 z-40">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingElement(element.id)
                    }}
                    className="h-6 w-6 p-0"
                    title="Edit Quiz"
                  >
                    ✏️
                  </Button>
                  {element.animation && element.animation !== "none" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        previewAnimation(element.id)
                      }}
                      className="h-6 w-6 p-0"
                      title="Preview Animation"
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      duplicateElement(element.id)
                    }}
                    className="h-6 w-6 p-0"
                    title="Duplicate"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      resetElementPosition(element.id)
                    }}
                    className="h-6 w-6 p-0"
                    title="Reset Position"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteElement(element.id)
                    }}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                {renderResizeHandles(element.id)}
              </>
            )}
          </div>
        )

      case "code":
        return (
          <div key={element.id} {...commonProps}>
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
                className="min-w-[300px] font-mono text-sm resize-none border-2 border-blue-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div
                className={`bg-gray-900 text-green-400 p-4 rounded-lg shadow-sm border font-mono text-sm min-w-[200px] overflow-x-auto ${
                  isSelected ? "border-blue-500" : "border-gray-700"
                }`}
              >
                <pre className="whitespace-pre-wrap">{element.content}</pre>
              </div>
            )}

            {isSelected && !isPreviewMode && (
              <>
                <div className="absolute -top-12 left-0 flex gap-1 bg-white rounded-md shadow-lg border p-1 z-40">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingElement(element.id)
                    }}
                    className="h-6 w-6 p-0"
                    title="Edit Code"
                  >
                    ✏️
                  </Button>
                  {element.animation && element.animation !== "none" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        previewAnimation(element.id)
                      }}
                      className="h-6 w-6 p-0"
                      title="Preview Animation"
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      duplicateElement(element.id)
                    }}
                    className="h-6 w-6 p-0"
                    title="Duplicate"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      resetElementPosition(element.id)
                    }}
                    className="h-6 w-6 p-0"
                    title="Reset Position"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteElement(element.id)
                    }}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                {renderResizeHandles(element.id)}
              </>
            )}
          </div>
        )

      case "list":
        return (
          <div key={element.id} {...commonProps}>
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
                className="min-w-[200px] resize-none border-2 border-blue-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
                placeholder="Enter list items (one per line)"
              />
            ) : (
              <div
                className={`p-4 rounded-lg shadow-sm border min-w-[150px] ${
                  isPreviewMode ? "" : "hover:shadow-md"
                } ${isSelected ? "border-blue-500" : "border-gray-200"}`}
                style={{
                  fontSize: element.fontSize || 16,
                  color: element.color || "#000",
                  width: element.width || "auto",
                  height: element.height || "auto",
                  backgroundColor: element.backgroundColor || "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <ul className="list-disc list-inside space-y-1">
                  {element.content
                    .split("\n")
                    .filter((item) => item.trim())
                    .map((item, idx) => (
                      <li key={idx} className="whitespace-pre-wrap">
                        {item.trim()}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {isSelected && !isPreviewMode && (
              <>
                <div className="absolute -top-12 left-0 flex gap-1 bg-white rounded-md shadow-lg border p-1 z-40">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingElement(element.id)
                    }}
                    className="h-6 w-6 p-0"
                    title="Edit List"
                  >
                    ✏️
                  </Button>
                  {element.animation && element.animation !== "none" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        previewAnimation(element.id)
                      }}
                      className="h-6 w-6 p-0"
                      title="Preview Animation"
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      duplicateElement(element.id)
                    }}
                    className="h-6 w-6 p-0"
                    title="Duplicate"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      resetElementPosition(element.id)
                    }}
                    className="h-6 w-6 p-0"
                    title="Reset Position"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteElement(element.id)
                    }}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                {renderResizeHandles(element.id)}
              </>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Enhanced Animation CSS */}
      <style jsx>{`
        @keyframes animate-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes animate-slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes animate-slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes animate-slideInUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes animate-slideInDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes animate-zoomIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes animate-zoomOut {
          from { transform: scale(2); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes animate-rotateIn {
          from { transform: rotate(-360deg) scale(0); opacity: 0; }
          to { transform: rotate(0deg) scale(1); opacity: 1; }
        }
        @keyframes animate-bounce {
          0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
          40%, 43% { transform: translate3d(0, -30px, 0); }
          70% { transform: translate3d(0, -15px, 0); }
          90% { transform: translate3d(0,-4px,0); }
        }
        
        .animate-fadeIn { animation: animate-fadeIn 1s ease-in forwards; }
        .animate-slideInLeft { animation: animate-slideInLeft 1s ease-out forwards; }
        .animate-slideInRight { animation: animate-slideInRight 1s ease-out forwards; }
        .animate-slideInUp { animation: animate-slideInUp 1s ease-out forwards; }
        .animate-slideInDown { animation: animate-slideInDown 1s ease-out forwards; }
        .animate-zoomIn { animation: animate-zoomIn 1s ease-out forwards; }
        .animate-zoomOut { animation: animate-zoomOut 1s ease-out forwards; }
        .animate-rotateIn { animation: animate-rotateIn 1s ease-out forwards; }
        .animate-bounce { animation: animate-bounce 1s ease-out forwards; }
      `}</style>

      {/* Collapsible Canvas Header */}
      <div
        className={`bg-white border-b border-gray-200 transition-all duration-300 ${isHeaderCollapsed ? "p-2" : "p-4"}`}
      >
        <div className="flex items-center justify-between">
          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
            className="p-1 hover:bg-gray-100"
            title={isHeaderCollapsed ? "Expand Header" : "Collapse Header"}
          >
            {isHeaderCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>

          {/* Collapsed View - Minimal Controls */}
          {isHeaderCollapsed ? (
            <div className="flex items-center gap-2 flex-1 justify-center">
              <span className="text-sm font-medium text-gray-600 truncate max-w-xs">
                {slide.title || "Untitled Slide"}
              </span>
              {slide.audio && (
                <audio controls className="h-6 scale-75">
                  <source src={slide.audio} />
                </audio>
              )}
            </div>
          ) : (
            /* Expanded View - Full Controls */
            <>
              <div className="flex-1">
                {!isPreviewMode ? (
                  <div className="space-y-3">
                    <Input
                      value={slide.title}
                      onChange={(e) => onUpdateSlide({ title: e.target.value })}
                      placeholder="Slide Title"
                      className="text-2xl font-bold border-none bg-gray-200 p-2 focus:ring-0 max-w-[500px]"
                    />
                    <Input
                      value={slide.summary}
                      onChange={(e) => onUpdateSlide({ summary: e.target.value })}
                      placeholder="Slide Summary"
                      className="text-lg text-gray-600 border-none bg-gray-200 p-2 focus:ring-0 mt-2 max-w-[500px]"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h1 className="text-2xl font-bold leading-tight">{slide.title}</h1>
                    {slide.summary && <p className="text-lg text-gray-600 leading-relaxed mt-3">{slide.summary}</p>}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4 col overflow-auto">
                {!isPreviewMode && (
                  <>
                    

                    {/* Image Controls */}
                    <div className="flex-col items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowImageInput((v) => !v)}
                      >
                        📁 Upload Image
                      </Button>
                      {showImageInput && (
                        <div className="flex items-center gap-1 mt-2">
                          <Input
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="Image URL..."
                            className="w-40 h-8"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleImageUrlSubmit()
                                setShowImageInput(false)
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleImageUrlSubmit()
                              setShowImageInput(false)
                            }}
                            disabled={!imageUrl.trim()}
                          >
                            Add
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowImageInput(false)}
                            title="Cancel"
                          >
                            ✖
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Audio Controls */}
                    <div className="flex-col items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAudioInput((v) => !v)}
                      >
                        <Volume2 className="w-4 h-4 mr-2" />
                        {slide.audio ? "Replace" : "Add"} Audio
                      </Button>
                      {showAudioInput && (
                        <div className="flex items-center gap-1 mt-2">
                          <Input
                            value={audioUrl}
                            onChange={(e) => setAudioUrl(e.target.value)}
                            placeholder="Audio URL..."
                            className="w-40 h-8"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleAudioUrlSubmit()
                                setShowAudioInput(false)
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleAudioUrlSubmit()
                              setShowAudioInput(false)
                            }}
                            disabled={!audioUrl.trim()}
                          >
                            Add
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAudioInput(false)}
                            title="Cancel"
                          >
                            ✖
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {slide.audio && !isHeaderCollapsed && (
                  <audio controls className="h-8">
                    <source src={slide.audio} />
                  </audio>
                )}
              </div>
            </>
          )}
        </div>

        {/* Transcript - Only show when expanded
        {!isHeaderCollapsed && (slide.transcript || !isPreviewMode) && (
          <div className="mt-4">
            {isPreviewMode ? (
              slide.transcript && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{slide.transcript}</p>
                </div>
              )
            ) : (
              <Textarea
                value={slide.transcript || ""}
                onChange={(e) => onUpdateSlide({ transcript: e.target.value })}
                placeholder="Add transcript for this slide..."
                className="min-h-[60px] text-sm"
              />
            )}
          </div>
        )} */}
      </div>

      {/* Canvas Area - Maximized */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={canvasRef}
          className={`w-full h-full relative transition-colors select-none`}
          onClick={handleCanvasClick}
          style={{
            backgroundImage: slide.backgroundImage
              ? `url(${slide.backgroundImage})`
              : showGridLines && !isPreviewMode
                ? `linear-gradient(rgba(59, 130, 246, ${snapToGrid ? "0.3" : "0.15"}) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, ${snapToGrid ? "0.3" : "0.15"}) 1px, transparent 1px)`
                : undefined,
            backgroundSize: slide.backgroundImage
              ? slide.backgroundSize || "cover"
              : showGridLines && !isPreviewMode
                ? `${gridSize}px ${gridSize}px`
                : undefined,
            backgroundRepeat: slide.backgroundImage ? "no-repeat" : "repeat",
            backgroundPosition: slide.backgroundImage ? "center" : "0 0",
            backgroundColor: slide.backgroundColor || (theme.background.includes("bg-") ? "#ffffff" : theme.background),
          }}
        >
          {/* Content overlay - Dynamic padding based on header state */}
          <div
            className="absolute inset-0 z-10"
            style={{
              paddingTop: (() => {
                if (isHeaderCollapsed) return "20px"
                let padding = 20
                if (slide.title) padding += 50
                if (slide.summary) padding += 35
                if (slide.title && slide.summary) padding += 15
                return `${padding}px`
              })(),
            }}
          >
            {slide.elements.length === 0 && !isPreviewMode && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Card className="text-center text-gray-500 p-8">
                  <Move className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Maximized Canvas Area</p>
                  <p className="text-sm">Full-screen drag & drop editing</p>
                  <div className="mt-4 text-xs text-gray-400">
                    <p>• Header collapsed for maximum space</p>
                    <p>• Click ↑ to expand controls</p>
                    <p>• Drag elements anywhere on screen</p>
                  </div>
                </Card>
              </div>
            )}

            {slide.elements.map(renderElement)}

            {/* Enhanced Selection indicator - Positioned based on header state */}
            {selectedElementId && !isPreviewMode && (
              <div
                className={`absolute ${isHeaderCollapsed ? "top-2" : "top-4"} left-4 bg-blue-500 text-white px-3 py-1 rounded text-xs z-50`}
              >
                <div className="flex items-center gap-2">
                  <span>Element selected</span>
                  <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                    {slide.elements.find((el) => el.id === selectedElementId)?.type}
                  </Badge>
                </div>
                <p className="text-xs mt-1 opacity-80">Drag to move • Resize with handles • Double-click to edit</p>
              </div>
            )}

            {/* Animation Status - Positioned based on header state */}
            {(playingAnimations.size > 0 || animatingElements.size > 0) && (
              <div
                className={`absolute ${isHeaderCollapsed ? "top-2" : "top-4"} right-4 bg-purple-500 text-white px-3 py-2 rounded-lg text-sm z-50`}
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>Animations Playing ({playingAnimations.size + animatingElements.size})</span>
                </div>
              </div>
            )}

            {/* Grid info - Enhanced for collapsed mode */}
            {!isPreviewMode && (
              <div className="absolute bottom-4 right-4 bg-black/90 text-white px-4 py-2 rounded-lg text-sm font-medium border border-gray-600">
                <div className="flex items-center gap-4">
                  <span className={`flex items-center gap-1 ${showGridLines ? "text-blue-300" : "text-gray-400"}`}>
                    <Grip className="w-3 h-3" />
                    Grid: {showGridLines ? "ON" : "OFF"}
                  </span>
                  <span className={`flex items-center gap-1 ${snapToGrid ? "text-green-300" : "text-gray-400"}`}>
                    <Settings className="w-3 h-3" />
                    Snap: {snapToGrid ? "ON" : "OFF"}
                  </span>
                  <span className="text-gray-300">Size: {gridSize}px</span>
                  {snapToGrid && (
                    <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">SNAPPING ACTIVE</span>
                  )}
                </div>
                {isHeaderCollapsed && (
                  <div className="text-xs text-gray-400 mt-1">Maximized canvas • Click ↑ to expand controls</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioChange} className="hidden" />
      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
    </div>
  )
}
