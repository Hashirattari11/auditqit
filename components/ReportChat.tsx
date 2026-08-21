'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatMessage { role: 'user' | 'assistant'; content: string; }

interface ReportChatProps {
  auditId: string;
}

export default function ReportChat({ auditId }: ReportChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  const suggested = [
    "How do I fix my LCP?",
    "What's my biggest issue?",
    "Explain my security score",
    "Give me a priority fix list",
  ];

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg = { role: 'user' as const, content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch(`/api/report/${auditId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error('Failed');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');

      let assistantMsg = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantMsg += parsed.content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: assistantMsg };
                  return updated;
                });
              }
            } catch {}
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple text-white shadow-lg shadow-accent-purple/20 hover:scale-110 transition-transform flex items-center justify-center text-xl">
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-120px)] bg-bg-surface border border-border-subtle rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="p-4 border-b border-border-subtle flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-sm">🤖</div>
            <div>
              <p className="font-semibold text-sm">AI Assistant</p>
              <p className="text-xs text-text-muted">Ask about this audit</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-text-muted text-sm mb-4">Ask me anything about this audit report</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggested.map(q => (
                    <button key={q} onClick={() => sendMessage(q)}
                      className="px-3 py-1.5 rounded-full text-xs bg-bg border border-border-subtle text-text-secondary hover:text-text-primary hover:border-primary/30 transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-br-md'
                    : 'bg-bg border border-border-subtle text-text-primary rounded-bl-md'
                }`}>
                  <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                </div>
              </div>
            ))}
            {isTyping && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                <div className="bg-bg border border-border-subtle rounded-2xl rounded-bl-md p-3 flex gap-1.5">
                  <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          {/* Suggested chips (shown when messages exist) */}
          {messages.length > 0 && !isTyping && (
            <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto">
              {suggested.map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="px-2.5 py-1 rounded-full text-[10px] bg-bg border border-border-subtle text-text-muted hover:text-text-primary whitespace-nowrap transition-colors flex-shrink-0">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border-subtle">
            <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about this report..."
                className="flex-1 bg-bg border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-colors" />
              <button type="submit" disabled={!input.trim() || isTyping}
                className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center text-sm hover:opacity-90 disabled:opacity-40 transition-opacity flex-shrink-0">
                ➤
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
