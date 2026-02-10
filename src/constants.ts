import { ChordConfig } from './types';

// Frequencies for C4 Major Scale
// C4, D4, E4, F4, G4, A4, B4
const FREQ = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.00,
  A4: 440.00,
  B4: 493.88
};

// Mapping keys to Diatonic Scale Degrees (Key of C)
// Using JKL; (Home row right) and UIO (Upper row right) to form 7 keys
export const CHORD_MAP: Record<string, ChordConfig> = {
  'j': { degree: 'I',   noteName: 'C Maj',  baseFrequency: FREQ.C4, quality: 'Major',      key: 'j' },
  'k': { degree: 'ii',  noteName: 'D min',  baseFrequency: FREQ.D4, quality: 'Minor',      key: 'k' },
  'l': { degree: 'iii', noteName: 'E min',  baseFrequency: FREQ.E4, quality: 'Minor',      key: 'l' },
  ';': { degree: 'IV',  noteName: 'F Maj',  baseFrequency: FREQ.F4, quality: 'Major',      key: ';' },
  'u': { degree: 'V',   noteName: 'G Maj',  baseFrequency: FREQ.G4, quality: 'Major',      key: 'u' },
  'i': { degree: 'vi',  noteName: 'A min',  baseFrequency: FREQ.A4, quality: 'Minor',      key: 'i' },
  'o': { degree: 'vii°',noteName: 'B dim',  baseFrequency: FREQ.B4, quality: 'Diminished', key: 'o' },
};

export const CONTROL_KEYS = {
  UP: 'w',
  DOWN: 's',
  LEFT: 'a',
  RIGHT: 'd'
};
