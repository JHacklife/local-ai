export type JSONSchemaProperty = {
  type: "string" | "number" | "integer" | "boolean"
  description?: string
  enum?: (string | number)[]
  default?: string | number | boolean
}

export type ToolParameters = {
  type: "object"
  properties: Record<string, JSONSchemaProperty>
  required?: string[]
}

/**
 * A user-defined tool. `command` is a template string where
 * {paramName} placeholders are replaced by the model's arguments and
 * {variableName} placeholders are replaced by values from `variables`.
 */
export type ToolDefinition = {
  name: string
  description: string
  /** When true (mixed mode) the command runs automatically without confirmation. */
  safe: boolean
  parameters: ToolParameters
  command: string
}

export type ToolConfig = {
  /** Shared values available to every command template, e.g. { nircmd: "C:\\tools\\nircmd.exe" } */
  variables: Record<string, string>
  tools: ToolDefinition[]
}

export type ChatRole = "system" | "user" | "assistant" | "tool"

export type OllamaToolCall = {
  function: {
    name: string
    arguments: Record<string, unknown>
  }
}

export type ChatMessage = {
  role: ChatRole
  content: string
  /** present on assistant messages that request tools */
  tool_calls?: OllamaToolCall[]
  /** present on tool result messages */
  tool_name?: string
  /** UI-only: stable id for React keys */
  id?: string
  /** UI-only: extracted <think> reasoning */
  thinking?: string
  /** UI-only: the rendered command associated with a tool result */
  command?: string
  /** UI-only: raw execution result */
  execResult?: ExecutionResult
  /** UI-only: true when the user rejected an unsafe command */
  denied?: boolean
}

export type ExecutionResult = {
  command: string
  stdout: string
  stderr: string
  code: number | null
  error?: string
}
