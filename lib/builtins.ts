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
export const SEARCH_TOOL_NAME = "buscar_comando_nircmd"
export const CREATE_TOOL_NAME = "crear_tool_nircmd"

/** Names that are handled internally and never map to a user tool/command. */
export const BUILTIN_TOOL_NAMES = new Set([
  WAIT_TOOL_NAME,
  SEQUENCE_TOOL_NAME,
  SEARCH_TOOL_NAME,
  CREATE_TOOL_NAME,
])

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
    {
      type: "function",
      function: {
        name: SEARCH_TOOL_NAME,
        description:
          "Busca en la referencia de NirCmd (nirsoft.net) un comando capaz de realizar una acción " +
          "para la que NO existe todavía una tool. Úsala como PRIMER paso cuando el usuario pida algo " +
          `que ninguna tool actual cubre (tools actuales: ${available}). Devuelve comandos candidatos ` +
          `con su sintaxis para que luego crees la tool con "${CREATE_TOOL_NAME}".`,
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "Descripción breve de la acción deseada, p. ej. 'ajustar el brillo de la pantalla' " +
                "o 'reproducir un archivo de audio'.",
            },
          },
          required: ["query"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: CREATE_TOOL_NAME,
        description:
          "Crea una nueva tool basada en un comando de NirCmd y la guarda en la configuración para poder " +
          `usarla de inmediato. Llama antes a "${SEARCH_TOOL_NAME}" para conocer la sintaxis exacta. ` +
          'En "command" escribe SOLO los argumentos de nircmd (sin la ruta al ejecutable); usa ' +
          "marcadores {nombre} para los parámetros que aporte el usuario, por ejemplo: " +
          'speak text "{texto}". Después de crearla, llámala en el siguiente paso.',
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Nombre único de la tool en snake_case, p. ej. 'ajustar_brillo'.",
            },
            description: {
              type: "string",
              description: "Descripción en español de lo que hace la tool.",
            },
            command: {
              type: "string",
              description:
                'Argumentos de nircmd con marcadores {param}, p. ej. setbrightness {nivel}. ' +
                "No incluyas la ruta al ejecutable; se antepone automáticamente.",
            },
            safe: {
              type: "boolean",
              description:
                "true si el comando es inofensivo y puede ejecutarse sin confirmación; " +
                "false si es potencialmente destructivo (cerrar procesos, apagar, borrar, etc.).",
            },
            parameters: {
              type: "object",
              description:
                "Esquema JSON de los parámetros (formato JSON Schema con type 'object', 'properties' y " +
                "'required'). Debe incluir cada marcador {param} usado en command. Usa {} si no hay parámetros.",
            },
          },
          required: ["name", "description", "command", "safe", "parameters"],
        },
      },
    },
  ]
}
