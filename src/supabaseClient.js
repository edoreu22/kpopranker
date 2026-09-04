import { createClient } from "@supabase/supabase-js";

// Paste your own project's values here — find them in Supabase under
// Project Settings -> API. Use the "anon public" key, never the service_role key.
const SUPABASE_URL = "https://drvqxpyfgrrtqfzlhhje.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRydnF4cHlmZ3JydHFmemxoaGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTEwNjYsImV4cCI6MjEwNDA2NzA2Nn0.f4Uh2Fl6FwB19ivmobVKzPCbWRFlESuuoIcLpSrBhZ8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function generateShareId() {
  // Short, URL-friendly random id (~8 chars, plenty unique for friend-group scale)
  return Math.random().toString(36).slice(2, 10);
}

// Uploads a snapshot of the given list and returns its share id.
export async function shareList(list) {
  const id = generateShareId();
  const { error } = await supabase.from("shared_lists").insert({ id, data: list });
  if (error) throw error;
  return id;
}

// Fetches a shared snapshot by id. Returns null if it doesn't exist or has expired.
export async function fetchSharedList(id) {
  const { data, error } = await supabase.from("shared_lists").select("data").eq("id", id).single();
  if (error) return null;
  return data?.data || null;
}
