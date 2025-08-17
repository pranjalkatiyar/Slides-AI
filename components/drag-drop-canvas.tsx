"use client"

import React, { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Move, RotateCcw, Copy, Volume2, Play } from "lucide-react"
import type { Slide, SlideElement, SlideTheme } from "@/types/slide-types"
import { InteractiveQuiz } from "./interactive-quiz"

interface DragDropCanvasProps {
  slide: Slide
  theme: SlideTheme
  isPreviewMode: boolean
  selectedElementId: string | null
  onSelectElement: (id: string | null) => void
  onUpdateSlide: (updates: Partial<Slide>) => void
  onUpdateElement: (elementId: string, updates: Partial<SlideElement>) => void
  onDeleteElement: (elementId: string) => void
}

export function DragDropCanvas({
  slide,
  theme,
  isPreviewMode,
  selectedElementId,
  onSelectElement,
  onUpdateSlide,
  onUpdateElement,
  onDeleteElement,
}: DragDropCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [editingElement, setEditingElement] = useState<string | null>(null)
  const [animatingElements, setAnimatingElements] = useState<Set<string>>(new Set())
  const audioInputRef = useRef<HTMLInputElement>(null)
  const [audioUrl, setAudioUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  const handleAudioUrlSubmit = () => {
    if (audioUrl.trim()) {
      onUpdateSlide({ audio: audioUrl.trim() })
      setAudioUrl("")
    }
  }

  const handleImageUrlSubmit = (elementId?: string) => {
    if (imageUrl.trim()) {
      if (elementId) {
        onUpdateElement(elementId, { content: imageUrl.trim() })
      }
      setImageUrl("")
    }
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      if (isPreviewMode) return

      e.preventDefault()
      e.stopPropagation()

      const element = slide.elements.find((el) => el.id === elementId)
      if (!element) return

      onSelectElement(elementId)
      setIsDragging(true)

      const rect = e.currentTarget.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    },
    [slide.elements, onSelectElement, isPreviewMode],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!selectedElementId || !canvasRef.current) return

      const canvasRect = canvasRef.current.getBoundingClientRect()

      if (isDragging) {
        const newX = e.clientX - canvasRect.left - dragOffset.x
        const newY = e.clientY - canvasRect.top - dragOffset.y

        onUpdateElement(selectedElementId, {
          x: Math.max(0, Math.min(newX, canvasRect.width - 100)),
          y: Math.max(0, Math.min(newY, canvasRect.height - 50)),
        })
      } else if (isResizing) {
        const element = slide.elements.find((el) => el.id === selectedElementId)
        if (element) {
          const newWidth = Math.max(element.minWidth || 50, e.clientX - canvasRect.left - (element.x || 0))
          const newHeight = Math.max(element.minHeight || 30, e.clientY - canvasRect.top - (element.y || 0))

          onUpdateElement(selectedElementId, {
            width: Math.min(newWidth, element.maxWidth || canvasRect.width),
            height: Math.min(newHeight, element.maxHeight || canvasRect.height),
          })
        }
      }
    },
    [isDragging, isResizing, selectedElementId, dragOffset, onUpdateElement, slide.elements],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

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
    }, 2000) // Animation duration
  }

  const getAnimationClass = (element: SlideElement) => {
    if (!element.animation || element.animation === "none") return ""
    if (animatingElements.has(element.id)) {
      return `animate-${element.animation}`
    }
    return ""
  }

  const getAnimationStyle = (element: SlideElement) => {
    if (!element.animation || element.animation === "none" || !animatingElements.has(element.id)) return {}

    return {
      animationDelay: `${element.animationDelay || 0}ms`,
      animationDuration: `${element.animationDuration || 1000}ms`,
    }
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
      zIndex: isSelected ? 10 : 1,
      ...animationStyle,
    }

    const commonProps = {
      style: elementStyle,
      onMouseDown: (e: React.MouseEvent) => handleMouseDown(e, element.id),
      onDoubleClick: () => handleElementDoubleClick(element.id),
      className: `group cursor-move transition-all ${animationClass} ${
        isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
      } ${isPreviewMode ? "cursor-default" : ""}`,
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
                className="min-w-[200px] resize-none"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div
                className={`p-4 bg-white rounded-lg shadow-sm border min-w-[100px] ${
                  isPreviewMode ? "" : "hover:shadow-md"
                }`}
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
                <div className="absolute -top-10 left-0 flex gap-1 bg-white rounded-md shadow-lg border p-1 z-20">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingElement(element.id)
                    }}
                    className="h-6 w-6 p-0"
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
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                {/* Resize handles */}
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize z-20"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    setIsResizing(true)
                  }}
                />
              </>
            )}
          </div>
        )

      case "image":
        return (
          <div key={element.id} {...commonProps}>
            <div className="relative bg-white rounded-lg shadow-sm border overflow-hidden">
              <img
                src={element.content || "/placeholder.svg?height=200&width=300"}
                alt="Slide content"
                className="block"
                style={{
                  width: element.width || 300,
                  height: element.height || 200,
                  objectFit: "cover",
                }}
                draggable={false}
              />

              {isSelected && !isPreviewMode && (
                <>
                  <div className="absolute -top-10 left-0 flex gap-1 bg-white rounded-md shadow-lg border p-1 z-20">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleImageUpload(element.id)
                      }}
                      className="h-6 w-6 p-0"
                      title="Set Default Image"
                    >
                      🖼️
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
                      🔗
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
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Resize handles */}
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize z-20"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      setIsResizing(true)
                    }}
                  />
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
                  className="min-h-[120px] font-mono text-sm"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ) : (
              <InteractiveQuiz content={element.content} isPreviewMode={isPreviewMode} />
            )}

            {isSelected && !isPreviewMode && (
              <>
                <div className="absolute -top-10 left-0 flex gap-1 bg-white rounded-md shadow-lg border p-1 z-20">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingElement(element.id)
                    }}
                    className="h-6 w-6 p-0"
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
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                {/* Resize handles */}
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize z-20"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    setIsResizing(true)
                  }}
                />
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
                className="min-w-[300px] font-mono text-sm resize-none"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg shadow-sm border font-mono text-sm min-w-[200px] overflow-x-auto">
                <pre className="whitespace-pre-wrap">{element.content}</pre>
              </div>
            )}

            {isSelected && !isPreviewMode && (
              <>
                <div className="absolute -top-10 left-0 flex gap-1 bg-white rounded-md shadow-lg border p-1 z-20">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingElement(element.id)
                    }}
                    className="h-6 w-6 p-0"
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
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                {/* Resize handles */}
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize z-20"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    setIsResizing(true)
                  }}
                />
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
                className="min-w-[200px] resize-none"
                autoFocus
                onClick={(e) => e.stopPropagation()}
                placeholder="Enter list items (one per line)"
              />
            ) : (
              <div
                className={`p-4 bg-white rounded-lg shadow-sm border min-w-[150px] ${
                  isPreviewMode ? "" : "hover:shadow-md"
                }`}
                style={{
                  fontSize: element.fontSize || 16,
                  color: element.color || "#000",
                  width: element.width || "auto",
                  height: element.height || "auto",
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
                <div className="absolute -top-10 left-0 flex gap-1 bg-white rounded-md shadow-lg border p-1 z-20">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingElement(element.id)
                    }}
                    className="h-6 w-6 p-0"
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
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                {/* Resize handles for all sides */}
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize z-20"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    setIsResizing(true)
                  }}
                />
                <div
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 cursor-s-resize z-20"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    setIsResizing(true)
                  }}
                />
                <div
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 cursor-e-resize z-20"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    setIsResizing(true)
                  }}
                />
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
      {/* Animation CSS */}
      <style jsx>{`
        @keyframes animate-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes animate-slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes animate-slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes animate-slideInUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes animate-slideInDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        @keyframes animate-zoomIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        @keyframes animate-zoomOut {
          from { transform: scale(2); }
          to { transform: scale(1); }
        }
        @keyframes animate-rotateIn {
          from { transform: rotate(-360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes animate-bounce {
          0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
          40%, 43% { transform: translate3d(0, -30px, 0); }
          70% { transform: translate3d(0, -15px, 0); }
          90% { transform: translate3d(0,-4px,0); }
        }
        
        .animate-fadeIn { animation: animate-fadeIn 1s ease-in; }
        .animate-slideInLeft { animation: animate-slideInLeft 1s ease-out; }
        .animate-slideInRight { animation: animate-slideInRight 1s ease-out; }
        .animate-slideInUp { animation: animate-slideInUp 1s ease-out; }
        .animate-slideInDown { animation: animate-slideInDown 1s ease-out; }
        .animate-zoomIn { animation: animate-zoomIn 1s ease-out; }
        .animate-zoomOut { animation: animate-zoomOut 1s ease-out; }
        .animate-rotateIn { animation: animate-rotateIn 1s ease-out; }
        .animate-bounce { animation: animate-bounce 1s ease-out; }
      `}</style>

      {/* Canvas Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {!isPreviewMode ? (
              <div className="space-y-3">
                <Input
                  value={slide.title}
                  onChange={(e) => onUpdateSlide({ title: e.target.value })}
                  placeholder="Slide Title"
                  className="text-2xl font-bold border-none bg-transparent p-0 focus:ring-0"
                />
                <Input
                  value={slide.summary}
                  onChange={(e) => onUpdateSlide({ summary: e.target.value })}
                  placeholder="Slide Summary"
                  className="text-lg text-gray-600 border-none bg-transparent p-0 focus:ring-0 mt-2"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <h1 className="text-2xl font-bold leading-tight">{slide.title}</h1>
                {slide.summary && <p className="text-lg text-gray-600 leading-relaxed mt-3">{slide.summary}</p>}
              </div>
            )}
          </div>

          {/* Audio Controls */}
          <div className="flex items-center gap-4">
            {!isPreviewMode && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleAudioUpload}>
                  <Volume2 className="w-4 h-4 mr-2" />
                  {slide.audio ? "Replace" : "Add"} Audio
                </Button>
                <div className="flex items-center gap-1">
                  <Input
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    placeholder="Or paste audio URL..."
                    className="w-48 h-8"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAudioUrlSubmit()
                      }
                    }}
                  />
                  <Button variant="outline" size="sm" onClick={handleAudioUrlSubmit} disabled={!audioUrl.trim()}>
                    Add
                  </Button>
                </div>
              </div>
            )}
            {slide.audio && (
              <audio controls className="h-8">
                <source src={slide.audio} />
              </audio>
            )}
          </div>

          {/* Image URL Input */}
          {!isPreviewMode && (
            <div className="flex items-center gap-2">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste image URL..."
                className="w-48 h-8"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleImageUrlSubmit()
                  }
                }}
              />
              <Button variant="outline" size="sm" onClick={() => handleImageUrlSubmit()} disabled={!imageUrl.trim()}>
                Add Image
              </Button>
            </div>
          )}
        </div>

        {/* Transcript */}
        {(slide.transcript || !isPreviewMode) && (
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
        )}
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={canvasRef}
          className={`w-full h-full relative transition-colors`}
          onClick={handleCanvasClick}
          style={{
            backgroundImage: slide.backgroundImage
              ? `url(${slide.backgroundImage})`
              : `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: slide.backgroundImage ? slide.backgroundSize || "cover" : "20px 20px",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundColor: slide.backgroundColor || (theme.background.includes("bg-") ? "" : theme.background),
          }}
        >
          {/* Content overlay to ensure elements appear above background */}
          <div
            className="absolute inset-0 z-10"
            style={{
              paddingTop: (() => {
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
                <div className="text-center text-gray-500 bg-white/80 p-8 rounded-lg">
                  <Move className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Empty Canvas</p>
                  <p className="text-sm">Add elements from the toolbar above</p>
                </div>
              </div>
            )}

            {slide.elements.map(renderElement)}

            {/* Selection indicator */}
            {selectedElementId && !isPreviewMode && (
              <div className="absolute top-4 left-4 bg-blue-500 text-white px-2 py-1 rounded text-xs z-50">
                Element selected - Drag to move, double-click to edit
                {slide.elements.find((el) => el.id === selectedElementId)?.animation &&
                  slide.elements.find((el) => el.id === selectedElementId)?.animation !== "none" && (
                    <span className="ml-2">• Click ▶ to preview animation</span>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioChange} className="hidden" />
    </div>
  )
}
