
import React from 'react';
import { MoveRecord } from '../types';

interface MoveHistoryProps {
  history: MoveRecord[];
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ history }) => {
  const pairs = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      white: history[i],
      black: history[i + 1]
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="font-semibold">Notation</h2>
        <span className="text-xs text-slate-500">{history.length} moves</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="text-slate-500 text-xs text-left">
            <tr>
              <th className="p-2 font-normal w-12 text-center">#</th>
              <th className="p-2 font-normal">White</th>
              <th className="p-2 font-normal">Black</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {pairs.map((p, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-800/30' : ''}>
                <td className="p-2 text-center text-slate-500 font-mono text-xs">{idx + 1}.</td>
                <td className="p-2 font-medium">{p.white.san}</td>
                <td className="p-2 font-medium">{p.black?.san || ''}</td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={3} className="p-12 text-center text-slate-600 italic">No moves yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
