
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage } from '../types';
import { Send, Sparkles, Loader2, BrainCircuit } from 'lucide-react';
import { Chess } from 'chess.js';

interface ChatPanelProps {
  game: Chess;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ game }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "Hello! I'm your AI Grandmaster coach. Ask me about your position, strategy, or for a move suggestion!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      // Using gemini-3-pro-preview with thinking budget for complex analysis
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
          { role: 'user', parts: [{ text: `Current Chess Game State:
            FEN: ${game.fen()}
            History: ${game.history().join(', ')}
            Turn: ${game.turn() === 'w' ? 'White' : 'Black'}
            
            User Message: ${userMsg}` }] }
        ],
        config: {
          systemInstruction: 'You are a high-level chess grandmaster coach. Analyze the user position deeply. Use your thinking budget to evaluate tactical and strategic nuances. Provide clear, educational, and inspiring advice.',
          thinkingConfig: { thinkingBudget: 32768 }
        }
      });

      const content = response.text || "I'm sorry, I couldn't generate a strategy at this moment.";
      // In a real scenario, we might extract thinking parts if the API returned them separately.
      // For now we assume standard text response.
      setMessages(prev => [...prev, { role: 'model', content }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "Error communicating with the coach. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-amber-400" />
          <h2 className="font-semibold">AI Grandmaster Coach</h2>
        </div>
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500 font-bold px-2 py-0.5 bg-slate-800 rounded">
          <BrainCircuit size={10} />
          Thinking Mode Active
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none shadow-lg'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/50 p-4 rounded-2xl rounded-tl-none border border-slate-700/50 flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span className="text-xs text-slate-400 italic">Evaluating position with Deep Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-900/50 border-t border-slate-800">
        <div className="relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask for advice or analysis..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-100"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
