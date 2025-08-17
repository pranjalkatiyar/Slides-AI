"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from "lucide-react"
import type { Slide, SlideTheme } from "@/types/slide-types"
import { InteractiveQuiz } from "./interactive-quiz"

interface PresentationPreviewProps {
  slides: Slide[]
  currentIdx: number
  theme: SlideTheme
  isOpen: boolean
  onClose: () => void
  onSlideChange: (idx: number) => void
}

export function PresentationPreview({
  slides,
  currentIdx,
  theme,
  isOpen,
  onClose,
  onSlideChange,
}: PresentationPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [audioProgress, setAudioProgress] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)

  const currentSlide = slides[currentIdx]

  useEffect(() => {
    if (!isOpen) return

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          if (currentIdx > 0) onSlideChange(currentIdx - 1)
          break
        case "ArrowRight":
          if (currentIdx < slides.length - 1) onSlideChange(currentIdx + 1)
          break
        case "Escape":
          onClose()
          break
        case " ":
          e.preventDefault()
          toggleAudio()
          break
      }
    }

    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }, [isOpen, currentIdx, slides.length, onSlideChange, onClose])

  useEffect(() => {
    if (currentSlide.audio && audioRef.current) {
      audioRef.current.src = currentSlide.audio
      audioRef.current.load()
      setIsPlaying(false)
      setAudioProgress(0)
    }
  }, [currentSlide.audio, currentIdx])

  const toggleAudio = () => {
    if (!audioRef.current || !currentSlide.audio) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setAudioProgress(audioRef.current.currentTime)
      setAudioDuration(audioRef.current.duration || 0)
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
    setAudioProgress(0)
    // Auto-advance to next slide
    if (currentIdx < slides.length - 1) {
      setTimeout(() => onSlideChange(currentIdx + 1), 1000)
    }
  }

  const renderElement = (element: any) => {
    const elementStyle = {
      position: "absolute" as const,
      left: element.x || 0,
      top: element.y || 0,
      width: element.width || "auto",
      height: element.height || "auto",
      zIndex: 1,
    }

    switch (element.type) {
      case "text":
        return (
          <div key={element.id} style={elementStyle}>
            <div
              className="p-4 rounded-lg shadow-sm border"
              style={{
                fontSize: element.fontSize || 16,
                color: element.color || "#000",
                backgroundColor: element.backgroundColor || "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(4px)",
              }}
            >
              <p className="whitespace-pre-wrap">{element.content}</p>
            </div>
          </div>
        )

      case "image":
        return (
          <div key={element.id} style={elementStyle}>
            <img
              src={element.content || "/placeholder.svg"}
              alt="Slide content"
              className="rounded-lg shadow-sm"
              style={{
                width: element.width || 300,
                height: element.height || 200,
                objectFit: "cover",
              }}
            />
          </div>
        )

      case "quiz":
        return (
          <div key={element.id} style={elementStyle}>
            <InteractiveQuiz content={element.content} isPreviewMode={true} />
          </div>
        )

      case "code":
        return (
          <div key={element.id} style={elementStyle}>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg shadow-sm border font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap">{element.content}</pre>
            </div>
          </div>
        )

      case "list":
        return (
          <div key={element.id} style={elementStyle}>
            <div
              className="p-4 rounded-lg shadow-sm border"
              style={{
                fontSize: element.fontSize || 16,
                color: element.color || "#000",
                backgroundColor: element.backgroundColor || "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(4px)",
                width: element.width || "auto",
                height: element.height || "auto",
              }}
            >
              <ul className="list-disc list-inside space-y-1">
                {element.content
                  .split("\n")
                  .filter((item: string) => item.trim())
                  .map((item: string, idx: number) => (
                    <li key={idx} className="whitespace-pre-wrap">
                      {item.trim()}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!isOpen) return null

  const headerHeight = (() => {
    let height = 40
    if (currentSlide.title) height += 60
    if (currentSlide.summary) height += 40
    if (currentSlide.title && currentSlide.summary) height += 20
    return height
  })()

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header Controls */}
      <div className="bg-black/80 backdrop-blur-sm p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="bg-white/20 text-white">
            {currentIdx + 1} / {slides.length}
          </Badge>
          <h2 className="text-lg font-semibold">{currentSlide.title}</h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Audio Controls */}
          {currentSlide.audio && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={toggleAudio} className="text-white hover:bg-white/20">
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsMuted(!isMuted)
                  if (audioRef.current) {
                    audioRef.current.muted = !isMuted
                  }
                }}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <div className="w-32 bg-white/20 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all"
                  style={{ width: `${audioDuration ? (audioProgress / audioDuration) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => currentIdx > 0 && onSlideChange(currentIdx - 1)}
            disabled={currentIdx === 0}
            className="text-white hover:bg-white/20"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => currentIdx < slides.length - 1 && onSlideChange(currentIdx + 1)}
            disabled={currentIdx === slides.length - 1}
            className="text-white hover:bg-white/20"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className="w-full h-full relative"
          style={{
            backgroundImage: currentSlide.backgroundImage ? `url(${currentSlide.backgroundImage})` : undefined,
            backgroundSize: currentSlide.backgroundSize || "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundColor: currentSlide.backgroundColor || theme.background,
          }}
        >
          {/* Title and Summary */}
          <div className="absolute top-0 left-0 right-0 p-8 z-10">
            {currentSlide.title && (
              <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">{currentSlide.title}</h1>
            )}
            {currentSlide.summary && (
              <h2 className="text-xl text-white/90 drop-shadow-lg leading-relaxed">{currentSlide.summary}</h2>
            )}
          </div>

          {/* Elements */}
          <div className="absolute inset-0" style={{ paddingTop: `${headerHeight}px`, padding: "20px" }}>
            {currentSlide.elements.map(renderElement)}
          </div>

          {/* Transcript */}
          {currentSlide.transcript && (
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 text-white/90 text-sm">
                <p className="whitespace-pre-wrap">{currentSlide.transcript}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden Audio Element */}
      {currentSlide.audio && (
        <audio
          ref={audioRef}
          onTimeUpdate={handleAudioTimeUpdate}
          onEnded={handleAudioEnded}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setAudioDuration(audioRef.current.duration)
            }
          }}
          muted={isMuted}
        />
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-4 left-4 text-white/60 text-xs">
        <p>← → Navigate • Space Play/Pause • Esc Exit</p>
      </div>
    </div>
  )
}
