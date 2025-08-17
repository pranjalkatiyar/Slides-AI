"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface GridContextType {
  showGridLines: boolean
  setShowGridLines: (show: boolean) => void
  snapToGrid: boolean
  setSnapToGrid: (snap: boolean) => void
  gridSize: number
  setGridSize: (size: number) => void
}

const GridContext = createContext<GridContextType | undefined>(undefined)

export function GridProvider({ children }: { children: ReactNode }) {
  const [showGridLines, setShowGridLines] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSize, setGridSize] = useState(20)

  return (
    <GridContext.Provider
      value={{
        showGridLines,
        setShowGridLines,
        snapToGrid,
        setSnapToGrid,
        gridSize,
        setGridSize,
      }}
    >
      {children}
    </GridContext.Provider>
  )
}

export function useGrid() {
  const context = useContext(GridContext)
  if (context === undefined) {
    throw new Error("useGrid must be used within a GridProvider")
  }
  return context
}
