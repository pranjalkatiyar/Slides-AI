"use client"

import type React from "react"
import { createContext, useContext } from "react"
import type { SlideTheme } from "@/types/slide-types"

const ThemeContext = createContext<SlideTheme | null>(null)

interface ThemeProviderProps {
  theme: SlideTheme
  children: React.ReactNode
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const theme = useContext(ThemeContext)
  if (!theme) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return theme
}
