"use client"

import { useState, useRef, useCallback } from "react"

export function useAudio() {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const playAudio = useCallback((src: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
    }

    const audio = new Audio(src)
    audioRef.current = audio

    audio.onplay = () => setIsAudioPlaying(true)
    audio.onpause = () => setIsAudioPlaying(false)
    audio.onended = () => setIsAudioPlaying(false)

    audio.play().catch(console.error)
  }, [])

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }, [])

  return {
    isAudioPlaying,
    playAudio,
    pauseAudio,
  }
}
