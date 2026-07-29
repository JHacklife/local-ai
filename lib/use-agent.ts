"use client"

import { useCallback, useRef, useState } from "react"
import { renderCommand, validateToolConfig } from "./template"
import {
  CREATE_TOOL_NAME,
  MAX_WAIT_SECONDS,
  SEARCH_TOOL_NAME,
  SEQUENCE_TOOL_NAME,
  WAIT_TOOL_NAME,
  type SequenceStep,
} from "./builtins"
import type { ChatMessage, OllamaToolCall, ToolConfig, ToolDefinition } from "./types"

const MAX_STEPS = 6

const SYSTEM_PROMPT =
  "Eres un asistente que controla la computadora del usuario (Windows con NirCmd) mediante tools. " +
  "Cuando el usuario pida una acción que coincida con una tool disponible, llámala con los argumentos correctos. " +
  `Si NINGUNA tool actual cubre lo que pide, NO inventes comandos: primero usa "${SEARCH_TOOL_NAME}" ` +
  `para buscar el comando de NirCmd adecuado, luego usa "${CREATE_TOOL_NAME}" para crear la tool y, ` +
  "en el siguiente paso, llámala con los argumentos correctos. " +
  `Para varias acciones en orden usa "${SEQUENCE_TOOL_NAME}". ` +
  "Responde siempre en español y de forma breve."

