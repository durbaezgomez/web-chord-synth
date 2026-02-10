import React from 'react';
import { CHORD_MAP } from '../constants';

interface KeyboardProps {
  activeKeys: string[];
  onNoteStart: (key: string) => void;
  onNoteEnd: (key: string) => void;
}

// Ensure correct order: J K L ; U I O
const KEY_ORDER = ['j', 'k', 'l', ';', 'u', 'i', 'o'];

export const Keyboard: React.FC<KeyboardProps> = ({ activeKeys, onNoteStart, onNoteEnd }) => {
  return (
    <div className="w-full max-w-2xl bg-slate-800 p-6 rounded-2xl border-t-4 border-slate-700 shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chord Triggers (C Major)</h3>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {KEY_ORDER.map((k) => {
          const chord = CHORD_MAP[k];
          const isActive = activeKeys.includes(k);
          
          let colorClass = "bg-slate-700 border-slate-600 text-slate-400";
          if (isActive) {
            colorClass = "bg-cyan-500 border-cyan-400 text-white shadow-[0_0_20px_rgba(34,211,238,0.5)] scale-95";
          } else if (chord.quality === 'Major') {
            colorClass = "bg-slate-200 border-white text-slate-800 hover:bg-white";
          } else if (chord.quality === 'Minor') {
            colorClass = "bg-slate-600 border-slate-500 text-slate-200 hover:bg-slate-500";
          } else {
             // Diminished
             colorClass = "bg-slate-800 border-slate-600 text-slate-500 hover:bg-slate-700";
          }

          return (
            <button
              key={k}
              className={`
                relative h-32 rounded-lg border-b-4 transition-all duration-100 flex flex-col items-center justify-end pb-4 group
                ${colorClass}
              `}
              onMouseDown={() => onNoteStart(k)}
              onMouseUp={() => onNoteEnd(k)}
              onMouseLeave={() => onNoteEnd(k)}
              onTouchStart={(e) => { e.preventDefault(); onNoteStart(k); }}
              onTouchEnd={(e) => { e.preventDefault(); onNoteEnd(k); }}
            >
              <div className="absolute top-3 text-2xl font-black opacity-30">{chord.degree}</div>
              <div className="text-sm font-bold">{chord.noteName}</div>
              <div className="text-[10px] opacity-70 mt-1 uppercase">{chord.quality}</div>
              <div className="absolute top-1 right-2 text-[10px] opacity-40 font-mono border border-current px-1 rounded">
                {k.toUpperCase()}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
