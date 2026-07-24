/**
 * Built-in "meta" tools that are injected on top of the user's own tools so a
 * local model can CHAIN several actions together in a single request.
 *
 * - `wait_seconds` pauses before the next step (handled client-side).
 * - `run_sequence` runs an ordered list of steps, each referencing another
 *   tool by name (or `wait_seconds`), so requests like "abre un programa,
 *   copia un texto, espera 3 segundos y toma una captura" run deterministically.
 */

export const WAIT_TOOL_NAME = "wait_seconds"
export const SEQUENCE_TOOL_NAME = "run_sequence"

/** Names that are handled internally and never map to a user tool/command. */
export const BUILTIN_TOOL_NAMES = new Set([WAIT_TOOL_NAME, SEQUENCE_TOOL_NAME])

/** Safety cap so the model can't freeze the session with an enormous delay. */
export const MAX_WAIT_SECONDS = 120

/** A single step inside a `run_sequence` call. */
export type SequenceStep = {
  tool: string
  arguments?: Record<string, unknown>
}

type OllamaFunctionTool = {
  type: "function"
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

/**
 * Build the raw Ollama tool specs for the built-ins. `userToolNames` is used
 * to tell the model exactly which tools it may reference inside a sequence.
 */
export function buildBuiltinOllamaTools(userToolNames: string[]): OllamaFunctionTool[] {
  const available = userToolNames.length ? userToolNames.join(", ") : "(ninguna)"
  return [
    {
      type: "function",
      function: {
        name: WAIT_TOOL_NAME,
        description:
          "Pausa la ejecución durante un número de segundos antes de continuar con la siguiente acción.",
        parameters: {
          type: "object",
          properties: {
            seconds: {
              type: "number",
              description: `Cantidad de segundos a esperar (máximo ${MAX_WAIT_SECONDS}).`,
            },
          },
          required: ["seconds"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: SEQUENCE_TOOL_NAME,
        description:
          "Ejecuta varias acciones EN ORDEN, una tras otra. Úsala siempre que el usuario pida una " +
          'secuencia de pasos (por ejemplo: "abre un programa, copia un texto, espera 3 segundos y toma ' +
          'una captura"). Cada paso indica el nombre de una tool y sus argumentos. ' +
          `Tools disponibles para los pasos: ${available}. ` +
          `Usa el paso especial "${WAIT_TOOL_NAME}" con { "seconds": N } para insertar una espera.`,
        parameters: {
          type: "object",
          properties: {
            steps: {
              type: "array",
              description: "Lista ordenada de pasos a ejecutar, del primero al último.",
              items: {
                type: "object",
                properties: {
                  tool: {
                    type: "string",
                    description: `Nombre de la tool a ejecutar, o "${WAIT_TOOL_NAME}" para esperar.`,
                  },
                  arguments: {
                    type: "object",
                    description: `Argumentos para la tool. Para "${WAIT_TOOL_NAME}" usa { "seconds": N }.`,
                  },
                },
                required: ["tool"],
              },
            },
          },
          required: ["steps"],
        },
      },
    },
  ]
}
