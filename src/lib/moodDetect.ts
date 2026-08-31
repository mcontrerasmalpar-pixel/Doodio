/**
 * moodDetect.ts
 * Reads a DrawSoundProfile + animal preset and returns:
 *  - a Mood label
 *  - a generated phrase the pet would say
 *  - a short label that matches the mood
 */
import type { DrawSoundProfile } from "../hooks/useDrawSound";
import type { PetVoicePreset } from "../hooks/usePetVoice";

export type Mood =
  | "energetic"   // rojo, mucho trazo
  | "happy"       // amarillo/verde, brillante
  | "calm"        // azul/cian, poco trazo
  | "melancholic" // oscuro, saturación baja
  | "playful"     // naranja, medio trazo
  | "curious"     // violeta/rosa, cobertura media
  | "sleepy"      // gris/bajo brillo, poco trazo
  | "angry";      // rojo oscuro, mucho trazo, oscuro

export interface MoodResult {
  mood:   Mood;
  emoji:  string;
  label:  string;  // Spanish label
  phrase: string;  // What the pet says
}

const MOOD_EMOJI: Record<Mood, string> = {
  energetic:   "",
  happy:       "",
  calm:        "",
  melancholic: "",
  playful:     "",
  curious:     "",
  sleepy:      "",
  angry:       "",
};
