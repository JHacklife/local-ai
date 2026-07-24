import { NextResponse } from "next/server"
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { validateToolConfig } from "@/lib/template"
import type { ToolConfig } from "@/lib/types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const FILE_PATH = path.join(process.cwd(), "tools.json")

/** Read the tools.json config file that ships with the project. */
export async function GET() {
  try {
    const raw = await readFile(FILE_PATH, "utf8")
    const data = JSON.parse(raw) as ToolConfig
    const error = validateToolConfig(data)
    if (error) return NextResponse.json({ error }, { status: 422 })
    return NextResponse.json({ config: data })
  } catch (err) {
    return NextResponse.json(
      { error: "No se pudo leer tools.json.", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

/** Persist an edited config back to tools.json (only works when running locally). */
export async function PUT(req: Request) {
  let data: unknown
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 })
  }

  const error = validateToolConfig(data)
  if (error) return NextResponse.json({ error }, { status: 422 })

  try {
    await writeFile(FILE_PATH, JSON.stringify(data, null, 2) + "\n", "utf8")
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      {
        error: "No se pudo guardar tools.json (¿permisos de escritura?).",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    )
  }
}
