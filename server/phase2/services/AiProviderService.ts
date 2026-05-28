/**
 * @file server/phase2/services/AiProviderService.ts
 * @description Omnecor — AI Provider Service
 *
 * Orchestrates requests to various AI providers (Ollama, OpenAI, Anthropic, Gemini).
 * Implements streaming, token handling, and provider-specific formatting.
 *
 * This service acts as the "Valet Router" engine, selecting the best model
 * for a given task based on configuration or budget.
 */

import { ENV } from "../../_core/env.js";
import { MeshDiscoveryService, MeshNode } from "./MeshDiscoveryService.js";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export interface Message {
  role: Role;
  content: string;
}

export interface ChatInput {
  providerId: string;
  modelId: string;
  messages: Message[];
  apiKey?: string;
  baseUrl?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  isFictionMode?: boolean;
}

export interface ChatChunk {
  content: string;
  done?: boolean;
  error?: string;
}

export class AiProviderService {
  private static instance: AiProviderService;
  private meshService: MeshDiscoveryService;

  private constructor() {
    this.meshService = MeshDiscoveryService.getInstance();
  }

  public static getInstance(): AiProviderService {
    if (!AiProviderService.instance) {
      AiProviderService.instance = new AiProviderService();
    }
    return AiProviderService.instance;
  }

  /**
   * Main entry point for chat completions.
   * Routes to local inference or offloads to a mesh peer if local capacity is low.
   */
  async chat(input: ChatInput, onChunk?: (chunk: ChatChunk) => void): Promise<string> {
    // 1. Check if we should offload
    if (this.shouldOffload(input)) {
        const peer = this.selectPeerNode(input);
        if (peer) {
            return this.routeToPeer(peer, input, onChunk);
        }
    }

    // 2. Local inference
    const chatInput = { ...input };
    if (chatInput.isFictionMode) {
      const fictionPrompt: Message = {
        role: "system",
        content: "You are in Fiction Mode. Maintain a narrative, creative tone and prioritize immersive, imaginative descriptions. Focus on world-building and character depth over strict technical accuracy."
      };
      chatInput.messages = [fictionPrompt, ...chatInput.messages];
    }
    
    switch (chatInput.providerId.toLowerCase()) {
      case "ollama":
        return this.chatOllama(chatInput, onChunk);
      case "openai":
        return this.chatOpenAI(chatInput, onChunk);
      case "anthropic":
        return this.chatAnthropic(chatInput, onChunk);
      case "gemini":
        return this.chatGemini(chatInput, onChunk);
      case "forge":
        return this.chatForge(chatInput, onChunk);
      default:
        throw new Error(`Unsupported provider: ${chatInput.providerId}`);
    }
  }

  private shouldOffload(input: ChatInput): boolean {
    return false; // Stubbed for now - requires ProcessManager integration
  }

  private selectPeerNode(input: ChatInput): MeshNode | undefined {
    const nodes = this.meshService.getNodes();
    return nodes.find(n => n.capabilities.includes('inference'));
  }

