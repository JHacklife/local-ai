import type { ToolConfig, ToolDefinition } from "./types"

/** Truthy string values used by the `bool` filter. */
const TRUE_VALUES = new Set(["1", "on", "true", "yes", "si", "sí", "enable", "enabled"])

function applyFilter(raw: unknown, filter: string | undefined): string {
  const value = raw === undefined || raw === null ? "" : String(raw)
  switch (filter) {
    case undefined:
      return value
    case "bool":
      return TRUE_VALUES.has(value.trim().toLowerCase()) ? "1" : "0"
    case "volume": {
      // percent (0-100) -> nircmd system volume (0-65535)
      const pct = Math.max(0, Math.min(100, Number(value) || 0))
      return String(Math.round((pct / 100) * 65535))
    }
    case "upper":
      return value.toUpperCase()
    case "lower":
      return value.toLowerCase()
    case "int":
      return String(Math.round(Number(value) || 0))
    default:
      return value
  }
}

/**
 * Replace {name} and {name:filter} placeholders in a command template.
 * Values are looked up first in `args` (model arguments) then in `variables`.
 */
export function renderCommand(
  template: string,
  args: Record<string, unknown>,
  variables: Record<string, string>,
): string {
  return template.replace(/\{([a-zA-Z0-9_]+)(?::([a-zA-Z0-9_]+))?\}/g, (_match, name, filter) => {
    const source = name in args ? args[name] : variables[name]
    return applyFilter(source, filter)
  })
}

/** Convert a user tool definition into the shape Ollama expects in `tools`. */
export function toOllamaTool(tool: ToolDefinition) {
  return {
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }
}

/** Basic structural validation of a parsed tools config. Returns an error string or null. */
export function validateToolConfig(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return "El JSON raíz debe ser un objeto."
  const config = data as Partial<ToolConfig>
  if (config.variables && typeof config.variables !== "object") {
    return "'variables' debe ser un objeto de pares clave/valor."
  }
  if (!Array.isArray(config.tools)) return "'tools' debe ser un arreglo."
  for (const [i, tool] of config.tools.entries()) {
    if (!tool || typeof tool !== "object") return `La tool #${i + 1} no es un objeto válido.`
    if (typeof tool.name !== "string" || !tool.name.trim()) return `La tool #${i + 1} necesita un 'name'.`
    if (typeof tool.description !== "string") return `La tool '${tool.name}' necesita 'description'.`
    if (typeof tool.command !== "string" || !tool.command.trim()) {
      return `La tool '${tool.name}' necesita un 'command'.`
    }
    if (typeof tool.safe !== "boolean") return `La tool '${tool.name}' necesita 'safe' (true/false).`
    if (!tool.parameters || tool.parameters.type !== "object") {
      return `La tool '${tool.name}' necesita 'parameters' con type 'object'.`
    }
  }
  return null
}
