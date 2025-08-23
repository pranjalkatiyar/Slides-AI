"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Bot,
  Sparkles,
  HelpCircle,
  Settings,
  Loader2,
  RefreshCw,
  Wand2,
  FileText,
  Briefcase,
  Code,
  Palette,
  Microscope,
  GraduationCap,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import type { Slide, SlideElement } from "@/types/slide-types"
import { useAISettings } from "@/hooks/use-ai-settings"
import { AISettingsDialog } from "./ai-settings-dialog"

interface AIAssistantPanelProps {
  slides: Slide[]
  currentSlide: Slide
  selectedElement: SlideElement | null
  onGenerateSlides: (slides: Slide[]) => void
  onUpdateSlide: (updates: Partial<Slide>) => void
  onUpdateElement: (elementId: string, updates: Partial<SlideElement>) => void
  onAddElement: (element: Omit<SlideElement, "id">) => void
}

interface SlideTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  prompt: string
}

const SLIDE_TEMPLATES: SlideTemplate[] = [
  {
    id: "educational",
    name: "Educational",
    description: "Learning objectives and structured content",
    icon: <GraduationCap className="w-4 h-4" />,
    prompt: "Create educational slides with clear learning objectives, structured content, and knowledge checks.",
  },
  {
    id: "business",
    name: "Business",
    description: "Executive summaries and key metrics",
    icon: <Briefcase className="w-4 h-4" />,
    prompt: "Create business presentation slides with executive summaries, key metrics, and actionable insights.",
  },
  {
    id: "technical",
    name: "Technical",
    description: "Detailed explanations and code examples",
    icon: <Code className="w-4 h-4" />,
    prompt: "Create technical slides with detailed explanations, code examples, and implementation details.",
  },
  {
    id: "creative",
    name: "Creative",
    description: "Storytelling and engaging narratives",
    icon: <Palette className="w-4 h-4" />,
    prompt: "Create creative slides with storytelling elements, engaging narratives, and visual metaphors.",
  },
  {
    id: "scientific",
    name: "Scientific",
    description: "Research-based content and data analysis",
    icon: <Microscope className="w-4 h-4" />,
    prompt: "Create scientific slides with research-based content, data analysis, and evidence-based conclusions.",
  },
  {
    id: "workshop",
    name: "Workshop",
    description: "Interactive content and hands-on activities",
    icon: <Wand2 className="w-4 h-4" />,
    prompt: "Create workshop slides with interactive content, hands-on activities, and practical exercises.",
  },
]

