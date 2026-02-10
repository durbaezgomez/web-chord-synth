import React from 'react';
import { XYPosition } from '../types';

interface XYControllerProps {
  position: XYPosition;
}

export const XYController: React.FC<XYControllerProps> = ({ position }) => {
  // Convert -1 to 1 range into percentage 0 to 100
  const leftPercent = ((position.x + 1) / 2) * 100;
  const topPercent = (1 - (position.y + 1) / 2) * 100;

  // Grid Labels
  const gridCells = [
    { label: 'AUG', class: 'border-r border-b' },
    { label: 'MAJ/MIN', class: 'border-r border-b' },
    { label: 'DOM 7', class: 'border-b' },
    { label: 'DIM', class: 'border-r border-b' },
    { label: 'BASE', class: 'border-r border-b bg-slate-700/30' },
    { label: 'MAJ7/m7', class: 'border-b' },
    { label: '6/SUS2', class: 'border-r' },
    { label: 'SUS4', class: 'border-r' },
    { label: 'ADD 9', class: '' },
  ];

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-72 h-72 bg-slate-800 rounded-xl border-4 border-slate-700 shadow-2xl overflow-hidden select-none">
        
        {/* 3x3 Grid Background */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
          {gridCells.map((cell, i) => (
            <div key={i} className={`flex items-center justify-center border-slate-600/50 ${cell.class}`}>
              <span className="text-[10px] font-bold text-slate-500 tracking-wider text-center px-1">
                {cell.label}
              </span>
            </div>
          ))}
        </div>

        {/* The Puck */}
        <div 
          className="absolute w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.6)] transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out z-10"
          style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
        >
           <div className="absolute inset-2 bg-white/40 rounded-full"></div>
        </div>

        {/* Info Overlay */}
        <div className="absolute bottom-1 right-2 text-[10px] font-mono text-cyan-400 opacity-50 z-20">
          X:{position.x.toFixed(1)} Y:{position.y.toFixed(1)}
        </div>
      </div>
      
      <div className="text-center">
        <div className="inline-block bg-slate-800 rounded-full px-4 py-2 border border-slate-700">
             <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                <span>MODULATION</span>
                <div className="flex gap-1">
                   <kbd className="bg-slate-700 px-1.5 rounded border-b border-slate-900">W</kbd>
                   <kbd className="bg-slate-700 px-1.5 rounded border-b border-slate-900">A</kbd>
                   <kbd className="bg-slate-700 px-1.5 rounded border-b border-slate-900">S</kbd>
                   <kbd className="bg-slate-700 px-1.5 rounded border-b border-slate-900">D</kbd>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};
