
import React from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { MoveRecord } from '../types';

interface ChessBoardProps {
  game: Chess;
  setGame: (game: Chess) => void;
  history: MoveRecord[];
  setHistory: (history: (prev: MoveRecord[]) => MoveRecord[]) => void;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({ game, setGame, setHistory }) => {
  function onDrop(sourceSquare: string, targetSquare: string) {
    try {
      const chessCopy = new Chess(game.fen());
      const move = chessCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // always promote to queen for simplicity
      });

      if (move === null) return false;

      setGame(chessCopy);
      setHistory(prev => [...prev, {
        from: move.from,
        to: move.to,
        san: move.san,
        color: move.color,
        timestamp: Date.now()
      }]);
      return true;
    } catch (e) {
      return false;
    }
  }

  return (
    <div className="w-[500px] h-[500px]">
      <Chessboard 
        position={game.fen()} 
        onPieceDrop={onDrop}
        boardOrientation="white"
        customDarkSquareStyle={{ backgroundColor: '#1e293b' }}
        customLightSquareStyle={{ backgroundColor: '#334155' }}
        animationDuration={300}
      />
    </div>
  );
};
