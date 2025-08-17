"use client"

import { useState, useEffect } from "react"

export interface AIProvider {
  id: string
  name: string
  models: string[]
  icon: string
}

export interface AISettings {
  provider: string
  model: string
  apiKeys: Record<string, string>
}

const AI_PROVIDERS: AIProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    icon: "🧠",
  },
  {
    id: "google",
    name: "Google Gemini",
    models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"],
    icon: "✨",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    models: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
    icon: "⚡",
  },
]

const DEFAULT_SETTINGS: AISettings = {
  provider: "openai",
  model: "gpt-4o",
  apiKeys: {},
}

export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ai-settings")
      if (saved) {
        const parsedSettings = JSON.parse(saved)
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings })
      }
    } catch (error) {
      console.error("Failed to load AI settings:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem("ai-settings", JSON.stringify(settings))
      } catch (error) {
        console.error("Failed to save AI settings:", error)
      }
    }
  }, [settings, isLoading])

  const updateProvider = (provider: string) => {
    const providerData = AI_PROVIDERS.find((p) => p.id === provider)
    if (providerData) {
      setSettings((prev) => ({
        ...prev,
        provider,
        model: providerData.models[0], // Set to first available model
      }))
    }
  }

  const updateModel = (model: string) => {
    setSettings((prev) => ({
      ...prev,
      model,
    }))
  }

  const updateApiKey = (provider: string, apiKey: string) => {
    setSettings((prev) => ({
      ...prev,
      apiKeys: {
        ...prev.apiKeys,
        [provider]: apiKey,
      },
    }))
  }

  const getApiKey = (provider?: string) => {
    const targetProvider = provider || settings.provider
    return settings.apiKeys[targetProvider] || ""
  }

  const getCurrentProvider = () => {
    return AI_PROVIDERS.find((p) => p.id === settings.provider) || AI_PROVIDERS[0]
  }

  const isConfigured = () => {
    return !!getApiKey()
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
    localStorage.removeItem("ai-settings")
  }

  return {
    settings,
    providers: AI_PROVIDERS,
    currentProvider: getCurrentProvider(),
    isLoading,
    isConfigured: isConfigured(),
    updateProvider,
    updateModel,
    updateApiKey,
    getApiKey,
    resetSettings,
  }
}
