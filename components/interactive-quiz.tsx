"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle } from "lucide-react"

interface QuizData {
  question: string
  options: string[]
  correct: number
}

interface InteractiveQuizProps {
  content: string
  isPreviewMode: boolean
}

export function InteractiveQuiz({ content, isPreviewMode }: InteractiveQuizProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)

  let quizData: QuizData
  try {
    quizData = JSON.parse(content)
  } catch {
    quizData = {
      question: "Sample Question?",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correct: 0,
    }
  }

  const handleAnswerSelect = (index: number) => {
    if (!isPreviewMode) return

    setSelectedAnswer(index)
    setShowResult(true)

    // Auto-hide result after 3 seconds
    setTimeout(() => {
      setShowResult(false)
      setSelectedAnswer(null)
    }, 3000)
  }

  const resetQuiz = () => {
    setSelectedAnswer(null)
    setShowResult(false)
  }

  return (
    <Card className="p-6 border-2 border-purple-200 bg-purple-50">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Interactive Quiz
          </Badge>
          {showResult && (
            <Button variant="outline" size="sm" onClick={resetQuiz}>
              Try Again
            </Button>
          )}
        </div>

        <h3 className="text-lg font-semibold text-gray-900">{quizData.question}</h3>

        <div className="space-y-2">
          {quizData.options.map((option, index) => {
            const isSelected = selectedAnswer === index
            const isCorrect = index === quizData.correct
            const showCorrectAnswer = showResult && isCorrect
            const showWrongAnswer = showResult && isSelected && !isCorrect

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={!isPreviewMode || showResult}
                className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                  showCorrectAnswer
                    ? "bg-green-100 border-green-300 text-green-800"
                    : showWrongAnswer
                      ? "bg-red-100 border-red-300 text-red-800"
                      : isSelected
                        ? "bg-blue-100 border-blue-300 text-blue-800"
                        : "bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-25"
                } ${!isPreviewMode ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showResult && (
                    <div className="flex items-center">
                      {isCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {showWrongAnswer && <XCircle className="w-5 h-5 text-red-600" />}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {showResult && (
          <div
            className={`p-3 rounded-lg ${
              selectedAnswer === quizData.correct ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {selectedAnswer === quizData.correct
              ? "🎉 Correct! Well done!"
              : `❌ Incorrect. The correct answer is: ${quizData.options[quizData.correct]}`}
          </div>
        )}

        {!isPreviewMode && (
          <div className="text-sm text-gray-500 italic">Switch to Preview mode to interact with this quiz</div>
        )}
      </div>
    </Card>
  )
}
