import React from 'react';
import { CHORD_MAP } from '../constants';

interface KeyboardProps {
  activeKeys: string[];
  onNoteStart: (key: string) => void;
  onNoteEnd: (key: string) => void;
}

const KEY_ORDER = ['j', 'k', 'l', ';', 'u', 'i', 'o'];

export const Keyboard: React.FC<KeyboardProps> = ({ activeKeys, onNoteStart, onNoteEnd }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2 border-b border-zinc-800 pb-1">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Chord Trigger</h3>
        <span className="text-[9px] text-zinc-600">BANK: C MAJOR</span>
      </div>
      
      <div className="flex justify-between gap-1 sm:gap-2">
        {KEY_ORDER.map((k) => {
          const chord = CHORD_MAP[k];
          const isActive = activeKeys.includes(k);
          
          // Physical Key Styling
          // "Neutral" state: Light grey/white key, dark text
          // "Active" state: Bright Orange key, white text
          
          let baseClasses = "relative w-full h-24 sm:h-32 rounded-sm border-b-4 transition-all duration-75 flex flex-col items-center justify-between py-3 sm:py-4 select-none active:border-b-0 active:translate-y-1 active:mt-1";
          
          let stateClasses = "";
          
          if (isActive) {
            // Active State (Pressed)
            stateClasses = "bg-orange-500 border-orange-700 text-white mt-1 border-b-0 translate-y-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]";
          } else {
            // Default State
            // Visual differentiation for Major vs Minor chords
            if (chord.quality === 'Major') {
                stateClasses = "bg-zinc-200 border-zinc-400 text-zinc-900 hover:bg-white";
            } else if (chord.quality === 'Minor') {
                stateClasses = "bg-zinc-300 border-zinc-500 text-zinc-900 hover:bg-zinc-200";
            } else {
                // Diminished
                stateClasses = "bg-zinc-400 border-zinc-600 text-zinc-900 hover:bg-zinc-300";
            }
          }

          return (
            <button
              key={k}
              className={`${baseClasses} ${stateClasses}`}
              onMouseDown={() => onNoteStart(k)}
              onMouseUp={() => onNoteEnd(k)}
              onMouseLeave={() => onNoteEnd(k)}
              onTouchStart={(e) => { e.preventDefault(); onNoteStart(k); }}
              onTouchEnd={(e) => { e.preventDefault(); onNoteEnd(k); }}
            >
              {/* LED Indicator */}
              <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white shadow-[0_0_5px_white]' : 'bg-zinc-400/50'}`}></div>

              <div className="flex flex-col items-center gap-1">
                <span className="text-sm sm:text-lg font-bold tracking-tighter">{chord.degree}</span>
                <span className="text-[9px] font-mono opacity-60 uppercase">{chord.noteName}</span>
              </div>
              
              <div className="text-[9px] font-mono border border-black/10 px-1 rounded text-black/40">
                {k.toUpperCase()}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};