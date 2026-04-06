import { supabase } from "@/lib/supabase"

export async function signInAnonymously() {
  const { data, error } = await supabase.auth.signInAnonymously()

  if (error) {
    console.error("Anonymous sign-in failed:", error.message)
    return null
  }

  return data
}

export async function getCurrentUser() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error("Get session failed:", error.message)
    return null
  }

  return session?.user ?? null
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}