  private async routeToPeer(peer: MeshNode, input: ChatInput, onChunk?: (chunk: ChatChunk) => void): Promise<string> {
    const url = `http://${peer.address}:${peer.port}/api/trpc/ai.chat`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: input }),
    });

    if (!response.ok) throw new Error(`Federated routing failed: ${response.statusText}`);
    const data = await response.json();
    return data.result.data.content;
  }

  // ─── Provider Implementations ──────────────────────────────────────────────

  private async chatForge(input: ChatInput, onChunk?: (chunk: ChatChunk) => void): Promise<string> {
    const apiKey = input.apiKey || ENV.forgeApiKey;
    if (!apiKey) throw new Error("FORGE_API_KEY not configured");

    const baseUrl = input.baseUrl || (ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
      ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
      : "https://forge.manus.im/v1/chat/completions");

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: input.modelId || "gemini-2.5-flash",
        messages: input.messages,
        stream: !!onChunk,
      }),
    });

    if (!response.ok) {
      throw new Error(`Forge error: ${response.statusText}`);
    }

    if (!onChunk) {
      const data = await response.json();
      return data.choices[0].message.content;
    }

    return this.handleStream(response, (line) => {
      if (line === "[DONE]") return { content: "", done: true };
      const parsed = JSON.parse(line);
      return {
        content: parsed.choices[0]?.delta?.content || "",
        done: false,
      };
    }, onChunk, "data: ");
  }

  private async chatOllama(input: ChatInput, onChunk?: (chunk: ChatChunk) => void): Promise<string> {
    const baseUrl = input.baseUrl || ENV.ollamaUrl || "http://localhost:11434";
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: input.modelId,
        messages: input.messages,
        stream: !!onChunk,
        options: {
          num_predict: input.maxTokens,
          temperature: input.temperature,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    if (!onChunk) {
      const data = await response.json();
      return data.message.content;
    }

    return this.handleStream(response, (line) => {
      const parsed = JSON.parse(line);
      return {
        content: parsed.message?.content || "",
        done: parsed.done,
      };
    }, onChunk);
  }

  private async chatOpenAI(input: ChatInput, onChunk?: (chunk: ChatChunk) => void): Promise<string> {
    const apiKey = input.apiKey || ENV.openaiApiKey;
    if (!apiKey) throw new Error("OpenAI API Key not configured");

    const baseUrl = input.baseUrl || "https://api.openai.com/v1/chat/completions";
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: input.modelId,
        messages: input.messages,
        stream: !!onChunk,
        max_tokens: input.maxTokens,
        temperature: input.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.statusText}`);
    }

    if (!onChunk) {
      const data = await response.json();
      return data.choices[0].message.content;
    }

    return this.handleStream(response, (line) => {
      if (line === "[DONE]") return { content: "", done: true };
      const parsed = JSON.parse(line);
      return {
        content: parsed.choices[0]?.delta?.content || "",
        done: false,
      };
    }, onChunk, "data: ");
  }

  private async chatAnthropic(input: ChatInput, onChunk?: (chunk: ChatChunk) => void): Promise<string> {
    const apiKey = input.apiKey || ENV.anthropicApiKey;
    if (!apiKey) throw new Error("Anthropic API Key not configured");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: input.modelId,
        messages: input.messages.filter(m => m.role !== "system"),
        system: input.systemPrompt || input.messages.find(m => m.role === "system")?.content,
        stream: !!onChunk,
        max_tokens: input.maxTokens || 4096,
        temperature: input.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic error: ${response.statusText}`);
    }

    if (!onChunk) {
      const data = await response.json();
      return data.content[0].text;
    }

    return this.handleStream(response, (line) => {
      const parsed = JSON.parse(line);
      if (parsed.type === "content_block_delta") {
        return { content: parsed.delta.text, done: false };
      }
      if (parsed.type === "message_stop") {
        return { content: "", done: true };
      }
      return { content: "", done: false };
    }, onChunk, "data: ");
  }

  private async chatGemini(input: ChatInput, onChunk?: (chunk: ChatChunk) => void): Promise<string> {
    const apiKey = input.apiKey || ENV.geminiApiKey;
    if (!apiKey) throw new Error("Gemini API Key not configured");

    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${input.modelId}:streamGenerateContent?key=${apiKey}`;
    
    // Simplistic Gemini mapping
    const contents = input.messages.filter(m => m.role !== "system").map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    // Add system instruction if present
    const systemMessage = input.systemPrompt || input.messages.find(m => m.role === "system")?.content;
    const systemInstruction = systemMessage ? { parts: [{ text: systemMessage }] } : undefined;

    const body: any = { contents };
    if (systemInstruction) {
      body.systemInstruction = systemInstruction;
    }
    
    if (input.maxTokens || input.temperature !== undefined) {
      body.generationConfig = {
        maxOutputTokens: input.maxTokens,
        temperature: input.temperature,
      };
    }

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Gemini error: ${response.statusText}`);
    }

    if (!onChunk) {
      const data = await response.json();
      return data[0]?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    // Gemini stream is a continuous JSON array `[ {...}, {...} ]`.
    // The fetch API receives chunks that might break in the middle of JSON objects.
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Try to extract complete JSON objects from the buffer array format
      // Format is roughly: `[\n{\n  "candidates": [...]\n},\n{\n...`
      
      // Basic regex to find JSON objects that look like Gemini responses
      const regex = /{[^{}]*"candidates"[^{}]*}/g;
      // Note: This regex is overly simplistic for real-world nested JSON.
      // For robust Gemini streaming, it's safer to handle it line by line
      // or use a proper streaming JSON parser. Since Gemini returns a JSON array,
      // we can try splitting by lines and looking for "text": "..."
      
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep the last incomplete line in buffer
      
      for (const line of lines) {
        // Very simplistic extraction of text from Gemini's streaming output lines
        const match = line.match(/"text":\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
        if (match) {
          try {
            // Unescape the JSON string value
            const content = JSON.parse(`"${match[1]}"`);
            fullContent += content;
            onChunk({ content, done: false });
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
    
    // Process any remaining buffer
    const match = buffer.match(/"text":\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
    if (match) {
      try {
        const content = JSON.parse(`"${match[1]}"`);
        fullContent += content;
        onChunk({ content, done: false });
      } catch (e) {}
    }

    onChunk({ content: "", done: true });
    return fullContent;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async handleStream(
    response: Response,
    parser: (line: string) => { content: string; done: boolean },
    onChunk: (chunk: ChatChunk) => void,
    prefix: string = ""
  ): Promise<string> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        let cleanLine = line.trim();
        if (!cleanLine) continue;
        if (prefix && cleanLine.startsWith(prefix)) {
          cleanLine = cleanLine.slice(prefix.length);
        }

        try {
          const { content, done: isDone } = parser(cleanLine);
          if (content) {
            fullContent += content;
            onChunk({ content });
          }
          if (isDone) {
            onChunk({ content: "", done: true });
            return fullContent;
          }
        } catch (e) {
          // Ignore parse errors for partial lines
        }
      }
    }

    onChunk({ content: "", done: true });
    return fullContent;
  }

  /**
   * Discover available local Ollama models.
   */
  async discoverOllamaModels(): Promise<any[]> {
    const baseUrl = ENV.ollamaUrl || "http://localhost:11434";
    try {
      const res = await fetch(`${baseUrl}/api/tags`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.models || [];
    } catch {
      return [];
    }
  }
}
