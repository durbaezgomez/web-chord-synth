import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';

export const Oscilloscope: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioEngine.getAnalyser();
    
    const draw = () => {
      if (!analyser) {
         animationId = requestAnimationFrame(draw);
         return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      // Screen Background - Deep black for OLED look
      ctx.fillStyle = '#000000'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines (subtle)
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Waveform - Sharp Cyan or Electric Blue
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#22d3ee'; 
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="relative">
      {/* Screen Bezel */}
      <div className="absolute inset-0 border-2 border-zinc-700 rounded pointer-events-none z-10 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]"></div>
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={100} 
        className="w-full h-24 bg-black rounded block"
      />
      <div className="flex justify-between px-1 mt-1">
        <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Master Out</span>
        <span className="text-[9px] text-zinc-500 uppercase tracking-widest">L/R</span>
      </div>
    </div>
  );
};