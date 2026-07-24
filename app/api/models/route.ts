import { NextResponse } from "next/server"
import { OLLAMA_HOST } from "@/lib/ollama"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { cache: "no-store" })
    if (!res.ok) {
      return NextResponse.json(
        { error: `Ollama respondió ${res.status}`, models: [] },
        { status: 502 },
      )
    }
    const data = (await res.json()) as { models?: { name: string }[] }
    const models = (data.models ?? []).map((m) => m.name)
    return NextResponse.json({ models })
  } catch (err) {
    return NextResponse.json(
      {
        error: `No se pudo conectar con Ollama en ${OLLAMA_HOST}. ¿Está corriendo 'ollama serve'?`,
        detail: err instanceof Error ? err.message : String(err),
        models: [],
      },
      { status: 503 },
    )
  }
}
