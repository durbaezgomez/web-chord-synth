import { ChordQuality } from '../types';

interface Voice {
  oscillators: OscillatorNode[];
  gainNodes: GainNode[]; // Individual gains for harmonics/intervals
  masterGain: GainNode;
  subGain: GainNode; // Control sub volume
  baseFreq: number;
  baseQuality: ChordQuality;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private output: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private filter: BiquadFilterNode | null = null;
  
  private activeVoices: Map<string, Voice> = new Map();
  
  // Current Modulation State
  private currentX: number = 0;
  private currentY: number = 0;
  
  // Global Settings
  private subEnabled: boolean = false;

  // Constants
  // We allocate 4 oscillators per voice to handle up to 9th chords
  private OSC_COUNT = 4;

  public init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    this.output = this.ctx.createGain();
    this.output.gain.value = 0.4;

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 3000; 

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;

    // Chain
    this.output.connect(this.filter);
    this.filter.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSubEnabled(enabled: boolean) {
    this.subEnabled = enabled;
    if (this.ctx) {
      const now = this.ctx.currentTime;
      this.activeVoices.forEach(voice => {
        voice.subGain.gain.setTargetAtTime(enabled ? 0.35 : 0, now, 0.1);
      });
    }
  }

  /**
   * Determine intervals (semitones) based on Base Quality and Joystick Position
   * Returns array of semitones relative to root.
   */
  private getIntervals(quality: ChordQuality, x: number, y: number): number[] {
    // 3x3 Grid Logic
    // Thresholds
    const T = 0.35; 
    
    // Default Intervals
    let intervals: number[] = [];

    // Helper: Determine Zone
    const isCenter = Math.abs(x) < T && Math.abs(y) < T;
    const isUp = y > T && Math.abs(x) < T;
    const isDown = y < -T && Math.abs(x) < T;
    const isRight = x > T && Math.abs(y) < T;
    const isLeft = x < -T && Math.abs(y) < T;
    const isTopRight = x > T && y > T;
    const isTopLeft = x < -T && y > T;
    const isBottomRight = x > T && y < -T;
    const isBottomLeft = x < -T && y < -T;

    // Base Structures
    const M3 = 4;
    const m3 = 3;
    const P5 = 7;
    const d5 = 6;
    const A5 = 8;
    const M7 = 11;
    const m7 = 10;
    const P4 = 5;
    const M2 = 2; // sus2
    const M9 = 14; 

    // 1. BASE (Center)
    if (isCenter) {
      if (quality === 'Major') return [0, M3, P5];
      if (quality === 'Minor') return [0, m3, P5];
      if (quality === 'Diminished') return [0, m3, d5];
    }

    // 2. UP (Toggle Maj/Min)
    if (isUp) {
      if (quality === 'Major') return [0, m3, P5]; // Become Minor
      if (quality === 'Minor') return [0, M3, P5]; // Become Major
      if (quality === 'Diminished') return [0, m3, P5]; // Become Minor (Resolve dim)
    }

    // 3. DOWN (Sus4)
    if (isDown) {
      return [0, P4, P5];
    }

    // 4. RIGHT (Maj7 / m7)
    if (isRight) {
      if (quality === 'Major') return [0, M3, P5, M7];
      if (quality === 'Minor') return [0, m3, P5, m7];
      if (quality === 'Diminished') return [0, m3, d5, m7]; // Half-diminished
    }

    // 5. LEFT (Dim)
    if (isLeft) {
      return [0, m3, d5, 9]; // Full dim7 (semitone 9 is diminished 7th)
    }

    // 6. TOP-RIGHT (Dom7)
    if (isTopRight) {
      return [0, M3, P5, m7];
    }

    // 7. TOP-LEFT (Aug)
    if (isTopLeft) {
      return [0, M3, A5];
    }

    // 8. BOTTOM-RIGHT (Add 9)
    if (isBottomRight) {
      // Add 9 to base
      if (quality === 'Major') return [0, M3, P5, M9];
      if (quality === 'Minor') return [0, m3, P5, M9];
      return [0, m3, d5, M9];
    }

    // 9. BOTTOM-LEFT (Sus2)
    if (isBottomLeft) {
      return [0, M2, P5];
    }

    return [0, M3, P5]; // Fallback
  }

  public setModulation(x: number, y: number) {
    this.currentX = x;
    this.currentY = y;
    this.updateActiveVoices();
  }

  private updateActiveVoices() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    this.activeVoices.forEach((voice) => {
      const intervals = this.getIntervals(voice.baseQuality, this.currentX, this.currentY);
      
      // Update each oscillator
      for (let i = 0; i < this.OSC_COUNT; i++) {
        const osc = voice.oscillators[i];
        const gain = voice.gainNodes[i];
        
        if (i < intervals.length) {
          // Note is active in this chord shape
          const semitones = intervals[i];
          const freq = voice.baseFreq * Math.pow(2, semitones / 12);
          
          // Ramp frequency smoothly for glide effect
          osc.frequency.setTargetAtTime(freq, now, 0.05);
          
          // Ensure audible
          gain.gain.setTargetAtTime(0.3, now, 0.05);
        } else {
          // Note not used in this shape (e.g. triad vs 7th), mute it
          gain.gain.setTargetAtTime(0, now, 0.05);
        }
      }
    });
  }

  public triggerAttack(key: string, baseFreq: number, quality: ChordQuality) {
    if (!this.ctx || !this.output) this.init();
    this.resume();
    
    if (this.activeVoices.has(key)) return; 

    const now = this.ctx!.currentTime;
    
    // Master voice gain (envelope)
    const masterGain = this.ctx!.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(1, now + 0.02);
    masterGain.connect(this.output!);

    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];

    // Create pool of chord oscillators
    for (let i = 0; i < this.OSC_COUNT; i++) {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      
      // Initial Setup
      osc.type = i === 0 ? 'triangle' : 'sawtooth'; // Root is triangle for bass, others saw
      if (i > 0) osc.detune.value = (Math.random() - 0.5) * 15; // Detune harmonies

      g.gain.value = 0; // Start muted, updateActiveVoices will unmute needed ones
      
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      
      oscillators.push(osc);
      gainNodes.push(g);
    }

    // Create Sub Oscillator
    const subOsc = this.ctx!.createOscillator();
    const subGain = this.ctx!.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.value = baseFreq / 4; // 2 Octaves down
    
    subGain.gain.setValueAtTime(this.subEnabled ? 0.35 : 0, now);
    
    subOsc.connect(subGain);
    subGain.connect(masterGain);
    subOsc.start(now);
    
    // Add subOsc to oscillators array so it gets cleaned up by triggerRelease
    // But we don't add subGain to gainNodes because it's controlled separately
    oscillators.push(subOsc);

    const voice: Voice = {
      oscillators,
      gainNodes,
      masterGain,
      subGain,
      baseFreq,
      baseQuality: quality
    };

    this.activeVoices.set(key, voice);

    // Apply immediate tuning based on current XY
    // We call this via a small timeout or directly to ensure initial intervals are correct
    this.updateActiveVoices();
  }

  public triggerRelease(key: string) {
    if (!this.ctx) return;
    const voice = this.activeVoices.get(key);
    if (voice) {
      const now = this.ctx.currentTime;
      
      voice.masterGain.gain.cancelScheduledValues(now);
      voice.masterGain.gain.setValueAtTime(voice.masterGain.gain.value, now);
      voice.masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      voice.oscillators.forEach(osc => osc.stop(now + 0.25));
      
      this.activeVoices.delete(key);
    }
  }
}

export const audioEngine = new AudioEngine();