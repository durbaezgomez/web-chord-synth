import React from 'react';
import { XYPosition } from '../types';

interface XYControllerProps {
  position: XYPosition;
}

export const XYController: React.FC<XYControllerProps> = ({ position }) => {
  // Convert -1 to 1 range into percentage 0 to 100
  const leftPercent = ((position.x + 1) / 2) * 100;
  const topPercent = (1 - (position.y + 1) / 2) * 100;

  // Grid Labels - using short codes for cleaner look
  const gridCells = [
    { label: 'AUG', class: 'border-r border-b' },
    { label: 'M/m', class: 'border-r border-b' },
    { label: '7', class: 'border-b' },
    { label: 'DIM', class: 'border-r border-b' },
    { label: '●', class: 'border-r border-b bg-zinc-800/50' },
    { label: 'M7', class: 'border-b' },
    { label: '6', class: 'border-r' },
    { label: 'SUS4', class: 'border-r' },
    { label: '9', class: '' },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2 w-full flex justify-between">
        <span>Modulator</span>
        <span>X/Y</span>
      </div>
      
      <div className="relative w-64 h-64 bg-zinc-900 rounded border border-zinc-700 shadow-inner overflow-hidden select-none">
        
        {/* 3x3 Grid Background - Technical Lines */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 text-zinc-600">
          {gridCells.map((cell, i) => (
            <div key={i} className={`flex items-center justify-center border-zinc-800 ${cell.class}`}>
              <span className="text-[9px] font-bold text-zinc-600 font-mono">
                {cell.label}
              </span>
            </div>
          ))}
        </div>

        {/* Crosshairs */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div 
                className="absolute w-px h-full bg-orange-500/20" 
                style={{ left: `${leftPercent}%` }}
            ></div>
            <div 
                className="absolute h-px w-full bg-orange-500/20" 
                style={{ top: `${topPercent}%` }}
            ></div>
        </div>

        {/* The Puck - Minimal Square Cursor */}
        <div 
          className="absolute w-3 h-3 border-2 border-orange-500 bg-transparent transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out z-10"
          style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
        >
        </div>

        {/* Coordinates */}
        <div className="absolute bottom-1 right-1 text-[9px] font-mono text-zinc-500 tabular-nums">
          {position.x.toFixed(1)}, {position.y.toFixed(1)}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex gap-2 mt-3 text-[9px] text-zinc-500 font-mono">
         <span className="bg-zinc-800 px-1 rounded border border-zinc-700">W</span>
         <span className="bg-zinc-800 px-1 rounded border border-zinc-700">A</span>
         <span className="bg-zinc-800 px-1 rounded border border-zinc-700">S</span>
         <span className="bg-zinc-800 px-1 rounded border border-zinc-700">D</span>
      </div>
    </div>
  );
};