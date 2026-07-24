"use client"

import { useState } from "react"
import { Brain, ChevronDown, CircleCheck, CircleX, Clock, TerminalSquare, User, Wrench } from "lucide-react"
import { WAIT_TOOL_NAME } from "@/lib/builtins"
import type { ChatMessage } from "@/lib/types"

function ThinkingBlock({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2 rounded-md border border-border/60 bg-background/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground"
      >
        <Brain className="size-3.5" />
        Razonamiento
        <ChevronDown className={`ml-auto size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <pre className="whitespace-pre-wrap px-2.5 pb-2.5 font-mono text-xs text-muted-foreground">{text}</pre>
      )}
    </div>
  )
}

export function MessageItem({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-[85%] items-start gap-2">
          <div className="rounded-lg rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
            {message.content}
          </div>
          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <User className="size-4" />
          </div>
        </div>
      </div>
    )
  }

  if (message.role === "tool" && message.tool_name === WAIT_TOOL_NAME) {
    return (
      <div className="flex justify-start">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          {message.content}
        </div>
      </div>
    )
  }

  if (message.role === "tool") {
    const ok = !message.denied && !message.execResult?.error
    return (
      <div className="flex justify-start">
        <div className="w-full max-w-[92%] rounded-lg border border-border bg-card/60 p-3">
          <div className="flex items-center gap-2">
            {message.denied ? (
              <CircleX className="size-4 text-destructive" />
            ) : ok ? (
              <CircleCheck className="size-4 text-primary" />
            ) : (
              <CircleX className="size-4 text-destructive" />
            )}
            <span className="font-mono text-xs font-medium text-foreground">{message.tool_name}</span>
            <span className="text-xs text-muted-foreground">
              {message.denied ? "rechazada" : ok ? "ejecutada" : "error"}
            </span>
          </div>
          {message.command && (
            <pre className="mt-2 overflow-x-auto rounded bg-background/70 px-2.5 py-1.5 font-mono text-xs text-primary">
              {message.command}
            </pre>
          )}
          {message.content && (
            <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-muted-foreground">
              {message.content}
            </pre>
          )}
        </div>
      </div>
    )
  }

  // assistant
  const requestedTools = message.tool_calls && message.tool_calls.length > 0
  return (
    <div className="flex justify-start">
      <div className="flex w-full max-w-[92%] items-start gap-2">
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <TerminalSquare className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          {message.content && (
            <div className="rounded-lg rounded-tl-sm bg-secondary px-3 py-2 text-sm text-secondary-foreground">
              {message.content}
            </div>
          )}
          {message.thinking && <ThinkingBlock text={message.thinking} />}
          {requestedTools && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {message.tool_calls!.map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background/50 px-2 py-1 font-mono text-xs text-muted-foreground"
                >
                  <Wrench className="size-3" />
                  {c.function.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
