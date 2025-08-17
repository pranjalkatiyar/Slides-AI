export interface SlideElement {
  id: string
  type: "text" | "image" | "quiz" | "code" | "list" | "title" | "summary"
  content: string
  x?: number
  y?: number
  width?: number | string
  height?: number | string
  fontSize?: number
  elements?:SlideElement[] // For nested elements in lists or quizzes
  color?: string
  backgroundColor?: string
  rotation?: number
  // Reveal.js specific properties
  fragmentType?: "fade-in" | "fade-out" | "highlight-red" | "highlight-green" | "highlight-blue" | "grow" | "shrink"
  fragmentIndex?: number
  // Individual element animations
  animation?:
    | "none"
    | "fadeIn"
    | "slideInLeft"
    | "slideInRight"
    | "slideInUp"
    | "slideInDown"
    | "zoomIn"
    | "zoomOut"
    | "rotateIn"
    | "bounce"
  animationDelay?: number
  animationDuration?: number
  // Resizing properties
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
}

export interface Slide {
  id: string
  title: string
  summary: string
  elements: SlideElement[]
  audio?: string
  transcript?: string
  quiz?: any
  // Reveal.js specific properties
  transition?: "none" | "fade" | "slide" | "convex" | "concave" | "zoom"
  transitionSpeed?: "default" | "fast" | "slow"
  background?: string
  backgroundColor?: string
  backgroundImage?: string
  backgroundVideo?: string
  backgroundSize?: "cover" | "contain"
  speakerNotes?: string
  verticalSlide?: boolean
}

export interface SlideTheme {
  id: string
  name: string
  background: string
  text: string
  accent: string
  border: string
  // Reveal.js theme
  revealTheme?:
    | "black"
    | "white"
    | "league"
    | "beige"
    | "sky"
    | "night"
    | "serif"
    | "simple"
    | "solarized"
    | "blood"
    | "moon"
}

export interface RevealConfig {
  hash: boolean
  history: boolean
  controls: boolean
  progress: boolean
  center: boolean
  touch: boolean
  loop: boolean
  rtl: boolean
  navigationMode: "default" | "linear" | "grid"
  shuffle: boolean
  fragments: boolean
  fragmentInURL: boolean
  embedded: boolean
  help: boolean
  showNotes: boolean
  autoSlide: number
  autoSlideStoppable: boolean
  mouseWheel: boolean
  hideInactiveCursor: boolean
  previewLinks: boolean
  transition: "none" | "fade" | "slide" | "convex" | "concave" | "zoom"
  transitionSpeed: "default" | "fast" | "slow"
  backgroundTransition: "none" | "fade" | "slide" | "convex" | "concave" | "zoom"
}
