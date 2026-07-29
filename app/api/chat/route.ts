import { NextResponse } from "next/server"
import { OLLAMA_HOST } from "@/lib/ollama"
import { buildBuiltinOllamaTools } from "@/lib/builtins"
import { toOllamaTool } from "@/lib/template"
import type { ChatMessage, ToolDefinition } from "@/lib/types"

export const dynamic = "force-dynamic"

type ChatBody = {
  model: string
  messages: ChatMessage[]
  tools: ToolDefinition[]
}

/**
 * Non-streaming proxy to Ollama /api/chat. Sends the conversation plus the
 * user's tool definitions and returns the assistant message, which may contain
 * tool_calls for the client to resolve.
 */
export async function POST(req: Request) {
  let body: ChatBody
  try {
    body = (await req.json()) as ChatBody
  } catch {
    return NextResponse.json({ error: "JSON inválido en la petición." }, { status: 400 })
  }

  const { model, messages, tools } = body
  if (!model) return NextResponse.json({ error: "Falta 'model'." }, { status: 400 })
  if (!Array.isArray(messages)) return NextResponse.json({ error: "Falta 'messages'." }, { status: 400 })

  // Strip UI-only fields before sending to Ollama.
  const cleanMessages = messages.map(({ role, content, tool_calls, tool_name }) => ({
    role,
    content,
    ...(tool_calls ? { tool_calls } : {}),
    ...(tool_name ? { tool_name } : {}),
  }))

  // Expose the user's tools plus the built-in chaining tools (wait/sequence)
  // so the model can run several actions in order from a single request.
  const userTools = tools && tools.length > 0 ? tools.map(toOllamaTool) : []
  const allTools = userTools.length > 0 ? [...userTools, ...buildBuiltinOllamaTools(tools.map((t) => t.name))] : []

  const payload = {
    model,
    messages: cleanMessages,
    stream: false as const,
    ...(allTools.length > 0 ? { tools: allTools } : {}),
  }

  try {
    const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: `Ollama respondió ${res.status}: ${text.slice(0, 500)}` },
        { status: 502 },
      )
    }

    const data = (await res.json()) as { message?: ChatMessage }
    if (!data.message) {
      return NextResponse.json({ error: "Respuesta inesperada de Ollama." }, { status: 502 })
    }
    return NextResponse.json({ message: data.message })
  } catch (err) {
    return NextResponse.json(
      {
        error: `No se pudo conectar con Ollama en ${OLLAMA_HOST}. ¿Está corriendo 'ollama serve'?`,
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 503 },
    )
  }
}
