
import React from 'react';
import { LichessPuzzle } from '../types';
import { ExternalLink, Trophy, Users, Star } from 'lucide-react';

interface LichessPuzzleCardProps {
  puzzle: LichessPuzzle | null;
}

export const LichessPuzzleCard: React.FC<LichessPuzzleCardProps> = ({ puzzle }) => {
  if (!puzzle) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
          <p>Fetching Lichess Daily Puzzle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-800 flex items-center gap-2">
        <Trophy size={18} className="text-amber-400" />
        <h2 className="font-semibold">Daily Lichess Puzzle</h2>
      </div>
      
      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 shadow-xl">
           <div className="flex justify-between items-start mb-4">
              <div>
                <span className="inline-block px-2 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded border border-indigo-500/20 mb-2">
                  Daily Challenge
                </span>
                <h3 className="text-lg font-bold text-slate-100">Rating: {puzzle.puzzle.rating}</h3>
              </div>
              <div className="flex items-center gap-1 text-amber-400">
                <Star size={16} fill="currentColor" />
                <span className="font-bold">{puzzle.puzzle.plays} plays</span>
              </div>
           </div>

           <div className="space-y-4 mb-6">
             <div className="flex items-center justify-between text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  <span>Players</span>
                </div>
                <div className="font-medium text-slate-200">
                  {puzzle.game.players.map(p => p.name).join(' vs ')}
                </div>
             </div>
             <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Format</span>
                <span className="text-slate-200 bg-slate-700 px-2 py-0.5 rounded text-xs">{puzzle.game.perf.name}</span>
             </div>
           </div>

           <div className="flex flex-wrap gap-2 mb-6">
             {puzzle.puzzle.themes.slice(0, 4).map(theme => (
               <span key={theme} className="px-2 py-1 bg-slate-900 text-slate-400 text-[10px] rounded border border-slate-800">
                 #{theme.replace(/([A-Z])/g, ' $1').trim()}
               </span>
             ))}
           </div>

           <a 
             href={`https://lichess.org/training/${puzzle.puzzle.id}`}
             target="_blank"
             rel="noreferrer"
             className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
           >
             Solve on Lichess
             <ExternalLink size={16} />
           </a>
        </div>

        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/50 text-xs text-slate-500 italic text-center">
           Tip: You can use Voice Control to analyze this puzzle with the AI Coach!
        </div>
      </div>
    </div>
  );
};
