
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, Blob, Type, FunctionDeclaration } from '@google/genai';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Chess } from 'chess.js';

// Base64 Helpers
function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface VoiceControllerProps {
  game: Chess;
  onMove: (move: string) => boolean;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({ game, onMove }) => {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const nextStartTimeRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const streamRef = useRef<MediaStream | null>(null);

  const makeMoveTool: FunctionDeclaration = {
    name: 'make_move',
    description: 'Executes a chess move spoken by the user.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        move: {
          type: Type.STRING,
          description: 'The move in standard algebraic notation (e.g. e4, Nf3, O-O) or from-to format (e.g. e2e4).'
        }
      },
      required: ['move']
    }
  };

  const startSession = async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    
    streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          console.log('Gemini Live session opened');
          const source = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current!);
          const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
          
          scriptProcessor.onaudioprocess = (e) => {
            if (!isActive) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const l = inputData.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) {
              int16[i] = inputData[i] * 32768;
            }
            const pcmBlob: Blob = {
              data: encode(new Uint8Array(int16.buffer)),
              mimeType: 'audio/pcm;rate=16000',
            };
            sessionPromiseRef.current?.then(session => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };
          
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputAudioContextRef.current!.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          // Handle tool calls
          if (message.toolCall) {
            for (const fc of message.toolCall.functionCalls) {
              if (fc.name === 'make_move') {
                const moveStr = (fc.args as any).move;
                const success = onMove(moveStr);
                const result = success ? `Moved ${moveStr}` : `Invalid move: ${moveStr}`;
                
                sessionPromiseRef.current?.then(session => {
                  session.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result },
                    }
                  });
                });
              }
            }
          }

          // Handle audio output
          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio && !isMuted) {
            const ctx = audioContextRef.current!;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sourcesRef.current.add(source);
            source.onended = () => sourcesRef.current.delete(source);
          }

          if (message.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => s.stop());
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }
        },
        onerror: (e) => console.error('Gemini Live error', e),
        onclose: () => console.log('Gemini Live session closed'),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: `You are a professional chess voice assistant. 
        You help the user make moves on the board. 
        When they say a move, use the 'make_move' tool. 
        Be concise, encouraging, and sound like a sophisticated grandmaster.
        Current board state (FEN): ${game.fen()}.
        History of moves: ${game.history().join(', ')}.`,
        tools: [{ functionDeclarations: [makeMoveTool] }]
      }
    });

    sessionPromiseRef.current = sessionPromise;
  };

  const stopSession = () => {
    sessionPromiseRef.current?.then(session => session.close());
    streamRef.current?.getTracks().forEach(t => t.stop());
    setIsActive(false);
  };

  const toggleVoice = () => {
    if (isActive) {
      stopSession();
    } else {
      setIsActive(true);
      startSession();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => setIsMuted(!isMuted)}
        className={`p-2 rounded-full transition-all ${isMuted ? 'text-rose-400 bg-rose-400/10' : 'text-slate-400 hover:bg-slate-800'}`}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
      <button 
        onClick={toggleVoice}
        className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all shadow-lg ${
          isActive 
            ? 'bg-rose-500 text-white shadow-rose-500/30 animate-pulse' 
            : 'bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-500'
        }`}
      >
        {isActive ? <MicOff size={18} /> : <Mic size={18} />}
        {isActive ? 'Stop Listening' : 'Voice Control'}
      </button>
    </div>
  );
};
