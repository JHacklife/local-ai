/** Base URL of the local Ollama server. Override with OLLAMA_HOST if needed. */
export const OLLAMA_HOST = process.env.OLLAMA_HOST?.replace(/\/$/, "") || "http://127.0.0.1:11434"
