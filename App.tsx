import React, { useEffect, useState, useRef, useCallback } from 'react';
import { XYController } from './components/XYController';
import { Keyboard } from './components/Keyboard';
import { Oscilloscope } from './components/Oscilloscope';
import { CHORD_MAP, CONTROL_KEYS } from './constants';
import { audioEngine } from './services/audioEngine';
import { XYPosition } from './types';

// Physics Config
const MOVE_SPEED = 0.08;
const SPRING_STRENGTH = 0.2; // How fast it snaps back to 0 (0-1)

const App: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  const [xy, setXY] = useState<XYPosition>({ x: 0, y: 0 });
  
  const keysPressed = useRef<Set<string>>(new Set());
  const xyRef = useRef<XYPosition>({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();

  // Input Handling
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.repeat) return;
    const key = e.key.toLowerCase();
    keysPressed.current.add(key);

    // Audio Trigger if it's a chord key
    if (CHORD_MAP[key]) {
      const chord = CHORD_MAP[key];
      audioEngine.triggerAttack(key, chord.baseFrequency, chord.quality);
      setActiveKeys(prev => [...prev, key]);
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    keysPressed.current.delete(key);

    // Audio Release
    if (CHORD_MAP[key]) {
      audioEngine.triggerRelease(key);
      setActiveKeys(prev => prev.filter(k => k !== key));
    }
  }, []);

  // UI Virtual Button Handlers
  const handleChordStart = (key: string) => {
    if (!keysPressed.current.has(key)) {
      keysPressed.current.add(key);
      const chord = CHORD_MAP[key];
      if (chord) {
        audioEngine.triggerAttack(key, chord.baseFrequency, chord.quality);
        setActiveKeys(prev => [...prev, key]);
      }
    }
  };

  const handleChordEnd = (key: string) => {
    if (keysPressed.current.has(key)) {
      keysPressed.current.delete(key);
      audioEngine.triggerRelease(key);
      setActiveKeys(prev => prev.filter(k => k !== key));
    }
  };

  const startAudio = () => {
    audioEngine.init();
    audioEngine.resume();
    setStarted(true);
  };

  // Joystick Physics Loop
  useEffect(() => {
    const loop = () => {
      let dx = 0;
      let dy = 0;

      const isUp = keysPressed.current.has(CONTROL_KEYS.UP);
      const isDown = keysPressed.current.has(CONTROL_KEYS.DOWN);
      const isLeft = keysPressed.current.has(CONTROL_KEYS.LEFT);
      const isRight = keysPressed.current.has(CONTROL_KEYS.RIGHT);
      const isHolding = isUp || isDown || isLeft || isRight;

      // Input Force
      if (isLeft) dx -= MOVE_SPEED;
      if (isRight) dx += MOVE_SPEED;
      if (isUp) dy += MOVE_SPEED;
      if (isDown) dy -= MOVE_SPEED;

      let newX = xyRef.current.x + dx;
      let newY = xyRef.current.y + dy;

      // Spring back to center if not holding any direction
      if (!isHolding) {
        newX = newX * (1 - SPRING_STRENGTH);
        newY = newY * (1 - SPRING_STRENGTH);
        // Snap to 0 if close
        if (Math.abs(newX) < 0.01) newX = 0;
        if (Math.abs(newY) < 0.01) newY = 0;
      }

      // Clamp
      newX = Math.max(-1, Math.min(1, newX));
      newY = Math.max(-1, Math.min(1, newY));

      if (newX !== xyRef.current.x || newY !== xyRef.current.y) {
        xyRef.current = { x: newX, y: newY };
        setXY({ x: newX, y: newY });
        audioEngine.setModulation(newX, newY);
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    if (started) {
        loop();
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [started]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-900 text-slate-200 select-none font-sans">
      
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-5xl font-black tracking-tighter text-white mb-2 italic">
          WEB<span className="text-cyan-400">HI</span>CHORD
        </h1>
        <p className="text-sm text-slate-500 tracking-widest uppercase">
          Diatonic Vector Synthesizer
        </p>
      </header>

      {!started ? (
        <button 
          onClick={startAudio}
          className="group relative px-10 py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-full shadow-[0_0_40px_rgba(8,145,178,0.4)] transition-all overflow-hidden"
        >
          <span className="relative z-10">INITIALIZE SYSTEM</span>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </button>
      ) : (
        <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-12 items-center justify-center">
          
          {/* XY Controller */}
          <div className="flex-shrink-0">
             <XYController position={xy} />
          </div>

          {/* Right Section: Chords & Visuals */}
          <div className="flex flex-col gap-6 w-full max-w-2xl">
            
            {/* Display */}
            <div className="bg-slate-800 p-1 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
               <div className="bg-black/40 p-4 rounded-xl">
                 <Oscilloscope />
               </div>
            </div>

            {/* Chord Bar */}
            <Keyboard 
               activeKeys={activeKeys}
               onNoteStart={handleChordStart}
               onNoteEnd={handleChordEnd}
            />
            
            {/* Instructions */}
             <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-500 uppercase tracking-wider">
               <div className="bg-slate-800/50 p-3 rounded border border-slate-700/50">
                 <strong className="text-cyan-400 block mb-1">1. Select Chord</strong>
                 Hold keys <span className="text-white">J K L ; U I O</span> to play scale degrees.
               </div>
               <div className="bg-slate-800/50 p-3 rounded border border-slate-700/50">
                 <strong className="text-cyan-400 block mb-1">2. Modulate</strong>
                 Use <span className="text-white">W A S D</span> to morph chord quality in real-time.
               </div>
             </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default App;
