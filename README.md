# 🐾 Pet Voice Synthesizer UI

> Draw your pet. Record its real sound. Play with it.

Original Figma design: [Pet Voice Synthesizer UI](https://www.figma.com/design/QAWzxncfn3KVK3o3wkuNBp/Pet-Voice-Synthesizer-UI)

---

## 🚀 Getting started

```bash
npm i          # install dependencies
npm run dev    # start dev server
```

---

## ✨ Features

### 🎨 Draw Mode — Draw your pet
Free-drawing canvas with color picker, brush size, and eraser. Visual style inspired by **Tomodachi Life** (Nintendo DS): bold colors, thick black outlines, `Chewy` typography. Your drawing is the foundation of everything that comes next.

### 🔊 Sound Profile — Your drawing becomes a sound blueprint
The drawing is analyzed pixel by pixel to extract a unique **Sound Profile**:

| Drawing signal | What it controls |
|---|---|
| **Dominant hue** | Root note of the melody |
| **Average brightness** | Musical scale (major, minor, pentatonic, blues, dorian) |
| **Ink coverage** | Note duration and volume |
| **Vertical stroke position** | Pitch height within the scale |

This profile is shown to the user — you can *see* why your pet sounds the way it does. Each drawing produces a melody that only it could generate.

### 🎵 Play Mode — Your drawing plays a melody
The Sound Profile drives a full melody you can explore:
- Choose from 6 instruments: Piano, Guitar, Marimba, Flute, Bells, Synth
- Adjust tempo and activate loop
- See the detected scale by name (e.g. *"D minor pentatonic"*)

### 🎙️ Voice Mode — Record your real pet, remix it
This is where the magic gets personal. Instead of synthetic animal sounds, **you record your actual cat, dog, or any pet** making a noise — a meow, a bark, a chirp — and then:

1. **Record** your pet's sound live (microphone)
2. **Layer it** over the melody generated from your drawing
3. **Play with the instruments** from your Sound Profile — your pet's real voice becomes the lead
4. **Loop and remix** — pitch shift, tempo, reverb built from your drawing's data

Your pet's actual voice + your drawing's musical identity = something completely unique.

### 😄 Mood Detection — Your drawing has feelings
The Sound Profile also detects your pet's emotional state from the drawing:

| Mood | Drawing signals |
|---|---|
| ⚡ Energetic | High frequency, high volume, smooth waveform |
| 😊 Happy | High pitch, brightness, low roughness |
| 🌊 Calm | Long duration, low volume, smooth waveform |
| 💤 Sleepy | Very long duration, very low volume |
| 🎉 Playful | Short duration, medium energy |
| 🔮 Curious | High vibrato, medium frequency |
| 🌧️ Melancholic | Low volume, rough waveform |
| 🔥 Angry | Hard waveform, high volume, short duration |

The mood is shown with context — *"Bold colors and dense strokes — this pet has things to say."* — so users understand exactly how the image became the emotion.

### 💾 Save your pet
Save your pet with a name and animal type to **Supabase**. The drawing is uploaded to **Supabase Storage** and the Sound Profile is saved as JSON. Everything accessible from your profile.

### 🐾 Pet Profile
View your saved pet: name, drawing, animal type, Sound Profile, and replay its melody anytime.

---

## 🗺️ App flow

```
Draw 🎨 → Sound Profile revealed 🔊 → Melody plays 🎵 → Record your real pet 🎙️ → Remix → Save 💾
```

---

## 🛠️ Tech stack

| Technology | Purpose |
|---|---|
| React + TypeScript | UI and logic |
| Vite | Bundler and dev server |
| Web Audio API | Melody synthesis + live audio recording + remixing |
| MediaRecorder API | Recording the real pet's voice |
| Supabase Auth | User login / registration |
| Supabase Database | Pet data storage |
| Supabase Storage | Drawing uploads |
| CSS-in-JS inline | Tomodachi Life–inspired visual style |

---

## 📁 Relevant structure

```
src/
├── app/
│   ├── App.tsx                  # Main navigation + auth guard
│   └── components/
│       ├── DrawMode.tsx          # Drawing canvas
│       ├── SoundProfile.tsx      # Sound profile reveal + mood
│       ├── PlayMode.tsx          # Melody player
│       ├── VoiceMode.tsx         # Record real pet + remix
│       ├── PetProfile.tsx        # Saved pet view
│       ├── SavePetModal.tsx      # Save modal
│       └── LoginScreen.tsx       # Login / register screen
├── hooks/
│   ├── useDrawSound.ts           # Drawing analysis → Sound Profile
│   ├── usePetRecorder.ts         # MediaRecorder → real pet voice
│   └── useRemix.ts               # Layering voice + melody
└── lib/
    ├── supabase.ts               # Auth + DB + Storage
    └── moodDetect.ts             # Mood detection from Sound Profile
```
