"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { StatusBar } from "@/components/status-bar"
import { ChatView } from "@/components/chat-view"
import { ToolsPanel } from "@/components/tools-panel"
import { useAgent } from "@/lib/use-agent"
import type { ToolConfig } from "@/lib/types"

const PREFERRED = ["kaith_fast:latest","qwen3:8b", "gemma4:12b", "gemma3:12b"]

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function Console() {
  const { data: modelsData, isLoading: modelsLoading, mutate: refetchModels } = useSWR<{
    models: string[]
    error?: string
  }>("/api/models", fetcher, { revalidateOnFocus: false })

  const { data: toolsData } = useSWR<{ config: ToolConfig; error?: string }>("/api/tools", fetcher, {
    revalidateOnFocus: false,
  })

  const models = modelsData?.models ?? []
  const isConnected = !!modelsData && !modelsData.error

  const [config, setConfig] = useState<ToolConfig | null>(null)
  const [model, setModel] = useState<string>(PREFERRED[0])

  // Adopt config loaded from tools.json (only until the user edits it in-app).
  useEffect(() => {
    if (toolsData?.config && !config) setConfig(toolsData.config)
  }, [toolsData, config])

  // Pick a sensible default model once the list is available.
  useEffect(() => {
    if (models.length === 0) return
    setModel((current) => {
      if (models.includes(current)) return current
      const preferred = PREFERRED.find((p) => models.includes(p))
      return preferred ?? models[0]
    })
  }, [models])

  const agent = useAgent(config, model, setConfig)

  return (
    <div className="flex h-dvh flex-col bg-background">
      <StatusBar
        connected={isConnected}
        connecting={modelsLoading}
        models={models}
        model={model}
        onModelChange={setModel}
        onRefresh={() => refetchModels()}
      />

      {!isConnected && !modelsLoading && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-300">
          {modelsData?.error ??
            "No se detecta Ollama. Ejecuta la app localmente con 'ollama serve' activo (localhost:11434)."}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="min-h-0 flex-1 border-b border-border md:border-b-0 md:border-r">
          <ChatView
            messages={agent.messages}
            busy={agent.busy}
            error={agent.error}
            confirm={agent.confirm ? { toolName: agent.confirm.toolName, command: agent.confirm.command } : null}
            disabled={!isConnected || !config}
            onSend={agent.send}
            onReset={agent.reset}
            onResolveConfirm={agent.resolveConfirm}
          />
        </div>
        <aside className="min-h-0 md:w-[380px] md:shrink-0">
          <ToolsPanel config={config} onApply={setConfig} />
        </aside>
      </div>
    </div>
  )
}
