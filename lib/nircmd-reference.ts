/**
 * Curated reference of common NirCmd commands, distilled from
 * https://www.nirsoft.net/utils/nircmd2.html
 *
 * This dataset is the authority used to build well-formed tools when the model
 * needs a capability that isn't in tools.json yet. The `/api/nircmd` route can
 * additionally verify a command against the live page, but this list keeps the
 * discover→create→use flow reliable even without outbound network access.
 */

export type NircmdCommand = {
  /** The NirCmd sub-command keyword, e.g. "savescreenshot". */
  command: string
  /** Argument syntax as documented by NirSoft (placeholders in [] / {}). */
  syntax: string
  /** Short Spanish description of what it does. */
  description: string
  /** A ready-to-use example of the full nircmd invocation. */
  example: string
  /** Extra search terms (Spanish + English) to improve matching. */
  keywords: string[]
  /** Whether this command is generally safe to run without confirmation. */
  safe: boolean
}

export const NIRCMD_REFERENCE_URL = "https://www.nirsoft.net/utils/nircmd2.html"

export const NIRCMD_COMMANDS: NircmdCommand[] = [
  {
    command: "speak",
    syntax: 'speak text "[texto]" {rate} {volume}',
    description: "Lee un texto en voz alta usando la síntesis de voz de Windows (SAPI).",
    example: 'nircmd.exe speak text "Hola, ¿cómo estás?"',
    keywords: ["hablar", "voz", "decir", "leer", "narrar", "tts", "speech", "say", "audio"],
    safe: true,
  },
  {
    command: "beep",
    syntax: "beep [frecuencia] [duracion_ms]",
    description: "Reproduce un pitido con la frecuencia (Hz) y duración (ms) indicadas.",
    example: "nircmd.exe beep 500 2000",
    keywords: ["pitido", "sonido", "tono", "beep", "alerta"],
    safe: true,
  },
  {
    command: "stdbeep",
    syntax: "stdbeep",
    description: "Reproduce el pitido estándar de Windows.",
    example: "nircmd.exe stdbeep",
    keywords: ["pitido", "sonido", "beep", "estandar"],
    safe: true,
  },
  {
    command: "savescreenshot",
    syntax: 'savescreenshot "[archivo]" {x y ancho alto}',
    description: "Guarda una captura de la pantalla principal en un archivo de imagen.",
    example: 'nircmd.exe savescreenshot "C:\\Users\\Public\\shot.png"',
    keywords: ["captura", "pantalla", "screenshot", "foto", "imagen"],
    safe: true,
  },
  {
    command: "savescreenshotwin",
    syntax: 'savescreenshotwin "[archivo]"',
    description: "Guarda una captura de la ventana activa en un archivo de imagen.",
    example: 'nircmd.exe savescreenshotwin "C:\\Users\\Public\\win.png"',
    keywords: ["captura", "ventana", "activa", "screenshot", "imagen"],
    safe: true,
  },
  {
    command: "setsysvolume",
    syntax: "setsysvolume [volumen 0-65535]",
    description: "Ajusta el volumen general del sistema (0 = silencio, 65535 = máximo).",
    example: "nircmd.exe setsysvolume 32768",
    keywords: ["volumen", "audio", "sonido", "volume", "subir", "bajar"],
    safe: true,
  },
  {
    command: "changesysvolume",
    syntax: "changesysvolume [cambio]",
    description: "Sube o baja el volumen del sistema en la cantidad indicada (valor negativo baja).",
    example: "nircmd.exe changesysvolume 5000",
    keywords: ["volumen", "subir", "bajar", "audio", "sonido"],
    safe: true,
  },
  {
    command: "mutesysvolume",
    syntax: "mutesysvolume [0|1|2]",
    description: "Silencia (1), activa (0) o alterna (2) el audio del sistema.",
    example: "nircmd.exe mutesysvolume 1",
    keywords: ["silenciar", "mute", "audio", "sonido", "mutear"],
    safe: true,
  },
  {
    command: "setappvolume",
    syntax: "setappvolume [proceso.exe] [nivel 0-1]",
    description: "Ajusta el volumen de una aplicación concreta (nivel entre 0 y 1).",
    example: "nircmd.exe setappvolume firefox.exe 0.5",
    keywords: ["volumen", "aplicacion", "app", "programa", "audio"],
    safe: true,
  },
  {
    command: "monitor",
    syntax: "monitor [off|on|async_off|low]",
    description: "Enciende, apaga o pone en bajo consumo el monitor.",
    example: "nircmd.exe monitor off",
    keywords: ["monitor", "pantalla", "apagar", "encender", "display"],
    safe: true,
  },
  {
    command: "setbrightness",
    syntax: "setbrightness [nivel 0-100] {modo}",
    description: "Fija el brillo de la pantalla del portátil (0 oscuro, 100 brillante).",
    example: "nircmd.exe setbrightness 60",
    keywords: ["brillo", "brightness", "pantalla", "luz", "portatil"],
    safe: true,
  },
  {
    command: "changebrightness",
    syntax: "changebrightness [cambio] {modo}",
    description: "Sube o baja el brillo de la pantalla (valor negativo lo reduce).",
    example: "nircmd.exe changebrightness 10",
    keywords: ["brillo", "brightness", "subir", "bajar", "pantalla"],
    safe: true,
  },
  {
    command: "screensaver",
    syntax: "screensaver",
    description: "Inicia el protector de pantalla predeterminado.",
    example: "nircmd.exe screensaver",
    keywords: ["protector", "screensaver", "pantalla"],
    safe: true,
  },
  {
    command: "clipboard",
    syntax: 'clipboard [set|clear|readfile] "[valor]"',
    description: "Gestiona el portapapeles: copiar texto, vaciarlo o cargar un archivo.",
    example: 'nircmd.exe clipboard set "texto de ejemplo"',
    keywords: ["portapapeles", "clipboard", "copiar", "pegar", "texto"],
    safe: true,
  },
  {
    command: "exec",
    syntax: 'exec [show|hide|min|max] "[programa]"',
    description: "Ejecuta un programa o archivo, opcionalmente oculto o maximizado.",
    example: 'nircmd.exe exec show "notepad"',
    keywords: ["abrir", "ejecutar", "programa", "app", "run", "lanzar", "iniciar"],
    safe: false,
  },
  {
    command: "shexec",
    syntax: 'shexec [open|print] "[archivo o url]"',
    description: "Abre o imprime un archivo o URL con su aplicación predeterminada.",
    example: 'nircmd.exe shexec open "https://www.google.com"',
    keywords: ["abrir", "url", "web", "archivo", "navegador", "imprimir"],
    safe: false,
  },
  {
    command: "killprocess",
    syntax: "killprocess [proceso.exe]",
    description: "Termina de forma forzada el proceso indicado.",
    example: "nircmd.exe killprocess notepad.exe",
    keywords: ["matar", "cerrar", "terminar", "proceso", "kill", "forzar"],
    safe: false,
  },
  {
    command: "closeprocess",
    syntax: "closeprocess [proceso.exe]",
    description: "Cierra un proceso de forma ordenada enviando WM_CLOSE a sus ventanas.",
    example: "nircmd.exe closeprocess notepad.exe",
    keywords: ["cerrar", "proceso", "close", "terminar"],
    safe: false,
  },
  {
    command: "restartexplorer",
    syntax: "restartexplorer",
    description: "Reinicia el Explorador de Windows de forma controlada.",
    example: "nircmd.exe restartexplorer",
    keywords: ["reiniciar", "explorer", "explorador", "escritorio"],
    safe: false,
  },
  {
    command: "lockws",
    syntax: "lockws",
    description: "Bloquea la sesión de Windows.",
    example: "nircmd.exe lockws",
    keywords: ["bloquear", "lock", "sesion", "seguridad"],
    safe: false,
  },
  {
    command: "exitwin",
    syntax: "exitwin [logoff|reboot|poweroff|shutdown] {force}",
    description: "Cierra sesión, reinicia o apaga el equipo.",
    example: "nircmd.exe exitwin reboot",
    keywords: ["apagar", "reiniciar", "cerrar sesion", "logoff", "reboot", "shutdown", "poweroff"],
    safe: false,
  },
  {
    command: "standby",
    syntax: "standby {force}",
    description: "Pone el equipo en modo de suspensión (standby).",
    example: "nircmd.exe standby",
    keywords: ["suspender", "standby", "dormir", "reposo"],
    safe: false,
  },
  {
    command: "hibernate",
    syntax: "hibernate {force}",
    description: "Pone el equipo en modo de hibernación.",
    example: "nircmd.exe hibernate",
    keywords: ["hibernar", "hibernate", "reposo"],
    safe: false,
  },
  {
    command: "emptybin",
    syntax: "emptybin {unidad}",
    description: "Vacía la papelera de reciclaje.",
    example: "nircmd.exe emptybin",
    keywords: ["papelera", "reciclaje", "vaciar", "basura", "recyclebin"],
    safe: false,
  },
  {
    command: "cdrom",
    syntax: "cdrom [open|close] {unidad:}",
    description: "Abre o cierra la bandeja de la unidad de CD/DVD.",
    example: "nircmd.exe cdrom open",
    keywords: ["cd", "dvd", "cdrom", "bandeja", "abrir", "cerrar", "disco"],
    safe: true,
  },
  {
    command: "sendkeypress",
    syntax: "sendkeypress [combinacion]",
    description: "Envía una combinación de teclas al sistema (p. ej. ctrl+shift+esc).",
    example: "nircmd.exe sendkeypress ctrl+shift+esc",
    keywords: ["teclas", "teclado", "atajo", "keypress", "hotkey", "combinacion"],
    safe: false,
  },
  {
    command: "sendmouse",
    syntax: "sendmouse [right|left|middle] [click|dblclick]",
    description: "Envía un evento del ratón (clic, doble clic, movimiento o rueda).",
    example: "nircmd.exe sendmouse left click",
    keywords: ["raton", "mouse", "clic", "click", "cursor"],
    safe: false,
  },
  {
    command: "setcursor",
    syntax: "setcursor [X] [Y]",
    description: "Coloca el cursor del ratón en la posición indicada de la pantalla.",
    example: "nircmd.exe setcursor 100 50",
    keywords: ["cursor", "raton", "mouse", "posicion", "mover"],
    safe: true,
  },
  {
    command: "trayballoon",
    syntax: 'trayballoon "[titulo]" "[texto]" "[icono]" [timeout_ms]',
    description: "Muestra una notificación tipo globo en la bandeja del sistema.",
    example: 'nircmd.exe trayballoon "Hola" "Mensaje de prueba" "shell32.dll,22" 8000',
    keywords: ["notificacion", "aviso", "globo", "balloon", "bandeja", "mensaje"],
    safe: true,
  },
  {
    command: "infobox",
    syntax: 'infobox "[texto]" "[titulo]"',
    description: "Muestra una ventana de mensaje sencilla en la pantalla.",
    example: 'nircmd.exe infobox "Esto es un mensaje" "Aviso"',
    keywords: ["mensaje", "aviso", "cuadro", "dialogo", "infobox", "popup"],
    safe: true,
  },
  {
    command: "mediaplay",
    syntax: 'mediaplay [duracion_ms] "[archivo]"',
    description: "Reproduce un archivo de audio (.mp3, .wav) durante los ms indicados.",
    example: 'nircmd.exe mediaplay 10000 "C:\\audio\\sonido.mp3"',
    keywords: ["reproducir", "audio", "musica", "sonido", "media", "mp3", "wav"],
    safe: true,
  },
  {
    command: "setdisplay",
    syntax: "setdisplay [ancho] [alto] [bits] {refresco}",
    description: "Cambia la resolución y profundidad de color de la pantalla.",
    example: "nircmd.exe setdisplay 1920 1080 32",
    keywords: ["resolucion", "pantalla", "display", "monitor", "color"],
    safe: false,
  },
  {
    command: "win",
    syntax: 'win [close|hide|show|max|min|activate|center] [find] "[titulo]"',
    description: "Controla ventanas: cerrar, ocultar, maximizar, minimizar, centrar, etc.",
    example: 'nircmd.exe win max title "Calculadora"',
    keywords: ["ventana", "window", "maximizar", "minimizar", "cerrar", "ocultar", "centrar"],
    safe: false,
  },
  {
    command: "setdefaultsounddevice",
    syntax: 'setdefaultsounddevice "[nombre]" {rol}',
    description: "Establece el dispositivo de sonido predeterminado.",
    example: 'nircmd.exe setdefaultsounddevice "Speakers"',
    keywords: ["sonido", "dispositivo", "audio", "predeterminado", "altavoces"],
    safe: true,
  },
  {
    command: "regsetval",
    syntax: 'regsetval [tipo] "[clave]" "[valor]" "[dato]"',
    description: "Escribe un valor en el Registro de Windows.",
    example: 'nircmd.exe regsetval sz "HKCU\\Software\\Test" "Valor" "dato"',
    keywords: ["registro", "regedit", "registry", "clave", "valor"],
    safe: false,
  },
]

/** Normalize text for matching: lowercase and strip accents. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export type NircmdMatch = NircmdCommand & { score: number }

/**
 * Score the reference against a natural-language query and return the best
 * matches. Command name and keyword hits weigh more than description hits.
 */
export function searchNircmdReference(query: string, limit = 6): NircmdMatch[] {
  const q = normalize(query)
  const tokens = q.split(/[^a-z0-9]+/).filter((t) => t.length >= 3)

  const scored = NIRCMD_COMMANDS.map((cmd) => {
    const name = normalize(cmd.command)
    const desc = normalize(cmd.description)
    const keywords = cmd.keywords.map(normalize)
    let score = 0

    for (const token of tokens) {
      if (name.includes(token)) score += 5
      if (keywords.some((k) => k.includes(token) || token.includes(k))) score += 4
      if (desc.includes(token)) score += 2
    }
    // Whole-query direct hit on a keyword (e.g. "brillo").
    if (keywords.some((k) => q.includes(k))) score += 3

    return { ...cmd, score }
  })

  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
