import type { H3Event } from "h3";
import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdmin(event: H3Event) {
  const config = useRuntimeConfig(event);

  if (!config.supabaseUrl || !config.supabaseSecretKey) {
    throw createError({
      statusCode: 503,
      statusMessage: "Supabase server configuration is missing",
    });
  }

  return createClient(config.supabaseUrl, config.supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function createSupabasePublic(event: H3Event) {
  const config = useRuntimeConfig(event);
  if (!config.public.supabaseUrl || !config.public.supabasePublishableKey)
    return null;
  return createClient(
    config.public.supabaseUrl,
    config.public.supabasePublishableKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

export async function requireAdmin(event: H3Event) {
  const token = getHeader(event, "authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token)
    throw createError({
      statusCode: 401,
      statusMessage: "Please sign in again.",
    });
  const db = createSupabaseAdmin(event);
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user)
    throw createError({
      statusCode: 401,
      statusMessage: "Your session expired. Please sign in again.",
    });
  const member = await db
    .from("admin_members")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (member.error)
    throw createError({
      statusCode: 503,
      statusMessage: "Unable to verify access. Please retry.",
    });
  if (!member.data)
    throw createError({
      statusCode: 403,
      statusMessage: "This account is not an administrator.",
    });
  return { db, user: data.user };
}

export function dbError(error: { message: string } | null) {
  if (error) {
    console.error("Content operation failed:", error.message);
    throw createError({
      statusCode: 500,
      statusMessage:
        "Content could not be saved. Retry or check the server logs.",
    });
  }
}
