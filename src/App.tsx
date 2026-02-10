import React, { useEffect, useState, useRef, useCallback } from 'react';
import { XYController } from './components/XYController';
import { Keyboard } from './components/Keyboard';
import { Oscilloscope } from './components/Oscilloscope';
import { CHORD_MAP, CONTROL_KEYS } from './constants';
import { audioEngine } from './services/audioEngine';
import { XYPosition } from './types';

const App: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  const [xy, setXY] = useState<XYPosition>({ x: 0, y: 0 });
  const [subEnabled, setSubEnabled] = useState(false);
  
  const keysPressed = useRef<Set<string>>(new Set());
  const xyRef = useRef<XYPosition>({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);

  // Input Handling
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.repeat) return;
    const key = e.key.toLowerCase();
    keysPressed.current.add(key);

    if (CHORD_MAP[key]) {
      const chord = CHORD_MAP[key];
      audioEngine.triggerAttack(key, chord.baseFrequency, chord.quality);
      setActiveKeys(prev => [...prev, key]);
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    keysPressed.current.delete(key);

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

  const toggleSub = () => {
    const newState = !subEnabled;
    setSubEnabled(newState);
    audioEngine.setSubEnabled(newState);
  };

  // Joystick Physics Loop
  useEffect(() => {
    const loop = () => {
      // Target based physics for immediate responsiveness
      let targetX = 0;
      let targetY = 0;

      if (keysPressed.current.has(CONTROL_KEYS.LEFT)) targetX -= 1;
      if (keysPressed.current.has(CONTROL_KEYS.RIGHT)) targetX += 1;
      if (keysPressed.current.has(CONTROL_KEYS.UP)) targetY += 1;
      if (keysPressed.current.has(CONTROL_KEYS.DOWN)) targetY -= 1;

      // Smooth interpolation (Lerp)
      const smoothing = 0.15; // 0.1 to 0.2 provides a good 'physical' feel
      
      const dx = targetX - xyRef.current.x;
      const dy = targetY - xyRef.current.y;

      let newX = xyRef.current.x + dx * smoothing;
      let newY = xyRef.current.y + dy * smoothing;

      // Snap to target if very close to save resources/jitter
      if (Math.abs(targetX - newX) < 0.001) newX = targetX;
      if (Math.abs(targetY - newY) < 0.001) newY = targetY;

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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#121212] select-none font-mono">
      
      {/* The Device Chassis */}
      <div className="relative bg-zinc-800 p-8 rounded-lg shadow-2xl border-t border-zinc-700 w-full max-w-4xl">
        
        {/* Screw details (Visual fluff) */}
        <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center"><div className="w-1.5 h-px bg-zinc-700 rotate-45"></div></div>
        <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center"><div className="w-1.5 h-px bg-zinc-700 rotate-45"></div></div>
        <div className="absolute bottom-4 left-4 w-3 h-3 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center"><div className="w-1.5 h-px bg-zinc-700 rotate-45"></div></div>
        <div className="absolute bottom-4 right-4 w-3 h-3 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center"><div className="w-1.5 h-px bg-zinc-700 rotate-45"></div></div>

        {/* Branding Area */}
        <header className="mb-8 flex justify-between items-end border-b-2 border-zinc-900 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-widest text-zinc-100 flex items-center gap-2">
              <span className="w-4 h-4 bg-orange-500 inline-block rounded-sm"></span>
              <span className="text-zinc-500 font-normal">WEB</span>CHORD
            </h1>
            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">
              Vector Synthesis Module • REV 1.0
            </p>
          </div>
          <div className="text-[10px] text-zinc-500 text-right">
             <div className="flex items-center gap-1 justify-end">
               <div className={`w-2 h-2 rounded-full ${started ? 'bg-green-500' : 'bg-red-900'}`}></div>
               POWER
             </div>
          </div>
        </header>

        {!started ? (
          <div className="h-64 flex flex-col items-center justify-center bg-zinc-900/50 rounded border border-zinc-700 border-dashed">
            <button 
              onClick={startAudio}
              className="group relative px-8 py-3 bg-zinc-200 text-zinc-900 font-bold text-sm tracking-widest hover:bg-white transition-all border-b-4 border-zinc-400 active:border-b-0 active:translate-y-1"
            >
              INITIALIZE ENGINE
            </button>
            <p className="mt-4 text-[10px] text-zinc-500">CLICK TO START AUDIO CONTEXT</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
            
            {/* Left Panel: Modulation */}
            <div className="bg-zinc-900/30 p-4 rounded border border-zinc-700/50 flex flex-col items-center justify-center">
               <XYController position={xy} />
            </div>

            {/* Right Panel: Performance */}
            <div className="flex flex-col gap-6">
              
              {/* Screen Area */}
              <div className="bg-zinc-900 p-4 rounded border-2 border-zinc-950 shadow-inner">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] text-teal-500 font-bold uppercase">Signal Monitor</span>
                    <span className="text-[9px] text-zinc-600 font-mono">120 BPM</span>
                 </div>
                 <Oscilloscope />
                 <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                    <div className="text-[9px] text-zinc-500 uppercase">Voice Config</div>
                    <button 
                      onClick={toggleSub}
                      className={`
                        flex items-center gap-2 px-3 py-1 rounded border transition-all text-[10px] font-bold tracking-widest
                        ${subEnabled 
                          ? 'bg-orange-500/20 border-orange-500 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]' 
                          : 'bg-zinc-800 border-zinc-700 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400'
                        }
                      `}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${subEnabled ? 'bg-orange-500' : 'bg-zinc-700'}`}></div>
                      SUB OSC
                    </button>
                 </div>
              </div>

              {/* Controls */}
              <div className="mt-auto">
                 <Keyboard 
                    activeKeys={activeKeys}
                    onNoteStart={handleChordStart}
                    onNoteEnd={handleChordEnd}
                 />
              </div>

            </div>
          </div>
        )}
        
        {/* Footer Decals */}
        <div className="mt-8 pt-4 border-t border-zinc-700 flex justify-between text-[9px] text-zinc-600 uppercase">
           <div>Stereo Output</div>
           <div>Diatonic Chord System</div>
        </div>
      </div>
    </div>
  );
};

export default App;