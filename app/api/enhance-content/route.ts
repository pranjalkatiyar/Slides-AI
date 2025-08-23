import { generateText } from "ai"
import { createOpenAI, openai } from "@ai-sdk/openai"
import { createGoogleGenerativeAI, google } from "@ai-sdk/google"
import { anthropic, createAnthropic } from "@ai-sdk/anthropic"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { content, type, instructions, elementType, provider, model, apiKey } = await request.json()

    console.log("Content enhancement request:", { provider, model, type, elementType })

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    const enhancementPrompts = {
      improve: "Improve the writing quality, clarity, and flow of this content while maintaining its core message.",
      expand: "Expand this content with more details, examples, and comprehensive information.",
      simplify: "Simplify this content to make it easier to understand for a broader audience.",
      professional: "Rewrite this content in a more professional and formal tone.",
      engaging: "Make this content more engaging, interesting, and compelling for the audience.",
      technical: "Add more technical details, specifications, and in-depth information to this content.",
    }

    const basePrompt = enhancementPrompts[type as keyof typeof enhancementPrompts] || enhancementPrompts.improve

    const prompt = `${basePrompt}

Original content (${elementType} element):
"${content}"

${instructions ? `Additional instructions: ${instructions}` : ""}

Please provide only the enhanced content without any explanations or formatting markers. Keep it suitable for a ${elementType} element in a presentation slide.`

    let aiModel
    try {
      switch (provider) {
        case "openai":
          const openai=createOpenAI({
            apiKey: request.headers.get("x-api-key") ?? undefined
          });
          aiModel = openai(model)
          break
        case "google":
          const google=createGoogleGenerativeAI({
            apiKey: request.headers.get("x-api-key") ?? undefined
          })
          aiModel = google(model)
          break
        case "anthropic":
          const anthropic =createAnthropic({
            apiKey: request.headers.get("x-api-key") ?? undefined
          });
          aiModel = anthropic(model)
          break
        default:
          return NextResponse.json({ error: "Unsupported AI provider" }, { status: 400 })
      }

      console.log("Using AI model for enhancement:", provider, model)

      const { text } = await generateText({
        model: aiModel,
        prompt,
        temperature: 0.7,
      })

      console.log("Enhancement completed, response length:", text.length)

      return NextResponse.json({ enhancedContent: text.trim() })
    } catch (modelError) {
      console.error("AI model error:", modelError)
      return NextResponse.json(
        {
          error: `Failed to use ${provider} ${model}: ${modelError instanceof Error ? modelError.message : "Unknown error"}`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error enhancing content:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to enhance content",
      },
      { status: 500 },
    )
  }
}
