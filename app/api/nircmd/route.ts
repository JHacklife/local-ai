import { NextResponse } from "next/server"
import { NIRCMD_REFERENCE_URL, searchNircmdReference } from "@/lib/nircmd-reference"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Search the NirCmd command reference for a natural-language query.
 * Results come from the curated dataset; when possible we also fetch the live
 * NirSoft page to mark which commands are confirmed to exist there.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = (searchParams.get("q") || "").trim()

  if (!query) {
    return NextResponse.json({ error: "Falta el parámetro de búsqueda 'q'." }, { status: 400 })
  }

  const matches = searchNircmdReference(query)

  // Best-effort verification against the live reference page. Never blocks the
  // response for long and never fails the request if the network is unavailable.
  let verifiedAgainstWeb = false
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(NIRCMD_REFERENCE_URL, {
      signal: controller.signal,
      headers: { "User-Agent": "local-ai-console" },
    })
    clearTimeout(timeout)
    if (res.ok) {
      const html = (await res.text()).toLowerCase()
      for (const m of matches) {
        ;(m as { verified?: boolean }).verified = html.includes(m.command.toLowerCase())
      }
      verifiedAgainstWeb = true
    }
  } catch {
    // Offline or blocked: fall back to the curated dataset silently.
  }

  return NextResponse.json({
    query,
    source: NIRCMD_REFERENCE_URL,
    verifiedAgainstWeb,
    matches,
  })
}
