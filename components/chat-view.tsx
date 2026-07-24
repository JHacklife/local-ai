"use client"

import { useEffect, useRef, useState } from "react"
import { AlertTriangle, Check, SendHorizontal, ShieldAlert, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageItem } from "@/components/message-item"
import type { ChatMessage } from "@/lib/types"

type ConfirmRequest = { toolName: string; command: string } | null

type ChatViewProps = {
  messages: ChatMessage[]
  busy: boolean
  error: string | null
  confirm: ConfirmRequest
  disabled: boolean
  onSend: (text: string) => void
  onReset: () => void
  onResolveConfirm: (approved: boolean) => void
}

export function ChatView({
  messages,
  busy,
  error,
  confirm,
  disabled,
  onSend,
  onReset,
  onResolveConfirm,
}: ChatViewProps) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, confirm, busy])

  function submit() {
    if (!input.trim() || busy || disabled) return
    onSend(input)
    setInput("")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Conversación</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={messages.length === 0 || busy}
          className="h-7 gap-1.5 text-xs"
        >
          <Trash2 className="size-3.5" />
          Limpiar
        </Button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && !confirm && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">Pídele algo a tu modelo local.</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">
              {'Ej.: "sube el volumen al 40%", "toma una captura de pantalla", "bloquea la sesión".'}
            </p>
            <p className="mt-2 max-w-sm text-xs text-muted-foreground/70">
              {'También puede encadenar pasos: "abre la calculadora, copia \'hola\' al portapapeles, espera 3 segundos y toma una captura".'}
            </p>
          </div>
        )}

        {messages.map((m) => (
          <MessageItem key={m.id} message={m} />
        ))}

        {confirm && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
            <div className="flex items-center gap-2 text-amber-400">
              <ShieldAlert className="size-4" />
              <span className="text-sm font-medium">Confirmar comando</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              La tool <span className="font-mono text-foreground">{confirm.toolName}</span> quiere ejecutar:
            </p>
            <pre className="mt-2 overflow-x-auto rounded bg-background/70 px-2.5 py-1.5 font-mono text-xs text-primary">
              {confirm.command}
            </pre>
            <div className="mt-3 flex gap-2">
              <Button size="sm" className="h-8 gap-1.5" onClick={() => onResolveConfirm(true)}>
                <Check className="size-4" />
                Ejecutar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                onClick={() => onResolveConfirm(false)}
              >
                <X className="size-4" />
                Rechazar
              </Button>
            </div>
          </div>
        )}

        {busy && !confirm && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-primary" />
            <span className="ml-1">Pensando…</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-4 mb-2 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Conéctate a Ollama para empezar…" : "Escribe una instrucción…"}
            disabled={disabled || busy}
            rows={1}
            className="max-h-32 min-h-[42px] resize-none font-sans text-sm"
          />
          <Button
            onClick={submit}
            disabled={disabled || busy || !input.trim()}
            size="icon"
            className="size-[42px] shrink-0"
            aria-label="Enviar"
          >
            <SendHorizontal className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
