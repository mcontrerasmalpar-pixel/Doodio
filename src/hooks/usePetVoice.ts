import { useRef, useState, useCallback, useEffect } from "react";

// Only real animals — no robots, babies or dinosaurs
export type PetVoicePreset =
  | "cat" | "dog" | "bird" | "frog" | "rabbit" | "hamster" | "cow" | "lion";

export interface PetVoiceConfig {
  preset: PetVoicePreset;
  pitch: number;
  rate: number;
  pitchShift: number;
  robotize: boolean;
  echo: boolean;
}

export const PRESETS: Record<PetVoicePreset, Omit<PetVoiceConfig,"preset">> = {
  cat: { pitch: 2.0, rate: 1.1, pitchShift: 7, robotize: false, echo: false },
  dog: { pitch: 0.6, rate: 0.9, pitchShift: -3, robotize: false, echo: false },
  bird: { pitch: 3.8, rate: 1.4, pitchShift: 12, robotize: false, echo: true },
  frog: { pitch: 0.4, rate: 0.7, pitchShift: -6, robotize: false, echo: false },
  rabbit: { pitch: 2.8, rate: 1.2, pitchShift: 5, robotize: false, echo: false },
  hamster: { pitch: 3.5, rate: 1.5, pitchShift: 9, robotize: false, echo: false },
  cow: { pitch: 0.3, rate: 0.5, pitchShift: -8, robotize: false, echo: false },
  lion: { pitch: 0.2, rate: 0.6, pitchShift:-10, robotize: false, echo: false },
};

export const PRESET_META: Record<PetVoicePreset,{label:string;bg:string;sound:string}> = {
  cat: { label: "Gato", bg: "#FF6B8A", sound: "miau miau miau" },
  dog: { label: "Perro", bg: "#FF8C42", sound: "guau guau guau" },
  bird: { label: "Pájaro", bg: "#5BC8F5", sound: "pío pío pío" },
  frog: { label: "Rana", bg: "#B8E04A", sound: "croc croc croc" },
  rabbit: { label: "Conejo", bg: "#FFE033", sound: "squeak squeak" },
  hamster: { label: "Hámster", bg: "#FF8C42", sound: "squeak squeak squeak" },
  cow: { label: "Vaca", bg: "#FFFBF2", sound: "muuu muuu" },
  lion: { label: "León", bg: "#FFE033", sound: "roaar roaar" },
};
