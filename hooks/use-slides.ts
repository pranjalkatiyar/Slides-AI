"use client"

import { useState, useCallback } from "react"
import type { Slide, SlideElement } from "@/types/slide-types"

const initialSlides: Slide[] = [
  {
    id: "slide-1",
    title: "Welcome",
    summary: "Introduction to the course",
    elements: [
      {
        id: "el-1",
        type: "text",
        content: "Welcome to the interactive course!",
        x: 50,
        y: 100,
        fontSize: 24,
      },
    ],
  },
  {
    id: "slide-2",
    title: "Overview",
    summary: "What you will learn",
    elements: [
      {
        id: "el-2",
        type: "text",
        content: "This course covers all the basics.",
        x: 50,
        y: 100,
        fontSize: 18,
      },
    ],
  },
]

export function useSlides() {
  const [slides, setSlides] = useState<Slide[]>(initialSlides)
  const [currentIdx, setCurrentIdx] = useState(0)

  const addSlide = useCallback(() => {
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      title: "New Slide",
      summary: "",
      elements: [],
    }
    setSlides((prev) => {
      // Insert the new slide after the current index
      const before = prev.slice(0, currentIdx + 1)
      const after = prev.slice(currentIdx + 1)
      return [...before, newSlide, ...after]
    })
    setCurrentIdx(currentIdx + 1)
  }, [currentIdx])

  const addMultipleSlides = useCallback((newSlides: Slide[]) => {
    setSlides((prev) => {
      const before = prev.slice(0, currentIdx + 1)
      const after = prev.slice(currentIdx + 1)
      // Add all new slides after the current index
      return [...before, ...newSlides, ...after]
    })
    // Move to the first new slide
    setCurrentIdx(currentIdx + 1)
  }, [currentIdx])

  const deleteSlide = useCallback(
    (idx: number) => {
      if (slides.length === 1) return
      setSlides((prev) => prev.filter((_, i) => i !== idx))
      setCurrentIdx((prev) => (prev > 0 ? prev - 1 : 0))
    },
    [slides.length],
  )

  const updateSlide = useCallback(
    (updates: Partial<Slide>) => {
      setSlides((prev) => prev.map((slide, idx) => (idx === currentIdx ? { ...slide, ...updates } : slide)))
    },
    [currentIdx],
  )

  const addElement = useCallback(
    (type: "text" | "image" | "quiz" | "code" | "list" | "title" | "summary") => {
      const newElement: SlideElement = {
        id: `el-${Date.now()}`,
        type,
        content:
        type === "title"
          ? "New Slide Title"
          : type === "summary"
            ? "New summary content"
          : type === "text"
            ? "New text content"
            : type === "image"
              ? "/placeholder.svg?height=200&width=300"
              : type === "code"
                ? "// Your code here\nfunction hello() {\n  console.log('Hello, World!');\n}"
                : type === "list"
                  ? "First item\nSecond item\nThird item"
                  : '{"question": "Sample question?", "options": ["A", "B", "C"], "correct": 0}',
        x: Math.random() * 200 + 50,
        y: Math.random() * 200 + 100,
        width: type === "image" ? 300 : type === "code" ? 400 : type === "list" ? 250 : undefined,
        height: type === "image" ? 200 : type === "code" ? 200 : type === "list" ? 150 :undefined,
        fontSize: type === "title" ? 22 : type === "summary" ? 16 : type === "text" ? 16 : type === "code" ? 14 : type === "list" ? 14 : 18,
        minWidth: type === "image" ? 100 : type === "code" ? 200 : type === "list" ? 150 : 50,
        minHeight: type === "image" ? 50 : type === "code" ? 100 : type === "list" ? 80 : 30,
        maxWidth: 800,
        maxHeight: 600,
      }

      setSlides((prev) =>
        prev.map((slide, idx) =>
          idx === currentIdx ? { ...slide, elements: [...slide.elements, newElement] } : slide,
        ),
      )
    },
    [currentIdx],
  )

  const updateElement = useCallback(
    (elementId: string, updates: Partial<SlideElement>) => {
      setSlides((prev) =>
        prev.map((slide, idx) =>
          idx === currentIdx
            ? {
                ...slide,
                elements: slide.elements.map((el) => (el.id === elementId ? { ...el, ...updates } : el)),
              }
            : slide,
        ),
      )
    },
    [currentIdx],
  )

  const deleteElement = useCallback(
    (elementId: string) => {
      setSlides((prev) =>
        prev.map((slide, idx) =>
          idx === currentIdx ? { ...slide, elements: slide.elements.filter((el) => el.id !== elementId) } : slide,
        ),
      )
    },
    [currentIdx],
  )

  const reorderSlides = useCallback(
    (fromIdx: number, toIdx: number) => {
      setSlides((prev) => {
        const newSlides = [...prev]
        const [movedSlide] = newSlides.splice(fromIdx, 1)
        newSlides.splice(toIdx, 0, movedSlide)
        return newSlides
      })

      if (currentIdx === fromIdx) {
        setCurrentIdx(toIdx)
      } else if (currentIdx > fromIdx && currentIdx <= toIdx) {
        setCurrentIdx(currentIdx - 1)
      } else if (currentIdx < fromIdx && currentIdx >= toIdx) {
        setCurrentIdx(currentIdx + 1)
      }
    },
    [currentIdx],
  )

  const exportSlides = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(slides, null, 2))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", `slides-${new Date().toISOString().split("T")[0]}.json`)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }, [slides])

  const importSlides = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string)
        const importedSlides = importedData.slides || importedData
        if (Array.isArray(importedSlides) && importedSlides.length > 0) {
          setSlides(importedSlides)
          setCurrentIdx(0)
        } else {
          alert("Invalid slides file.")
        }
      } catch {
        alert("Invalid JSON file.")
      }
    }
    reader.readAsText(file)
  }, [])

  return {
    slides,
    currentIdx,
    setCurrentIdx,
    addSlide,
    addMultipleSlides,
    deleteSlide,
    updateSlide,
    addElement,
    updateElement,
    deleteElement,
    reorderSlides,
    exportSlides,
    importSlides,
  }
}
