import { generateText } from "ai"
import { createOpenAI, openai } from "@ai-sdk/openai"
import { createGoogleGenerativeAI, google } from "@ai-sdk/google"
import { anthropic, createAnthropic } from "@ai-sdk/anthropic"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { content, difficulty, questionCount, provider, model, apiKey } = await request.json()

    console.log("Quiz generation request:", { provider, model, difficulty, questionCount })

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    const prompt = `Create ${questionCount} multiple-choice quiz question(s) based on this content at ${difficulty} difficulty level:

"${content}"

Format as JSON with this exact structure:
{
  "question": "Question text here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": 0,
  "explanation": "Brief explanation of why this is correct"
}

For multiple questions, use this structure:
{
  "questions": [
    {
      "question": "Question 1?",
      "options": ["A", "B", "C", "D"],
      "correct": 0,
      "explanation": "Explanation"
    }
  ]
}

Make sure:
- Questions are clear and unambiguous
- All options are plausible
- Correct answer index is accurate (0-based)
- Difficulty matches the requested level: ${difficulty}
- Content is educational and appropriate`

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

      console.log("Using AI model for quiz generation:", provider, model)

      const { text } = await generateText({
        model: aiModel,
        prompt,
        temperature: 0.8,
      })

      console.log("Quiz generation completed, response length:", text.length)

      // Parse the AI response
      let quizData
      try {
        quizData = JSON.parse(text)

        // Handle single question vs multiple questions
        if (quizData.question && !quizData.questions) {
          // Single question format
          quizData = {
            quiz: quizData,
          }
        } else if (quizData.questions) {
          // Multiple questions - use first one for now
          quizData = {
            quiz: quizData.questions[0],
          }
        }
      } catch (parseError) {
        console.log("JSON parsing failed for quiz, creating fallback")
        // Create a fallback quiz
        quizData = {
          quiz: {
            question: "What is the main topic of this content?",
            options: ["Option A", "Option B", "Option C", "Option D"],
            correct: 0,
            explanation: "Based on the provided content.",
          },
        }
      }

      return NextResponse.json(quizData)
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
    console.error("Error generating quiz:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate quiz",
      },
      { status: 500 },
    )
  }
}
