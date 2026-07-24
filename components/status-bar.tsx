"use client"

import { Cpu, RotateCw, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type StatusBarProps = {
  connected: boolean
  connecting: boolean
  models: string[]
  model: string
  onModelChange: (model: string) => void
  onRefresh: () => void
}

export function StatusBar({
  connected,
  connecting,
  models,
  model,
  onModelChange,
  onRefresh,
}: StatusBarProps) {
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-border bg-card/50 px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Terminal className="size-5" />
        </div>
        <div className="leading-tight">
          <h1 className="text-sm font-semibold text-foreground">Consola de IA Local</h1>
          <p className="text-xs text-muted-foreground">Ollama + tools personalizadas</p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-md border border-border bg-background/60 px-2.5 py-1.5">
          <span
            className={`size-2 rounded-full ${
              connecting ? "bg-amber-400 animate-pulse" : connected ? "bg-primary" : "bg-destructive"
            }`}
            aria-hidden
          />
          <span className="text-xs text-muted-foreground">
            {connecting ? "Conectando…" : connected ? "Ollama en línea" : "Sin conexión"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Cpu className="size-4 text-muted-foreground" aria-hidden />
          <Select value={model} onValueChange={onModelChange}>
            <SelectTrigger className="h-9 w-[180px] font-mono text-xs" aria-label="Modelo">
              <SelectValue placeholder="Selecciona modelo" />
            </SelectTrigger>
            <SelectContent>
              {models.length === 0 && (
                <SelectItem value={model} className="font-mono text-xs">
                  {model}
                </SelectItem>
              )}
              {models.map((m) => (
                <SelectItem key={m} value={m} className="font-mono text-xs">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Reintentar conexión">
          <RotateCw className={`size-4 ${connecting ? "animate-spin" : ""}`} />
        </Button>
      </div>
    </header>
  )
}