function stripBackticks(jsonStr: string): string {
  return jsonStr
    .replace(/^```json\s*/i, '') // removes ```json at the start
    .replace(/```$/i, '');       // removes ``` at the end
}

function convertListToObject(list: any[]): string {
 var res="";

 if( !Array.isArray(list) || list.length === 0) {
    return res;
  }

  // Convert each item in the list to a string and join with newlines
 list?.map((item, index) => {
    res+=item+"\n"
 });


 return res;
}

export function AIAssistantPanel({
  slides,
  currentSlide,
  selectedElement,
  onGenerateSlides,
  onUpdateSlide,
  onUpdateElement,
  onAddElement,
}: AIAssistantPanelProps) {
  const { settings, currentProvider, isConfigured, isLoading } = useAISettings()
  const [showSettings, setShowSettings] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const SlideCountArray=[ 1,3, 5, 8, 10, 15];
  // Slide Generation State
  const [topic, setTopic] = useState("")
  const [slideCount, setSlideCount] = useState(5)
  const [audience, setAudience] = useState("general")
  const [selectedTemplate, setSelectedTemplate] = useState("educational")
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)
  const [customPrompt, setCustomPrompt] = useState("")

  // Content Enhancement State
  const [enhancementType, setEnhancementType] = useState("improve")
  const [enhancementInstructions, setEnhancementInstructions] = useState("")

  // Quiz Generation State
  const [quizTopic, setQuizTopic] = useState("")
  const [quizDifficulty, setQuizDifficulty] = useState("medium")
  const [questionCount, setQuestionCount] = useState(3)

  // Convert AI response to proper slide elements
  const convertAIResponseToSlides = (aiResponse: any): Slide[] => {
    try {
      const slidesData = aiResponse.slides || [aiResponse]
      const filteredcontent= JSON.parse(stripBackticks(slidesData[0].elements[0].content));
      console.log("Filtered Content",filteredcontent);
       console.log("Slide Data",slidesData);
         return filteredcontent.slides.map((slideData: any, index: number) => {
          const slide: Slide = {
          id: slideData.id || `slide-${Date.now()}-${index}`,
          title: slideData.title || `AI Generated Slide ${index + 1}`,
          summary: slideData.summary || "",
          elements: [],
          transcript: slideData.transcript || slideData.speakerNotes || "",
          backgroundColor: "#ffffff",
          }

        // Convert elements from AI response to proper SlideElement objects
        if (slideData.elements && Array.isArray(slideData.elements)) {
           // Map each element to SlideElement format
          slide.elements = slideData.elements.map((element: any, elemIndex: number) => {
            const slideElement: SlideElement = {
              id: element.id || `el-${Date.now()}-${index}-${elemIndex}`,
              type: element.type || "text",
              content: element.type==="list"?convertListToObject(element.content):JSON.stringify(element.content) || "",
              x: element.position?.x || 50 + elemIndex * 20,
              y: element.position?.y || 100 + elemIndex * 80,
              width: element.width || (element.type === "image" ? 300 : 400),
              height: element.height || (element.type === "image" ? 200 : "auto"),
              fontSize: element.fontSize || 16,
              color: element.color || "#000000",
              backgroundColor: element.backgroundColor || "rgba(255, 255, 255, 0.9)",
            }
             // Handle quiz elements specially
            if (element.type === "quiz" && slideData.suggestedQuiz) {
              slideElement.content = JSON.stringify(slideData.suggestedQuiz)
              slideElement.width = 400
              slideElement.height = 250
            }

            return slideElement
          })
        } else {
          // If no elements provided, create a default text element with the content
          const content = slideData.content || slideData.text || "AI generated content"
          slide.elements.push({
            id: `el-${Date.now()}-${index}-0`,
            type: "text",
            content: content,
            x: 50,
            y: 100,
            width: 500,
            height: "auto",
            fontSize: 16,
            color: "#000000",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
          })
        }

        // Add quiz element if suggested
        if (slideData.suggestedQuiz && !slide.elements.some((el) => el.type === "quiz")) {
          slide.elements.push({
            id: `el-${Date.now()}-${index}-quiz`,
            type: "quiz",
            content: JSON.stringify(slideData.suggestedQuiz),
            x: 50,
            y: slide.elements.length > 0 ? 300 : 100,
            width: 400,
            height: 250,
            fontSize: 14,
            color: "#000000",
            backgroundColor: "rgba(240, 240, 255, 0.9)",
          })
        }

        return slide
      })
    } catch (error) {
      console.error("Error converting AI response to slides:", error)
      // Return a fallback slide
      return [
        {
          id: `slide-${Date.now()}`,
          title: "AI Generated Content",
          summary: "Generated slide content",
          elements: [
            {
              id: `el-${Date.now()}`,
              type: "text",
              content: typeof aiResponse === "string" ? aiResponse : JSON.stringify(aiResponse, null, 2),
              x: 50,
              y: 100,
              width: 500,
              height: "auto",
              fontSize: 16,
              color: "#000000",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
            },
          ],
          transcript: "AI generated content",
          backgroundColor: "#ffffff",
        },
      ]
    }
  }

  const handleGenerateSlides = async () => {
    if (!isConfigured || !topic.trim()) return

    setIsGenerating(true)
    try {
      const selectedTemplateData = SLIDE_TEMPLATES.find((t) => t.id === selectedTemplate)
      const promptToUse = useCustomPrompt ? customPrompt : selectedTemplateData?.prompt
      
      const response = await fetch("/api/generate-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key":settings.apiKeys[settings.provider] || "" },
                body: JSON.stringify({
          topic: topic.trim(),
          slideCount,
          audience,
          style: selectedTemplate,
          provider: settings.provider,
          model: settings.model,
          customPrompt: promptToUse,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate slides")
      }

      const data = await response.json()
//       const data= {
//     "slides": [
//         {
//             "title": "Introduction to react js",
//             "summary": "AI-generated content",
//             "elements": [
//                 {
//                     "type": "text",
//                     "content": "```json\n{\n  \"slides\": [\n    {\n      \"id\": \"slide-1\",\n      \"title\": \"React.js: A Dynamic Introduction\",\n      \"summary\": \"Get ready to explore the world of React.js!\",\n      \"elements\": [\n        {\n          \"id\": \"el-1\",\n          \"type\": \"text\",\n          \"content\": \"Welcome to the exciting journey of learning React.js!\",\n          \"x\": 50,\n          \"y\": 100,\n          \"fontSize\": 32,\n          \"color\": \"#FFFFFF\"\n        },\n        {\n          \"id\": \"el-2\",\n          \"type\": \"text\",\n          \"content\": \"This course will guide you through the fundamental concepts and practical applications of React.js.\",\n          \"x\": 50,\n          \"y\": 200,\n          \"fontSize\": 20,\n          \"color\": \"#FFFFFF\"\n        }\n      ],\n      \"backgroundImage\": \"https://images.unsplash.com/photo-1505691938895-1758d7feb511?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGJhY2tncm91bmQlMjBjb2xvcnN8ZW58MHx8MHx8fDA%3D&w=1000&q=80\",\n      \"transition\": \"slide\",\n      \"transitionSpeed\": \"fast\"\n    },\n    {\n      \"id\": \"slide-2\",\n      \"title\": \"What is React.js?\",\n      \"summary\": \"Understanding the basics of React.js and its purpose.\",\n      \"elements\": [\n        {\n          \"id\": \"el-3\",\n          \"type\": \"text\",\n          \"content\": \"React.js is a powerful JavaScript library for building user interfaces (UIs).\",\n          \"x\": 50,\n          \"y\": 100,\n          \"fontSize\": 28,\n          \"color\": \"#FFFFFF\"\n        },\n        {\n          \"id\": \"el-4\",\n          \"type\": \"list\",\n          \"content\": \"Key Features:\\n- Component-Based Architecture\\n- Declarative Programming\\n- Efficient Updates with Virtual DOM\",\n          \"x\": 50,\n          \"y\": 180,\n          \"fontSize\": 22,\n          \"color\": \"#FFFFFF\"\n        }\n      ],\n      \"backgroundImage\": \"https://images.unsplash.com/photo-1519682337058-a94d5a3034e4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8Y29sb3JlZCUyMGJhY2tncm91bmR8ZW58MHx8MHx8fDA%3D&w=1000&q=80\",\n      \"transition\": \"slide\",\n      \"transitionSpeed\": \"fast\"\n    },\n    {\n      \"id\": \"slide-3\",\n      \"title\": \"Components: The Building Blocks\",\n      \"summary\": \"Exploring the fundamental concept of components in React.js.\",\n      \"elements\": [\n        {\n          \"id\": \"el-5\",\n          \"type\": \"text\",\n          \"content\": \"Components are reusable, independent parts of a UI.\",\n          \"x\": 50,\n          \"y\": 100,\n          \"fontSize\": 28,\n          \"color\": \"#FFFFFF\"\n        },\n        {\n          \"id\": \"el-6\",\n          \"type\": \"list\",\n          \"content\": \"Two Types of Components:\\n- Functional Components (using functions)\\n- Class Components (using ES6 classes)\",\n          \"x\": 50,\n          \"y\": 180,\n          \"fontSize\": 22,\n          \"color\": \"#FFFFFF\"\n        },\n        {\n          \"id\": \"el-7\",\n          \"type\": \"text\",\n          \"content\": \"Components allow for modular and maintainable code.\",\n          \"x\": 50,\n          \"y\": 300,\n          \"fontSize\": 22,\n          \"color\": \"#FFFFFF\"\n        }\n      ],\n      \"backgroundImage\": \"https://images.unsplash.com/photo-1531297484003-eeef8e3d48c7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGNvbG9yZSUyMGJhY2tncm91bmR8ZW58MHx8MHx8fDA%3D&w=1000&q=80\",\n      \"transition\": \"slide\",\n      \"transitionSpeed\": \"fast\"\n    },\n    {\n      \"id\": \"slide-4\",\n      \"title\": \"JSX: JavaScript XML\",\n      \"summary\": \"Understanding JSX syntax for writing UI components.\",\n      \"elements\": [\n        {\n          \"id\": \"el-8\",\n          \"type\": \"text\",\n          \"content\": \"JSX is a syntax extension to JavaScript that allows you to write HTML-like code in your JavaScript files.\",\n          \"x\": 50,\n          \"y\": 100,\n          \"fontSize\": 24,\n          \"color\": \"#FFFFFF\"\n        },\n        {\n          \"id\": \"el-9\",\n          \"type\": \"text\",\n          \"content\": \"Example: \\n`const element = <h1>Hello, world!</h1>;`\",\n          \"x\": 50,\n          \"y\": 200,\n          \"fontSize\": 22,\n          \"color\": \"#FFFFFF\"\n        },\n        {\n          \"id\": \"el-10\",\n          \"type\": \"text\",\n          \"content\": \"JSX gets transformed into regular JavaScript function calls.\",\n          \"x\": 50,\n          \"y\": 300,\n          \"fontSize\": 22,\n          \"color\": \"#FFFFFF\"\n        }\n      ],\n      \"backgroundImage\": \"https://images.unsplash.com/photo-1587560694229-67df47753cb9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGNvbG9yZSUyMGJhY2tncm91bmR8ZW58MHx8MHx8fDA%3D&w=1000&q=80\",\n      \"transition\": \"slide\",\n      \"transitionSpeed\": \"fast\"\n    },\n    {\n      \"id\": \"slide-5\",\n      \"title\": \"Knowledge Check!\",\n      \"summary\": \"Test your understanding of React.js basics.\",\n      \"elements\": [\n        {\n          \"id\": \"el-11\",\n          \"type\": \"text\",\n          \"content\": \"Question: What is the primary purpose of React.js?\",\n          \"x\": 50,\n          \"y\": 100,\n          \"fontSize\": 24,\n          \"color\": \"#FFFFFF\"\n        },\n        {\n          \"id\": \"el-12\",\n          \"type\": \"list\",\n          \"content\": \"Options:\\nA) Building server-side applications\\nB) Creating user interfaces\\nC) Managing databases\\nD) Styling web pages\",\n          \"x\": 50,\n          \"y\": 180,\n          \"fontSize\": 22,\n          \"color\": \"#FFFFFF\"\n        },\n        {\n          \"id\": \"el-13\",\n          \"type\": \"text\",\n          \"content\": \"Correct Answer: B\",\n          \"x\": 50,\n          \"y\": 300,\n          \"fontSize\": 22,\n          \"color\": \"#FFFFFF\"\n        }\n      ],\n      \"backgroundImage\": \"https://images.unsplash.com/photo-1555952517-2e8e729e0b44?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGNvbG9yZSUyMGJhY2tncm91bmR8ZW58MHx8MHx8fDA%3D&w=1000&q=80\",\n      \"transition\": \"slide\",\n      \"transitionSpeed\": \"fast\"\n    }\n  ],\n  \"exportedAt\": \"2025-10-27T10:00:00.000Z\",\n  \"format\": \"slide-editor-v2\",\n  \"version\": \"2.0.0\"\n}\n```",
//                     "position": {
//                         "x": 50,
//                         "y": 100
//                     }
//                 }
//             ],
//             "transcript": "Generated content about Introduction to react js"
//         }
//     ]
// }
      console.log("AI Response received:", data)

      // Convert AI response to proper slides
      const generatedSlides = convertAIResponseToSlides(data)
       console.log("Converted slides:", generatedSlides)

      // Add slides to the editor
      onGenerateSlides(generatedSlides)

      // Reset form
      setTopic("")
      setSlideCount(5)
    } catch (error) {
      console.error("Error generating slides:", error)
      alert(`Failed to generate slides: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEnhanceContent = async () => {
    if (!isConfigured || !selectedElement) return

    setIsEnhancing(true)
    try {
      const response = await fetch("/api/enhance-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: selectedElement.content,
          type: enhancementType,
          instructions: enhancementInstructions,
          elementType: selectedElement.type,
          provider: settings.provider,
          model: settings.model,
          apiKey: settings.apiKeys[settings.provider],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to enhance content")
      }

      const data = await response.json()
      onUpdateElement(selectedElement.id, { content: data.enhancedContent })
      setEnhancementInstructions("")
    } catch (error) {
      console.error("Error enhancing content:", error)
      alert(`Failed to enhance content: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleGenerateQuiz = async () => {
    if (!isConfigured) return

    setIsGeneratingQuiz(true)
    try {
      const contentToUse = quizTopic.trim() || currentSlide.transcript || currentSlide.title

      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: contentToUse,
          difficulty: quizDifficulty,
          questionCount,
          provider: settings.provider,
          model: settings.model,
          apiKey: settings.apiKeys[settings.provider],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate quiz")
      }

      const data = await response.json()

      // Add quiz element to current slide
      onAddElement({
        type: "quiz",
        content: JSON.stringify(data.quiz),
        x: 50,
        y: 200,
        width: 400,
        height: 250,
        fontSize: 14,
        color: "#000000",
        backgroundColor: "rgba(240, 240, 255, 0.9)",
      })

      setQuizTopic("")
    } catch (error) {
      console.error("Error generating quiz:", error)
      alert(`Failed to generate quiz: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsGeneratingQuiz(false)
    }
  }

  if (isLoading) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">AI Assistant</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Provider Status */}
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentProvider.icon}</span>
            <div>
              <p className="text-sm font-medium">{currentProvider.name}</p>
              <p className="text-xs text-gray-500">{settings.model}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isConfigured ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Ready
                </Badge>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  No API Key
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-3 m-4">
            <TabsTrigger value="generate" className="text-xs">
              Generate
            </TabsTrigger>
            <TabsTrigger value="enhance" className="text-xs">
              Enhance
            </TabsTrigger>
            <TabsTrigger value="quiz" className="text-xs">
              Quiz
            </TabsTrigger>
          </TabsList>

          {/* Generate Slides Tab */}
          <TabsContent value="generate" className="p-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Generate Slides
                </CardTitle>
                <CardDescription>Create slides automatically with AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Introduction to React Hooks"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="slideCount">Slides</Label>
                    <Select value={slideCount.toString()} onValueChange={(v) => setSlideCount(Number.parseInt(v))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SlideCountArray.map((count) => (
                          <SelectItem key={count} value={count.toString()}>
                            {count} slides
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="audience">Audience</Label>
                    <Select value={audience} onValueChange={setAudience}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Style Template</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {SLIDE_TEMPLATES.map((template) => (
                      <Button
                        key={template.id}
                        variant={selectedTemplate === template.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTemplate(template.id)}
                        className="h-auto p-2 flex flex-col items-center gap-1"
                      >
                        {template.icon}
                        <span className="text-xs">{template.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="customPrompt" checked={useCustomPrompt} onCheckedChange={setUseCustomPrompt} />
                    <Label htmlFor="customPrompt" className="text-sm">
                      Use Custom Prompt
                    </Label>
                  </div>
                  {useCustomPrompt && (
                    <Textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Describe exactly how you want the slides to be created..."
                      className="min-h-[80px] text-sm"
                    />
                  )}
                </div>

                <Button
                  onClick={handleGenerateSlides}
                  disabled={!isConfigured || !topic.trim() || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate {slideCount} Slides
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhance Content Tab */}
          <TabsContent value="enhance" className="p-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Enhance Content
                </CardTitle>
                <CardDescription>Improve selected element with AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedElement ? (
                  <>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium mb-1">Selected Element:</p>
                      <p className="text-xs text-gray-600 capitalize">{selectedElement.type}</p>
                      <p className="text-sm mt-2 line-clamp-3">{selectedElement.content}</p>
                    </div>

                    <div>
                      <Label htmlFor="enhancementType">Enhancement Type</Label>
                      <Select value={enhancementType} onValueChange={setEnhancementType}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="improve">Improve Writing</SelectItem>
                          <SelectItem value="expand">Expand Content</SelectItem>
                          <SelectItem value="simplify">Simplify Language</SelectItem>
                          <SelectItem value="professional">Make Professional</SelectItem>
                          <SelectItem value="engaging">Make Engaging</SelectItem>
                          <SelectItem value="technical">Add Technical Details</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="instructions">Additional Instructions</Label>
                      <Textarea
                        id="instructions"
                        value={enhancementInstructions}
                        onChange={(e) => setEnhancementInstructions(e.target.value)}
                        placeholder="Any specific requirements..."
                        className="mt-1 min-h-[60px]"
                      />
                    </div>

                    <Button onClick={handleEnhanceContent} disabled={!isConfigured || isEnhancing} className="w-full">
                      {isEnhancing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enhancing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Enhance Content
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Select an element to enhance</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Generate Quiz Tab */}
          <TabsContent value="quiz" className="p-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Generate Quiz
                </CardTitle>
                <CardDescription>Create interactive quiz questions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="quizTopic">Topic (optional)</Label>
                  <Input
                    id="quizTopic"
                    value={quizTopic}
                    onChange={(e) => setQuizTopic(e.target.value)}
                    placeholder="Leave empty to use current slide content"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select value={quizDifficulty} onValueChange={setQuizDifficulty}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="questionCount">Questions</Label>
                    <Select
                      value={questionCount.toString()}
                      onValueChange={(v) => setQuestionCount(Number.parseInt(v))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((count) => (
                          <SelectItem key={count} value={count.toString()}>
                            {count}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleGenerateQuiz} disabled={!isConfigured || isGeneratingQuiz} className="w-full">
                  {isGeneratingQuiz ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Generate Quiz
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Settings Dialog */}
      <AISettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </div>
  )
}
