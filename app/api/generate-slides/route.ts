import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { google } from "@ai-sdk/google"
import { anthropic } from "@ai-sdk/anthropic"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { topic, slideCount, audience, style, provider, model, apiKey, customPrompt } = await request.json()
    // console.log("Request",await request.json());

    console.log("API Request received:", { provider, model, topic, slideCount })

    // Use custom prompt if provided, otherwise use default
const basePrompt =
  customPrompt ||
  `Create ${slideCount} slides about "${topic}" for a ${audience} audience in ${style} style.`

const prompt = `${basePrompt}

You are given raw notes or descriptions for one or more presentation slides.  
For each slide, transform the provided content into a JSON object with the following structure:

{
  "slides": [
    {
      "id": "slide-1",
      "title": "Welcome",
      "summary": "Introduction to the course",
      "elements": [
        {
          "id": "el-1",
          "type": "text",
          "content": "Welcome to the interactive course!",
          "x": 60,
          "y": 80,
          "fontSize": 24
        },
        {
          "id": "el-1755170266218",
          "type": "text",
          "content": "hi there this is the formula of the data",
          "x": 720,
          "y": 100,
          "width": 340,
          "height": 40,
          "fontSize": 16,
          "minWidth": 65,
          "minHeight": 30,
          "maxWidth": 800,
          "maxHeight": 600,
          "animation": "slideInLeft",
          "fragmentType": "highlight-current-green",
          "fragmentIndex": 3,
          "backgroundColor": "#a29090cc",
          "color": "#70c658"
        }
      ],
      "backgroundImage": "https://www.skyweaver.net/images/media/wallpapers/wallpaper1.jpg",
      "transition": "convex",
      "transitionSpeed": "fast"
    },
    {
      "id": "slide-2",
      "title": "Overview",
      "summary": "What you will learn",
      "elements": [
        {
          "id": "el-2",
          "type": "text",
          "content": "This course covers all the basics.",
          "x": 50,
          "y": 100,
          "fontSize": 18
        }
      ]
    }
  ],
  "exportedAt": "2025-08-14T11:20:47.679Z",
  "format": "slide-editor-v2",
  "version": "2.0.0"
}

Rules:
1. Title must be short, clear, and engaging.
2. Summary should capture the essence of the slide in one sentence.
3. Include 2–4 main elements per slide; choose:
   - "text" for paragraphs
   - "list" for bullet points
  - "image" for images (content = image URL or path) (you can provide any image Url which is related to content and present on the internet).
4. Position should be realistic coordinates for placing content on a slide UI (example: {"x": 50, "y": 100}).
5. Transcript should be a smooth, conversational explanation expanding on the content.
6. Suggested quiz must be directly based on the content and have only one correct answer.
7. Output only valid JSON; no extra commentary.
8. Make the background visually appealing, using colors or images that match the theme.
10. Ensure the JSON structure is valid and can be parsed without errors.
11. If you cannot generate a slide, return an empty array for slides.
12 Don not generate any image .
---

Example Input:
Slide 1 Notes:
"Topic: Solar Energy. Benefits: renewable, reduces carbon footprint, low operating cost. Main challenge: depends on sunlight availability. Include a quick quiz on which country uses the most solar power. Show image of a solar farm."

Example Output:
{
  "slides": [
    {
      "id": "slide-1",
      "title": "Welcome",
      "summary": "Introduction to the course",
      "elements": [
        {
          "id": "el-1",
          "type": "text",
          "content": "Welcome to the interactive course!",
          "x": 60,
          "y": 80,
          "fontSize": 24
        },
        {
          "id": "el-1755170266218",
          "type": "text",
          "content": "hi there this is the formula of the data",
          "x": 720,
          "y": 100,
          "width": 340,
          "height": 40,
          "fontSize": 16,
          "minWidth": 65,
          "minHeight": 30,
          "maxWidth": 800,
          "maxHeight": 600,
          "animation": "slideInLeft",
          "fragmentType": "highlight-current-green",
          "fragmentIndex": 3,
          "backgroundColor": "#a29090cc",
          "color": "#70c658"
        }
      ],
      "backgroundImage": "https://www.skyweaver.net/images/media/wallpapers/wallpaper1.jpg",
      "transition": "convex",
      "transitionSpeed": "fast"
    },
    {
      "id": "slide-2",
      "title": "Overview",
      "summary": "What you will learn",
      "elements": [
        {
          "id": "el-2",
          "type": "text",
          "content": "This course covers all the basics.",
          "x": 50,
          "y": 100,
          "fontSize": 18
        }
      ]
    }
  ],
  "exportedAt": "2025-08-14T11:20:47.679Z",
  "format": "slide-editor-v2",
  "version": "2.0.0"
}

return the response as the above format , and do remember the ${topic} is the topic of the slide and you have to generate the number of slides as ${slideCount} and the audience is ${audience} and the style is ${style} make it fancy as much as possible and give the background color to each slides don't keep it white.

`


    let aiModel
    try {
      switch (provider) {
        case "openai":
          aiModel = openai(model, { apiKey })
          break
        case "google":
          aiModel = google(model, { apiKey })
          break
        case "anthropic":
          aiModel = anthropic(model, { apiKey })
          break
        default:
          return NextResponse.json({ error: "Unsupported AI provider" }, { status: 400 })
      }

      console.log("Using AI model:", provider, model)

      const { text } = await generateText({
        model: google("gemini-2.0-flash"),
        prompt,
        temperature: 0.7,
      })

      console.log("AI response received, length:", text.length)

      // Parse the AI response
      let slidesData
      try {
        slidesData = JSON.parse(text)
      } catch (parseError) {
        console.log("JSON parsing failed, creating fallback structure")
        // If JSON parsing fails, create a fallback structure
        slidesData = {
          slides: [
            {
              title: topic,
              summary: "AI-generated content",
              elements: [
                {
                  type: "text",
                  content: text,
                  position: { x: 50, y: 100 },
                },
              ],
              transcript: `Generated content about ${topic}`,
            },
          ],
        }
      }

      return NextResponse.json(slidesData)
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
    console.error("Error generating slides:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate slides",
      },
      { status: 500 },
    )
  }
}
