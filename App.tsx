
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChessBoard } from './components/ChessBoard';
import { VoiceController } from './components/VoiceController';
import { ChatPanel } from './components/ChatPanel';
import { MoveHistory } from './components/MoveHistory';
import { LichessPuzzleCard } from './components/LichessPuzzleCard';
import { Chess } from 'chess.js';
import { MoveRecord, LichessPuzzle } from './types';
import { Mic, Bot, Trophy, Settings, BrainCircuit, History } from 'lucide-react';

const App: React.FC = () => {
  const [game, setGame] = useState(new Chess());
  const [history, setHistory] = useState<MoveRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'puzzle'>('chat');
  const [puzzle, setPuzzle] = useState<LichessPuzzle | null>(null);
  const [status, setStatus] = useState<string>('White to move');

  // Load Lichess Daily Puzzle
  useEffect(() => {
    fetch('https://lichess.org/api/puzzle/daily')
      .then(res => res.json())
      .then(data => setPuzzle(data))
      .catch(err => console.error("Failed to fetch Lichess puzzle", err));
  }, []);

  const makeMove = useCallback((moveStr: string) => {
    try {
      const chessCopy = new Chess(game.fen());
      const move = chessCopy.move(moveStr);
      
      if (move) {
        setGame(chessCopy);
        setHistory(prev => [...prev, {
          from: move.from,
          to: move.to,
          san: move.san,
          color: move.color,
          timestamp: Date.now()
        }]);
        
        const turn = chessCopy.turn() === 'w' ? 'White' : 'Black';
        if (chessCopy.isCheckmate()) setStatus(`Checkmate! ${move.color === 'w' ? 'White' : 'Black'} wins!`);
        else if (chessCopy.isDraw()) setStatus('Draw!');
        else if (chessCopy.isCheck()) setStatus(`${turn} to move (Check!)`);
        else setStatus(`${turn} to move`);
        
        return true;
      }
    } catch (e) {
      console.warn("Invalid move attempted", moveStr);
    }
    return false;
  }, [game]);

  const resetGame = () => {
    setGame(new Chess());
    setHistory([]);
    setStatus('White to move');
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className="w-16 flex flex-col items-center py-6 bg-slate-900 border-r border-slate-800 space-y-8">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
          GVC
        </div>
        <div className="flex flex-col space-y-4">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:bg-slate-800'}`}
          >
            <Bot size={24} />
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:bg-slate-800'}`}
          >
            <History size={24} />
          </button>
          <button 
            onClick={() => setActiveTab('puzzle')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'puzzle' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:bg-slate-800'}`}
          >
            <Trophy size={24} />
          </button>
        </div>
        <div className="mt-auto">
          <button className="p-3 text-slate-500 hover:bg-slate-800 rounded-xl transition-all">
            <Settings size={24} />
          </button>
        </div>
      </nav>

      {/* Main Board Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        <div className="max-w-4xl w-full flex flex-col items-center gap-8">
          
          <header className="w-full flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                Grandmaster Voice Chess
              </h1>
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${game.turn() === 'w' ? 'bg-white' : 'bg-slate-600'}`}></span>
                {status}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={resetGame}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-all"
              >
                New Game
              </button>
              <VoiceController game={game} onMove={makeMove} />
            </div>
          </header>

          <div className="relative group p-4 bg-slate-800/50 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-sm">
            <ChessBoard game={game} setGame={setGame} history={history} setHistory={setHistory} />
          </div>

          <div className="w-full flex justify-center gap-8 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
               <BrainCircuit size={16} className="text-indigo-400" />
               <span>Gemini Live Voice Controlled</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
               <Mic size={16} className="text-purple-400" />
               <span>Say "Move Knight to F3"</span>
            </div>
          </div>
        </div>
      </main>

      {/* Right Control Panel */}
      <aside className="w-96 flex flex-col bg-slate-900/50 border-l border-slate-800 backdrop-blur-md">
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'chat' && <ChatPanel game={game} />}
          {activeTab === 'history' && <MoveHistory history={history} />}
          {activeTab === 'puzzle' && <LichessPuzzleCard puzzle={puzzle} />}
        </div>
      </aside>
    </div>
  );
};

export default App;