type ConfirmRequest = {
  toolName: string
  command: string
  resolve: (approved: boolean) => void
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/** Split qwen-style <think>…</think> reasoning from the visible answer. */
function splitThinking(content: string): { content: string; thinking?: string } {
  const match = content.match(/<think>([\s\S]*?)<\/think>/i)
  if (!match) return { content: content.trim() }
  const thinking = match[1].trim()
  const visible = content.replace(/<think>[\s\S]*?<\/think>/i, "").trim()
  return { content: visible, thinking: thinking || undefined }
}

export function useAgent(
  config: ToolConfig | null,
  model: string,
  onConfigChange?: (config: ToolConfig) => void,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null)

  // Keep a live ref so async loops read the freshest config/model.
  const configRef = useRef(config)
  configRef.current = config
  const modelRef = useRef(model)
  modelRef.current = model
  const onConfigChangeRef = useRef(onConfigChange)
  onConfigChangeRef.current = onConfigChange

  const requestConfirm = useCallback((toolName: string, command: string) => {
    return new Promise<boolean>((resolve) => {
      setConfirm({
        toolName,
        command,
        resolve: (approved) => {
          setConfirm(null)
          resolve(approved)
        },
      })
    })
  }, [])

  const resolveConfirm = useCallback(
    (approved: boolean) => {
      confirm?.resolve(approved)
    },
    [confirm],
  )

  const callChat = useCallback(async (history: ChatMessage[]): Promise<ChatMessage> => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelRef.current,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
        tools: configRef.current?.tools ?? [],
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Error al hablar con el modelo.")
    return data.message as ChatMessage
  }, [])

  /** Client-side delay used by the wait_seconds built-in and sequence waits. */
  const runWait = useCallback((rawSeconds: unknown): Promise<ChatMessage> => {
    const seconds = Math.max(0, Math.min(MAX_WAIT_SECONDS, Number(rawSeconds) || 0))
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: uid(),
          role: "tool",
          tool_name: WAIT_TOOL_NAME,
          content: `Esperé ${seconds} segundo${seconds === 1 ? "" : "s"}.`,
        })
      }, seconds * 1000)
    })
  }, [])

  /** Render + confirm + execute a single user-defined tool. */
  const runSingleTool = useCallback(
    async (toolName: string, args: Record<string, unknown>): Promise<ChatMessage> => {
      const cfg = configRef.current
      const tool = cfg?.tools.find((t) => t.name === toolName)
      if (!cfg || !tool) {
        return {
          id: uid(),
          role: "tool",
          tool_name: toolName,
          content: `Error: la tool '${toolName}' no está definida.`,
        }
      }

      const command = renderCommand(tool.command, args, cfg.variables)

      // Mixed mode: safe tools auto-run, others require confirmation.
      const approved = tool.safe ? true : await requestConfirm(tool.name, command)
      if (!approved) {
        return {
          id: uid(),
          role: "tool",
          tool_name: tool.name,
          command,
          denied: true,
          content: "El usuario rechazó la ejecución de este comando.",
        }
      }

      try {
        const res = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command }),
        })
        const execResult = await res.json()
        const summary = execResult.error
          ? `Falló (código ${execResult.code}): ${execResult.error}\n${execResult.stderr || ""}`.trim()
          : execResult.stdout?.trim()
            ? execResult.stdout.trim()
            : `Comando ejecutado correctamente (código ${execResult.code}).`
        return {
          id: uid(),
          role: "tool",
          tool_name: tool.name,
          command,
          execResult,
          content: summary,
        }
      } catch (err) {
        return {
          id: uid(),
          role: "tool",
          tool_name: tool.name,
          command,
          content: `No se pudo ejecutar el comando: ${err instanceof Error ? err.message : String(err)}`,
        }
      }
    },
    [requestConfirm],
  )

  /** Search the NirCmd reference so the model can discover an unknown command. */
  const runSearch = useCallback(async (rawQuery: unknown): Promise<ChatMessage> => {
    const query = String(rawQuery ?? "").trim()
    if (!query) {
      return {
        id: uid(),
        role: "tool",
        tool_name: SEARCH_TOOL_NAME,
        content: "Indica qué acción quieres buscar en la referencia de NirCmd.",
      }
    }
    try {
      const res = await fetch(`/api/nircmd?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      const matches = Array.isArray(data.matches) ? data.matches : []
      if (matches.length === 0) {
        return {
          id: uid(),
          role: "tool",
          tool_name: SEARCH_TOOL_NAME,
          content: `No se encontraron comandos de NirCmd para "${query}".`,
        }
      }
      const lines = matches
        .map(
          (m: { command: string; syntax: string; description: string; safe: boolean }) =>
            `• ${m.command} — ${m.description}\n  sintaxis: ${m.syntax}\n  safe sugerido: ${m.safe}`,
        )
        .join("\n")
      return {
        id: uid(),
        role: "tool",
        tool_name: SEARCH_TOOL_NAME,
        content:
          `Comandos de NirCmd encontrados para "${query}":\n${lines}\n\n` +
          `Crea la tool con "${CREATE_TOOL_NAME}" (en 'command' pon solo los argumentos, con marcadores {param}).`,
      }
    } catch (err) {
      return {
        id: uid(),
        role: "tool",
        tool_name: SEARCH_TOOL_NAME,
        content: `No se pudo consultar la referencia de NirCmd: ${err instanceof Error ? err.message : String(err)}`,
      }
    }
  }, [])

  /** Create a new tool from a NirCmd command, persist it, and make it usable now. */
  const runCreateTool = useCallback(async (args: Record<string, unknown>): Promise<ChatMessage> => {
    const cfg = configRef.current
    if (!cfg) {
      return { id: uid(), role: "tool", tool_name: CREATE_TOOL_NAME, content: "No hay configuración cargada." }
    }

    const name = String(args.name ?? "").trim()
    const description = String(args.description ?? "").trim()
    let command = String(args.command ?? "").trim()
    const safe = args.safe === true || args.safe === "true"
    const parameters =
      args.parameters && typeof args.parameters === "object"
        ? (args.parameters as ToolDefinition["parameters"])
        : { type: "object" as const, properties: {} }

    if (!name || !command) {
      return {
        id: uid(),
        role: "tool",
        tool_name: CREATE_TOOL_NAME,
        content: "Faltan datos: se necesitan al menos 'name' y 'command'.",
      }
    }

    // Normalize the command so it always runs through the {nircmd} executable.
    command = command.replace(/^"?nircmd(?:c)?(?:\.exe)?"?\s+/i, "").trim()
    if (!command.includes("{nircmd}")) command = `{nircmd} ${command}`

    const newTool: ToolDefinition = {
      name,
      description: description || `Comando NirCmd: ${name}`,
      safe,
      parameters: parameters.type === "object" ? parameters : { type: "object", properties: {} },
      command,
    }

    // Replace an existing tool with the same name, otherwise append.
    const tools = cfg.tools.some((t) => t.name === name)
      ? cfg.tools.map((t) => (t.name === name ? newTool : t))
      : [...cfg.tools, newTool]
    const nextConfig: ToolConfig = { ...cfg, tools }

    const validationError = validateToolConfig(nextConfig)
    if (validationError) {
      return {
        id: uid(),
        role: "tool",
        tool_name: CREATE_TOOL_NAME,
        content: `La tool no es válida: ${validationError}. Corrige los datos y vuelve a intentarlo.`,
      }
    }

    // Update the live ref immediately so the very next step can call the tool.
    configRef.current = nextConfig
    onConfigChangeRef.current?.(nextConfig)

    // Persist to tools.json (best-effort; works when running locally).
    let persisted = true
    let persistError = ""
    try {
      const res = await fetch("/api/tools", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextConfig),
      })
      if (!res.ok) {
        persisted = false
        const data = await res.json().catch(() => ({}))
        persistError = data.error || `HTTP ${res.status}`
      }
    } catch (err) {
      persisted = false
      persistError = err instanceof Error ? err.message : String(err)
    }

    return {
      id: uid(),
      role: "tool",
      tool_name: CREATE_TOOL_NAME,
      toolCreated: newTool,
      command: newTool.command,
      content:
        `Tool "${name}" creada y lista para usar.` +
        (persisted ? " Guardada en tools.json." : ` (No se pudo guardar en tools.json: ${persistError})`),
    }
  }, [])

  /**
   * Resolve a single tool_call from the model into one or more chat messages.
   * Handles the built-in tools (wait / sequence / search / create) as well
   * as ordinary user tools.
   */
  const runToolCall = useCallback(
    async (
      call: OllamaToolCall,
      onMessage: (msg: ChatMessage) => void,
    ): Promise<void> => {
      const name = call.function.name
      const args = (call.function.arguments || {}) as Record<string, unknown>

      if (name === WAIT_TOOL_NAME) {
        onMessage(await runWait(args.seconds))
        return
      }

      if (name === SEARCH_TOOL_NAME) {
        onMessage(await runSearch(args.query))
        return
      }

      if (name === CREATE_TOOL_NAME) {
        onMessage(await runCreateTool(args))
        return
      }

      if (name === SEQUENCE_TOOL_NAME) {
        const steps = Array.isArray(args.steps) ? (args.steps as SequenceStep[]) : []
        if (steps.length === 0) {
          onMessage({
            id: uid(),
            role: "tool",
            tool_name: SEQUENCE_TOOL_NAME,
            content: "La secuencia no incluía ningún paso.",
          })
          return
        }
        for (const step of steps) {
          const stepArgs = (step.arguments || {}) as Record<string, unknown>
          if (step.tool === WAIT_TOOL_NAME) {
            onMessage(await runWait(stepArgs.seconds))
            continue
          }
          const msg = await runSingleTool(step.tool, stepArgs)
          onMessage(msg)
          // Stop the whole sequence if the user rejects one of its commands.
          if (msg.denied) break
        }
        return
      }

      onMessage(await runSingleTool(name, args))
    },
    [runWait, runSingleTool, runSearch, runCreateTool],
  )

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || busy) return
      setError(null)
      const userMsg: ChatMessage = { id: uid(), role: "user", content: text.trim() }
      let history = [...messages, userMsg]
      setMessages(history)
      setBusy(true)

      try {
        for (let step = 0; step < MAX_STEPS; step++) {
          const raw = await callChat(history)
          const { content, thinking } = splitThinking(raw.content || "")
          const assistantMsg: ChatMessage = {
            id: uid(),
            role: "assistant",
            content,
            thinking,
            tool_calls: raw.tool_calls,
          }
          history = [...history, assistantMsg]
          setMessages(history)

          if (!raw.tool_calls || raw.tool_calls.length === 0) break

          for (const call of raw.tool_calls) {
            await runToolCall(call, (toolMsg) => {
              history = [...history, toolMsg]
              setMessages(history)
            })
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setBusy(false)
      }
    },
    [busy, messages, callChat, runToolCall],
  )

  const reset = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, busy, error, confirm, send, reset, resolveConfirm }
}
