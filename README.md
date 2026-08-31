# 🎨 Doodio

> Draw anything. Hear it as music. No skills required.

Live app: ([https://doodio-alpha.vercel.app/])

Built for the **Figma Make Challenge** — prototyped with Figma Make, connected to GitHub via Figma MCP.

---

## 🌟 The idea

I've always believed everyone can be creative. I'm not the best at drawing or playing instruments — but when I listen to music or make something with my hands, I feel a different version of myself. Freer.

Doodio turns that feeling into an app. You draw anything — a chaotic scribble, a wobbly sun, a blob that sort of looks like a cat — and your drawing becomes a unique melody. Your colors, your strokes, your shapes become sound. No music theory. No artistic skills required.

My demo drawings looked like a 5-year-old made them. They sounded beautiful. 🎵

---

## 🚀 Getting started

```bash
npm i          # install dependencies
npm run dev    # start dev server
```

---

## ✨ Features

### 🎨 Draw — Your canvas, your rules
Free-drawing canvas with color picker, brush size, and eraser. Visual style inspired by **Tomodachi Life** (Nintendo DS): bold colors, thick black outlines, `Chewy` typography. Draw anything — the messier the better.

### 🔊 Sound Profile — Your drawing becomes music
The drawing is analyzed pixel by pixel to extract a unique **Sound Profile**:

| Drawing signal | What it controls |
|---|---|
| **Dominant hue** | Root note of the melody |
| **Average brightness** | Musical scale (major, minor, pentatonic, blues, dorian) |
| **Ink coverage** | Note duration and volume |
| **Vertical stroke position** | Pitch height within the scale |

Every drawing produces a melody that only it could generate.

### 🎵 Listen — Play and remix your melody
Explore the melody your drawing created:
- Choose from 6 instruments: Piano, Guitar, Marimba, Flute, Bells, Synth
- Remix across 6 genres: Jazz, Rock, Ballad, Pop, Funk, Metal
- Adjust tempo and activate loop
- See the detected scale by name (e.g. *"D minor pentatonic"*)

### 🎤 Voice — Add yourself to the music
Record your voice — sing, hum, or say anything — and layer it over your drawing's melody. Your voice becomes an instrument or a musical style. Something completely yours.

### 💾 Gallery — Every doodle sounds different
Save your doodle with a name to **Supabase**. Browse the shared gallery and tap any card to hear what that drawing sounds like. A collection of imperfect, beautiful things.

---

## 🗺️ App flow

```
Draw 🎨 → Melody generates 🎵 → Remix with genre 🎸 → Add your voice 🎤 → Save to Gallery 💾
```

---

## 🛠️ Tech stack

| Technology | Purpose |
|---|---|
| React + TypeScript | UI and logic |
| Vite | Bundler and dev server |
| Web Audio API | Melody synthesis + live audio recording + remixing |
| MediaRecorder API | Voice recording |
| Supabase Auth | User login / registration |
| Supabase Database | Doodle data storage |
| Supabase Storage | Drawing uploads |
| Figma Make | UI prototyping |
| Figma MCP + GitHub | Design-to-code sync |
| Vercel | Deployment |
| CSS-in-JS inline | Tomodachi Life–inspired visual style |

---

## 📁 Project structure

```
src/
├── app/
│   ├── App.tsx                   # Main navigation + auth guard
│   └── components/
│       ├── DrawMode.tsx           # Drawing canvas
│       ├── PlayMode.tsx           # Melody player + genre remix
│       ├── VoiceMode.tsx          # Voice recording + layering
│       ├── ExperimentMode.tsx     # Experiment tab
│       ├── PetProfile.tsx         # Saved doodle view
│       ├── SavePetModal.tsx       # Save doodle modal
│       ├── LoginScreen.tsx        # Login / register screen
│       └── TomodachiLogin.tsx     # Animated login screen
├── hooks/
│   ├── useDrawSound.ts            # Drawing analysis → Sound Profile
│   ├── usePetRecorder.ts          # Voice recorder
│   └── useRemix.ts                # Layering voice + melody
└── lib/
    ├── supabase.ts                # Auth + DB + Storage
    └── moodDetect.ts              # Mood detection from Sound Profile
```

---

## Database schema (Supabase)

Doodio stores **doodles**: a drawing (`drawing_url`) plus the Sound Profile that turns it into music (`melody_json`). This is not a pets app.

Source of truth in this repo is [`src/lib/supabase.ts`](src/lib/supabase.ts). There is **no** `supabase/migrations` folder. Confirm against the live dashboard if policies ever drift.

Auth is email/password. `username` goes in `user_metadata`, not a `profiles` table. Gallery rows do **not** store `auth.uid()`; they store `owner_name` as text.

### Gallery doodles

Shared gallery: latest 20 doodles by `created_at` desc. The client still queries `.from("pets")` — leftover table identifier from the Figma Make prototype. **Rows are doodles.** Use that identifier only when writing SQL until it is renamed.

| Column | Client type | What it is |
|---|---|---|
| `id` | `string` | doodle id (returned on insert) |
| `name` | `string` | doodle name |
| `animal_type` | `cat \| dog \| bird \| frog \| rabbit \| hamster` | doodle tag (prototype enum; UI labels include Tree / House / Star) |
| `owner_name` | `string` | display name, not a foreign key |
| `drawing_url` | `string \| null` | public URL of the PNG in Storage |
| `melody_json` | `unknown \| null` | Sound Profile JSON |
| `created_at` | `string` | |

Client ops: anon `SELECT`, anon `INSERT`. No update/delete from the app.

RLS the live gallery needs (public read + anyone insert; no update/delete policies):

```sql
-- leftover table name; rows are doodles
alter table pets enable row level security;
create policy "Public read doodles" on pets for select using (true);
create policy "Anyone insert doodle" on pets for insert with check (true);
```

### Daily doodles (`daily_doodles`)

Prompt-of-the-day submissions. SQL from the client comment; run once in the Supabase SQL editor:

```sql
create table daily_doodles (
  id          uuid primary key default gen_random_uuid(),
  day         text not null,          -- e.g. "2026-06-20"
  prompt      text not null,
  owner_name  text not null,
  drawing_url text,
  melody_json jsonb,
  created_at  timestamptz default now()
);
alter table daily_doodles enable row level security;
create policy "Public read" on daily_doodles for select using (true);
create policy "Anyone insert" on daily_doodles for insert with check (true);
```

No update/delete policies → those operations stay denied under RLS.

### Storage bucket `drawings`

`uploadDrawing` puts a PNG at `{timestamp}-{slug(name)}.png` (bucket root, no `user_id/` prefix) with `upsert: true`, then `getPublicUrl`. The bucket must be **public**.

Policies the client needs (not checked in; create in the dashboard if missing):

```sql
insert into storage.buckets (id, name, public)
values ('drawings', 'drawings', true)
on conflict (id) do update set public = true;

create policy "Public read drawings"
  on storage.objects for select
  using (bucket_id = 'drawings');

create policy "Public upload drawings"
  on storage.objects for insert
  with check (bucket_id = 'drawings');

create policy "Public update drawings"
  on storage.objects for update
  using (bucket_id = 'drawings')
  with check (bucket_id = 'drawings');
```

`upsert: true` is why UPDATE is required, not only INSERT.

### Not in this schema

- No `user_id` on gallery or daily doodles (auth is not bound to rows).
- No embeddings / pgvector. Similarity search for doodles similares is [#1](https://github.com/mcontrerasmalpar-pixel/Doodio/issues/1).

---

## 💛 Made with

This project was built with love, a lot of bad drawings, and the belief that imperfection is where creativity actually lives.

> *"Come as you are. Your imperfection is the art."*
