"use client"

import { useState, useEffect, useRef } from "react"
import { SlideMenu } from "./slide-menu"
import { GrapesJSCanvas } from "./grapesjs-canvas"
import { PlaybackControls } from "./playback-controls"
import { Toolbar } from "./toolbar"
import { ThemeProvider } from "./theme-provider"
import { useSlides } from "@/hooks/use-slides"
import { useAudio } from "@/hooks/use-audio"
import { useSpeech } from "@/hooks/use-speech"
import type { SlideTheme, Slide } from "@/types/slide-types"
import { SlidePropertiesPanel } from "./slide-properties-panel"
import { ExportDialog } from "./export-dialog"
import { RevealExportDialog } from "./reveal-export-dialog"
import { PresentationPreview } from "./presentation-preview"
import { AIAssistantPanel } from "./ai-assistant-panel"
import { DragDropCanvas } from "./drag-drop-canvas"

const defaultTheme: SlideTheme = {
  id: "default",
  name: "Default",
  background: "bg-white",
  text: "text-gray-900",
  accent: "bg-blue-600",
  border: "border-gray-200",
}

export default function SlideEditor() {
  const {
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
    exportSlides,
    importSlides,
    reorderSlides,
  } = useSlides()

  const [theme, setTheme] = useState<SlideTheme>(defaultTheme)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [autoPlay, setAutoPlay] = useState(true)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showRevealExport, setShowRevealExport] = useState(false)
  const [audioLength, setAudioLength] = useState<number>(0)
  const [autoSlideTimer, setAutoSlideTimer] = useState<NodeJS.Timeout | null>(null)
  const [showPresentationPreview, setShowPresentationPreview] = useState(false)
  const [isSlideAnimating, setIsSlideAnimating] = useState(false)
  const [showAIPanel, setShowAIPanel] = useState(true)

  const { playAudio, pauseAudio, isAudioPlaying } = useAudio()
  const { speakText, stopSpeaking, isSpeaking } = useSpeech()
  const audioRef = useRef<HTMLAudioElement>(null)

  const currentSlide = slides[currentIdx]
  const isPlaying = isAudioPlaying || isSpeaking || isSlideAnimating

  // Get audio duration when audio changes
  useEffect(() => {
    if (currentSlide.audio && audioRef.current) {
      const audio = audioRef.current
      audio.src = currentSlide.audio

      const handleLoadedMetadata = () => {
        setAudioLength(audio.duration * 1000) // Convert to milliseconds
      }

      audio.addEventListener("loadedmetadata", handleLoadedMetadata)
      audio.load()

      return () => {
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      }
    }
  }, [currentSlide.audio])

  const handlePlay = () => {
    setIsSlideAnimating(true)

    // Start audio if available
    if (currentSlide.audio) {
      playAudio(currentSlide.audio)
    } else if (currentSlide.transcript) {
      speakText(currentSlide.transcript)
    }

    // Calculate total animation time
    const elementsWithAnimations = currentSlide.elements.filter((el) => el.animation && el.animation !== "none")
    const maxAnimationTime = elementsWithAnimations.reduce((max, element) => {
      const totalTime =
        (element.animationDelay || 0) + (element.animationDuration || 1000) + (element.fragmentIndex || 0) * 1000
      return Math.max(max, totalTime)
    }, 0)

    // Use audio length or animation time for auto-advance
    const slideLength = Math.max(audioLength, maxAnimationTime)

    if (autoPlay && slideLength > 0) {
      const timer = setTimeout(() => {
        if (currentIdx < slides.length - 1) {
          setCurrentIdx(currentIdx + 1)
        }
        setIsSlideAnimating(false)
      }, slideLength + 500) // Add small buffer
      setAutoSlideTimer(timer)
    }
  }

  const handlePause = () => {
    pauseAudio()
    stopSpeaking()
    setIsSlideAnimating(false)

    // Clear auto-slide timer
    if (autoSlideTimer) {
      clearTimeout(autoSlideTimer)
      setAutoSlideTimer(null)
    }
  }

  const handleAnimationComplete = () => {
    // Called when all animations on a slide are complete
    if (!currentSlide.audio && !currentSlide.transcript && autoPlay) {
      // If no audio/speech, auto-advance after animations
      setTimeout(() => {
        if (currentIdx < slides.length - 1) {
          setCurrentIdx(currentIdx + 1)
        }
        setIsSlideAnimating(false)
      }, 1000)
    }
  }

  const nextSlide = () => {
    if (currentIdx < slides.length - 1) {
      setCurrentIdx(currentIdx + 1)
    }
  }

  const prevSlide = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1)
    }
  }

  // Handle AI-generated slides
  const handleGenerateSlides = (generatedSlides: Slide[]) => {
    // Process slides with unique IDs
    const processedSlides = generatedSlides.map(slide => ({
      ...slide,
      id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }))
    
    // Add all slides at once using the new helper
    addMultipleSlides(processedSlides)
  }

  // Auto-play on slide change
  useEffect(() => {
    stopSpeaking()
    pauseAudio()
    setSelectedElementId(null)
    setIsSlideAnimating(false)

    // Clear any existing timer
    if (autoSlideTimer) {
      clearTimeout(autoSlideTimer)
      setAutoSlideTimer(null)
    }

    if (autoPlay && !isPreviewMode) {
      const timer = setTimeout(() => {
        handlePlay()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentIdx])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSlideTimer) {
        clearTimeout(autoSlideTimer)
      }
    }
  }, [autoSlideTimer])

  return (
    <ThemeProvider theme={theme}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Hidden audio element for duration detection */}
        <audio ref={audioRef} style={{ display: "none" }} />

        <SlideMenu
          slides={slides}
          currentIdx={currentIdx}
          onSlideSelect={setCurrentIdx}
          onAddSlide={addSlide}
          onDeleteSlide={deleteSlide}
          onReorderSlides={reorderSlides}
          onExport={() => setShowExportDialog(true)}
          onImport={importSlides}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Toolbar
            theme={theme}
            onThemeChange={setTheme}
            isPreviewMode={isPreviewMode}
            onPreviewModeChange={setIsPreviewMode}
            onAddElement={addElement}
            currentSlide={currentSlide}
            onUpdateSlide={updateSlide}
            onExport={() => setShowExportDialog(true)}
            onPresentationPreview={() => setShowPresentationPreview(true)}
            onToggleAI={() => setShowAIPanel(!showAIPanel)}
            showAIPanel={showAIPanel}
          />

          <div className="flex-1 overflow-hidden flex min-h-0">
            <div className="flex-1 min-w-0">
              <GrapesJSCanvas
                slide={currentSlide}
                theme={theme}
                isPreviewMode={isPreviewMode}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onUpdateSlide={updateSlide}
                onUpdateElement={updateElement}
                onDeleteElement={deleteElement}
                isPlaying={isSlideAnimating}
                onAnimationComplete={handleAnimationComplete}
              />
              {/* <DragDropCanvas/> */}
            </div>

            {/* Right Panel - Properties or AI Assistant */}
            {!isPreviewMode && (
              <>
                {showAIPanel ? (
                  <AIAssistantPanel
                    slides={slides}
                    currentSlide={currentSlide}
                    selectedElement={currentSlide.elements.find((el) => el.id === selectedElementId) || null}
                    onGenerateSlides={handleGenerateSlides}
                    onUpdateSlide={updateSlide}
                    onUpdateElement={updateElement}
                    onAddElement={addElement}
                  />
                ) : (
                  <SlidePropertiesPanel
                    slide={currentSlide}
                    selectedElement={currentSlide.elements.find((el) => el.id === selectedElementId) || null}
                    onUpdateSlide={updateSlide}
                    onUpdateElement={updateElement}
                  />
                )}
              </>
            )}
          </div>
          
          {/* Commented Playback Controls */}
          <PlaybackControls
            isPlaying={isPlaying}
            canGoPrev={currentIdx > 0}
            canGoNext={currentIdx < slides.length - 1}
            autoPlay={autoPlay}
            onPlay={handlePlay}
            onPause={handlePause}
            onPrev={prevSlide}
            onNext={nextSlide}
            onAutoPlayChange={setAutoPlay}
            currentSlide={currentIdx + 1}
            totalSlides={slides.length}
          />
        </div>

        {/* Dialogs remain the same */}
        <ExportDialog
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
          slides={slides}
          currentSlide={currentSlide}
          onRevealExport={() => {
            setShowExportDialog(false)
            setShowRevealExport(true)
          }}
        />

        <RevealExportDialog
          open={showRevealExport}
          onOpenChange={setShowRevealExport}
          slides={slides}
          currentSlide={currentSlide}
        />

        <PresentationPreview
          slides={slides}
          currentIdx={currentIdx}
          theme={theme}
          isOpen={showPresentationPreview}
          onClose={() => setShowPresentationPreview(false)}
          onSlideChange={setCurrentIdx}
        />
      </div>
    </ThemeProvider>
  )
}
