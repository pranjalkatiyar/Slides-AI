"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"

interface PlaybackControlsProps {
  isPlaying: boolean
  canGoPrev: boolean
  canGoNext: boolean
  autoPlay: boolean
  onPlay: () => void
  onPause: () => void
  onPrev: () => void
  onNext: () => void
  onAutoPlayChange: (autoPlay: boolean) => void
  currentSlide: number
  totalSlides: number
}

export function PlaybackControls({
  isPlaying,
  canGoPrev,
  canGoNext,
  autoPlay=false,
  onPlay,
  onPause,
  onPrev,
  onNext,
  onAutoPlayChange,
  currentSlide,
  totalSlides,
}: PlaybackControlsProps) {
  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onPrev} disabled={!canGoPrev}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <Button
            variant={isPlaying ? "secondary" : "default"}
            onClick={isPlaying ? onPause : onPlay}
            className="min-w-[100px]"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Play
              </>
            )}
          </Button>

          <Button variant="outline" onClick={onNext} disabled={!canGoNext}>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="autoplay" checked={autoPlay} onCheckedChange={onAutoPlayChange} />
            <label
              htmlFor="autoplay"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Auto-play
            </label>
          </div>

          <Badge variant="outline">
            {currentSlide} / {totalSlides}
          </Badge>
        </div>
      </div>
    </div>
  )
}
