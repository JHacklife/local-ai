import { NextResponse } from "next/server"
import { exec } from "node:child_process"
import type { ExecutionResult } from "@/lib/types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const TIMEOUT_MS = 15_000

/**
 * Executes a shell command on the machine hosting this Next.js server.
 * This is intended to be run LOCALLY only. The client sends the exact command
 * string that was shown to (and, when unsafe, approved by) the user.
 */
export async function POST(req: Request) {
  let command: string
  try {
    const body = (await req.json()) as { command?: string }
    command = (body.command ?? "").trim()
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 })
  }

  if (!command) {
    return NextResponse.json({ error: "El comando está vacío." }, { status: 400 })
  }

  const result = await new Promise<ExecutionResult>((resolve) => {
    exec(command, { timeout: TIMEOUT_MS, windowsHide: true }, (error, stdout, stderr) => {
      resolve({
        command,
        stdout: stdout?.toString() ?? "",
        stderr: stderr?.toString() ?? "",
        code: error && typeof error.code === "number" ? error.code : error ? 1 : 0,
        error: error ? error.message : undefined,
      })
    })
  })

  return NextResponse.json(result)
}
