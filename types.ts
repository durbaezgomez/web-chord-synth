export type ChordQuality = 'Major' | 'Minor' | 'Diminished';

export interface ChordConfig {
  degree: string;     // e.g., "I", "ii"
  noteName: string;   // e.g., "C", "Dm"
  baseFrequency: number;
  quality: ChordQuality;
  key: string;        // Keyboard key
}

export interface XYPosition {
  x: number; // -1 to 1
  y: number; // -1 to 1
}

export interface SynthState {
  activeKeys: string[];
  xy: XYPosition;
}