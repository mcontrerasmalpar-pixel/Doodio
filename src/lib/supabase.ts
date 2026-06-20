let _supabase: import("@supabase/supabase-js").SupabaseClient | null = null;

const SUPABASE_URL = "https://sikensiujqlgbbqgesqy.supabase.co";
const SUPABASE_KEY = "sb_publishable_H8JdapG_nvaEkY_gPSboOA_tRHEXX00";

export async function getClient() {
  if (_supabase) return _supabase;
  try {
    const { createClient } = await import("@supabase/supabase-js");
    _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch {
    console.warn("Supabase not available — running offline");
  }
  return _supabase;
}

// ── Auth ──────────────────────────────────────────────────────
export interface AuthResult {
  user:  import("@supabase/supabase-js").User | null;
  error: string | null;
}

export async function signUp(email: string, password: string, username: string): Promise<AuthResult> {
  try {
    const sb = await getClient();
    if (!sb) return { user: null, error: "Sin conexión" };
    const { data, error } = await sb.auth.signUp({
      email, password,
      options: { data: { username } },
    });
    if (error) return { user: null, error: error.message };
    return { user: data.user, error: null };
  } catch (e: unknown) {
    return { user: null, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const sb = await getClient();
    if (!sb) return { user: null, error: "Sin conexión" };
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error: error.message };
    return { user: data.user, error: null };
  } catch (e: unknown) {
    return { user: null, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

export async function signOut(): Promise<void> {
  const sb = await getClient();
  if (sb) await sb.auth.signOut();
}

export async function getSession() {
  const sb = await getClient();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session;
}

// ── Pets ────────────────────────────────────────────────────
export type AnimalType = "cat" | "dog" | "bird" | "frog" | "rabbit" | "hamster";

export interface Pet {
  id:          string;
  name:        string;
  animal_type: AnimalType;
  owner_name:  string;
  drawing_url: string | null;
  melody_json: unknown | null;
  created_at:  string;
}

export async function uploadDrawing(dataUrl: string, petName: string): Promise<string | null> {
  try {
    const sb = await getClient();
    if (!sb) return null;
    const blob = await (await fetch(dataUrl)).blob();
    const filename = `${Date.now()}-${petName.replace(/\s+/g, "-").toLowerCase()}.png`;
    const { error } = await sb.storage
      .from("drawings")
      .upload(filename, blob, { contentType: "image/png", upsert: true });
    if (error) { console.error("Storage upload error:", error); return null; }
    const { data } = sb.storage.from("drawings").getPublicUrl(filename);
    return data.publicUrl;
  } catch (e) {
    console.error("uploadDrawing failed:", e); return null;
  }
}

export async function savePet(pet: {
  name: string; animal_type: AnimalType;
  owner_name: string; drawing_url: string | null; melody_json: unknown | null;
}): Promise<Pet | null> {
  try {
    const sb = await getClient();
    if (!sb) return null;
    const { data, error } = await sb.from("pets").insert([pet]).select().single();
    if (error) { console.error("savePet error:", error); return null; }
    return data as Pet;
  } catch (e) {
    console.error("savePet failed:", e); return null;
  }
}

export async function fetchPets(): Promise<Pet[]> {
  try {
    const sb = await getClient();
    if (!sb) return [];
    const { data, error } = await sb.from("pets").select("*").order("created_at", { ascending: false }).limit(20);
    if (error) { console.error("fetchPets error:", error); return []; }
    return (data ?? []) as Pet[];
  } catch { return []; }
}

// ── Daily Doodles ───────────────────────────────────────────────
// Run this SQL once in Supabase dashboard to create the table:
//
//   create table daily_doodles (
//     id          uuid primary key default gen_random_uuid(),
//     day         text not null,          -- e.g. "2026-06-20"
//     prompt      text not null,
//     owner_name  text not null,
//     drawing_url text,
//     melody_json jsonb,
//     created_at  timestamptz default now()
//   );
//   alter table daily_doodles enable row level security;
//   create policy "Public read" on daily_doodles for select using (true);
//   create policy "Anyone insert" on daily_doodles for insert with check (true);

export interface DailyDoodle {
  id:          string;
  day:         string;
  prompt:      string;
  owner_name:  string;
  drawing_url: string | null;
  melody_json: unknown | null;
  created_at:  string;
}

export async function saveDailyDoodle(doodle: {
  day: string;
  prompt: string;
  owner_name: string;
  drawing_url: string | null;
  melody_json: unknown | null;
}): Promise<DailyDoodle | null> {
  try {
    const sb = await getClient();
    if (!sb) return null;
    const { data, error } = await sb
      .from("daily_doodles")
      .insert([doodle])
      .select()
      .single();
    if (error) { console.error("saveDailyDoodle error:", error); return null; }
    return data as DailyDoodle;
  } catch (e) {
    console.error("saveDailyDoodle failed:", e); return null;
  }
}

export async function fetchDailyDoodle(id: string): Promise<DailyDoodle | null> {
  try {
    const sb = await getClient();
    if (!sb) return null;
    const { data, error } = await sb
      .from("daily_doodles")
      .select("*")
      .eq("id", id)
      .single();
    if (error) { console.error("fetchDailyDoodle error:", error); return null; }
    return data as DailyDoodle;
  } catch (e) {
    console.error("fetchDailyDoodle failed:", e); return null;
  }
}

export async function fetchDailyDoodlesByDay(day: string): Promise<DailyDoodle[]> {
  try {
    const sb = await getClient();
    if (!sb) return [];
    const { data, error } = await sb
      .from("daily_doodles")
      .select("*")
      .eq("day", day)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) { console.error("fetchDailyDoodlesByDay error:", error); return []; }
    return (data ?? []) as DailyDoodle[];
  } catch { return []; }
}
