"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Save, RotateCcw, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import { useAISettings } from "@/hooks/use-ai-settings"

interface AISettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AISettingsDialog({ open, onOpenChange }: AISettingsDialogProps) {
  const { settings, providers, currentProvider, updateProvider, updateModel, updateApiKey, resetSettings } =
    useAISettings()
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [tempApiKeys, setTempApiKeys] = useState<Record<string, string>>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const handleProviderChange = (providerId: string) => {
    updateProvider(providerId)
    setHasUnsavedChanges(true)
  }

  const handleModelChange = (model: string) => {
    updateModel(model)
    setHasUnsavedChanges(true)
  }

  const handleApiKeyChange = (providerId: string, apiKey: string) => {
    setTempApiKeys((prev) => ({ ...prev, [providerId]: apiKey }))
    setHasUnsavedChanges(true)
  }

  const handleSaveApiKeys = () => {
    Object.entries(tempApiKeys).forEach(([providerId, apiKey]) => {
      updateApiKey(providerId, apiKey)
    })
    setTempApiKeys({})
    setHasUnsavedChanges(false)
  }

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all AI settings? This will remove all API keys.")) {
      resetSettings()
      setTempApiKeys({})
      setHasUnsavedChanges(false)
    }
  }

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }))
  }

  const getApiKeyValue = (providerId: string) => {
    return tempApiKeys[providerId] ?? settings.apiKeys[providerId] ?? ""
  }

  const isProviderConfigured = (providerId: string) => {
    return !!(settings.apiKeys[providerId] || tempApiKeys[providerId])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">{currentProvider.icon}</span>
            AI Settings & Configuration
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="providers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="providers">Providers & API Keys</TabsTrigger>
            <TabsTrigger value="models">Models & Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">AI Providers</h3>
                <div className="grid gap-3">
                  {providers.map((provider) => (
                    <Card
                      key={provider.id}
                      className={`cursor-pointer transition-all ${
                        settings.provider === provider.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleProviderChange(provider.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{provider.icon}</span>
                            <div>
                              <h4 className="font-medium">{provider.name}</h4>
                              <p className="text-sm text-gray-500">{provider.models.length} models available</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isProviderConfigured(provider.id) ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Configured
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                No API Key
                              </Badge>
                            )}
                            {settings.provider === provider.id && <Badge variant="default">Active</Badge>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">API Keys</h3>
                <div className="space-y-4">
                  {providers.map((provider) => (
                    <div key={provider.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`api-key-${provider.id}`} className="flex items-center gap-2">
                          <span className="text-lg">{provider.icon}</span>
                          {provider.name} API Key
                        </Label>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => toggleApiKeyVisibility(provider.id)}>
                            {showApiKeys[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const urls = {
                                openai: "https://platform.openai.com/api-keys",
                                google: "https://aistudio.google.com/app/apikey",
                                anthropic: "https://console.anthropic.com/settings/keys",
                              }
                              window.open(urls[provider.id as keyof typeof urls], "_blank")
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <Input
                        id={`api-key-${provider.id}`}
                        type={showApiKeys[provider.id] ? "text" : "password"}
                        value={getApiKeyValue(provider.id)}
                        onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                        placeholder={`Enter your ${provider.name} API key...`}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500">Get your API key from the {provider.name} dashboard</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="models" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Current Configuration</h3>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{currentProvider.icon}</span>
                        <div>
                          <h4 className="font-medium">{currentProvider.name}</h4>
                          <p className="text-sm text-gray-500">Active Provider</p>
                        </div>
                      </div>
                      <Badge variant="default">{settings.model}</Badge>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="model-select">Model</Label>
                        <Select value={settings.model} onValueChange={handleModelChange}>
                          <SelectTrigger id="model-select" className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {currentProvider.models.map((model) => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Available Models</h3>
                <div className="space-y-3">
                  {providers.map((provider) => (
                    <Card key={provider.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <span className="text-lg">{provider.icon}</span>
                          {provider.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {provider.models.map((model) => (
                            <Badge
                              key={model}
                              variant={
                                settings.provider === provider.id && settings.model === model ? "default" : "secondary"
                              }
                              className="cursor-pointer"
                              onClick={() => {
                                handleProviderChange(provider.id)
                                handleModelChange(model)
                              }}
                            >
                              {model}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleReset} className="text-red-600 hover:text-red-700 bg-transparent">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveApiKeys} disabled={!hasUnsavedChanges}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
