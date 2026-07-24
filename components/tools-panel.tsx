"use client"

import { useEffect, useState } from "react"
import { Check, FileJson, ListChecks, Loader2, Save, ShieldCheck, Wrench, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { ToolConfig } from "@/lib/types"

type ToolsPanelProps = {
  config: ToolConfig | null
  onApply: (config: ToolConfig) => void
}

type Tab = "list" | "json"

export function ToolsPanel({ config, onApply }: ToolsPanelProps) {
  const [tab, setTab] = useState<Tab>("list")
  const [draft, setDraft] = useState("")
  const [status, setStatus] = useState<{ type: "ok" | "error"; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (config) setDraft(JSON.stringify(config, null, 2))
  }, [config])

  function parseDraft(): ToolConfig | null {
    try {
      const parsed = JSON.parse(draft) as ToolConfig
      setStatus(null)
      return parsed
    } catch (err) {
      setStatus({ type: "error", text: `JSON inválido: ${err instanceof Error ? err.message : String(err)}` })
      return null
    }
  }

  function apply() {
    const parsed = parseDraft()
    if (!parsed) return
    onApply(parsed)
    setStatus({ type: "ok", text: "Cambios aplicados a la sesión actual." })
  }

  async function saveToFile() {
    const parsed = parseDraft()
    if (!parsed) return
    setSaving(true)
    try {
      const res = await fetch("/api/tools", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo guardar.")
      onApply(parsed)
      setStatus({ type: "ok", text: "Guardado en tools.json (solo en local)." })
    } catch (err) {
      setStatus({ type: "error", text: err instanceof Error ? err.message : String(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-1 border-b border-border px-2 py-2">
        <Button
          variant={tab === "list" ? "secondary" : "ghost"}
          size="sm"
          className="h-8 flex-1 gap-1.5 text-xs"
          onClick={() => setTab("list")}
        >
          <ListChecks className="size-4" />
          Tools ({config?.tools.length ?? 0})
        </Button>
        <Button
          variant={tab === "json" ? "secondary" : "ghost"}
          size="sm"
          className="h-8 flex-1 gap-1.5 text-xs"
          onClick={() => setTab("json")}
        >
          <FileJson className="size-4" />
          Editor JSON
        </Button>
      </div>

      {tab === "list" ? (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {config?.variables && Object.keys(config.variables).length > 0 && (
            <div className="rounded-md border border-border bg-card/40 p-2.5">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Variables</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(config.variables).map(([k, v]) => (
                  <span
                    key={k}
                    className="rounded border border-border bg-background/60 px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
                  >
                    {`{${k}}`} = {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {config?.tools.map((tool) => (
            <div key={tool.name} className="rounded-md border border-border bg-card/40 p-3">
              <div className="flex items-center gap-2">
                <Wrench className="size-4 text-primary" />
                <span className="font-mono text-sm text-foreground">{tool.name}</span>
                {tool.safe ? (
                  <Badge variant="secondary" className="ml-auto gap-1 text-[10px]">
                    <Zap className="size-3" />
                    Auto
                  </Badge>
                ) : (
                  <Badge variant="outline" className="ml-auto gap-1 text-[10px]">
                    <ShieldCheck className="size-3" />
                    Confirmar
                  </Badge>
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{tool.description}</p>
              <pre className="mt-2 overflow-x-auto rounded bg-background/70 px-2 py-1.5 font-mono text-[11px] text-primary/90">
                {tool.command}
              </pre>
            </div>
          ))}

          {config && config.tools.length === 0 && (
            <p className="p-4 text-center text-xs text-muted-foreground">No hay tools definidas todavía.</p>
          )}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col p-3">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            className="min-h-0 flex-1 resize-none font-mono text-xs leading-relaxed"
            placeholder="Pega aquí tu configuración de tools en JSON…"
          />
          <div className="mt-2 flex gap-2">
            <Button size="sm" className="h-8 flex-1 gap-1.5 text-xs" onClick={apply}>
              <Check className="size-4" />
              Aplicar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 flex-1 gap-1.5 text-xs"
              onClick={saveToFile}
              disabled={saving}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Guardar archivo
            </Button>
          </div>
        </div>
      )}

      {status && (
        <div
          className={`border-t px-3 py-2 text-xs ${
            status.type === "ok"
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {status.text}
        </div>
      )}
    </div>
  )
}
