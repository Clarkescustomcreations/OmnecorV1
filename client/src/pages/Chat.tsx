import OmnecorDashboardLayout from "@/components/OmnecorDashboardLayout";
import ChatInterface from "@/components/ChatInterface";
import ContextTransparencyIndicator from "@/components/ContextTransparencyIndicator";
import VisualContextMap from "@/components/VisualContextMap";
import { MessageCircle } from "lucide-react";
import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { ChatMessage } from "@/types/chat"; // Assuming type is defined here based on usage

interface SelectedModel {
  providerId: 'ollama' | 'anthropic' | 'openai' | 'gemini' | 'groq';
  modelId: string;
  apiKey?: string;
  baseUrl?: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const [selectedModel] = useState<SelectedModel | undefined>(() => {
    try {
      const s = localStorage.getItem('omnecor:selectedModel');
      return s ? JSON.parse(s) : undefined;
    } catch { return undefined; }
  });

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      tokens: Math.ceil(content.length / 4),
    };
    setMessages(prev => [...prev, userMsg]);

    // Demo mode fallback (no model configured)
    if (!selectedModel) {
      setIsStreaming(true);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          content: 'Demo mode — select a model in Model Hub to enable real responses.',
          timestamp: new Date(),
          tokens: 18,
        }]);
        setIsStreaming(false);
      }, 600);
      return;
    }

    setIsStreaming(true);
    const assistantId = crypto.randomUUID();
    let assistantContent = '';

    setMessages(prev => [...prev, {
      id: assistantId, role: 'assistant', content: '', timestamp: new Date(), tokens: 0,
    }]);

    const sub = trpc.aiProvider.chatStream.subscribe(
      {
        providerId: selectedModel.providerId,
        modelId: selectedModel.modelId,
        apiKey: selectedModel.apiKey,
        baseUrl: selectedModel.baseUrl,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      },
      {
        onData(chunk) {
          assistantContent += chunk.delta;
          setMessages(prev => prev.map(m =>
            m.id === assistantId
              ? { ...m, content: assistantContent, tokens: chunk.totalTokens ?? Math.ceil(assistantContent.length / 4) }
              : m
          ));
          if (chunk.done) {
            setIsStreaming(false);
            sub.unsubscribe();
          }
        },
        onError(err) {
          console.error('[chat stream error]', err);
          setMessages(prev => prev.map(m =>
            m.id === assistantId
              ? { ...m, content: `Error: ${err.message}`, metadata: { error: err.message } }
              : m
          ));
          setIsStreaming(false);
        },
      }
    );
  }, [messages, isStreaming, selectedModel]);

  const handleClearHistory = useCallback(() => {
    if (confirm("Are you sure you want to clear the conversation history?")) {
      setMessages([]);
    }
  }, []);

  return (
    <OmnecorDashboardLayout>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-accent" />
            <div>
              <h1 className="text-xl font-bold">Chat</h1>
              <p className="text-sm text-muted-foreground">
                Conversational AI with context transparency and file management
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-6 p-6 overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <ChatInterface
              messages={messages}
              isLoading={isStreaming}
              onSendMessage={handleSendMessage}
              onClearHistory={handleClearHistory}
              className="flex-1"
            />
          </div>

          {/* Context Panel */}
          <div className="w-80 flex flex-col gap-4 overflow-hidden">
            <ContextTransparencyIndicator
              transparency={0} // Placeholder, needs proper calculation
              className="flex-shrink-0"
            />

            <VisualContextMap
              files={[]} // Placeholder
              onToggleFile={() => {}}
              onRemoveFile={() => {}}
              className="flex-1 min-h-0"
            />
          </div>
        </div>
      </div>
    </OmnecorDashboardLayout>
  );
}
