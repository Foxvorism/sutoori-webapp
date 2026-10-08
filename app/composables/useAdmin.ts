import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { uploadSchema } from "#shared/validation";
let client: SupabaseClient | null = null;
export function useAdmin() {
  const config = useRuntimeConfig();
  const configured =
    !!config.public.supabaseUrl && !!config.public.supabasePublishableKey;
  function auth() {
    if (!import.meta.client || !configured)
      throw new Error("Configure Supabase before signing in. See README.");
    client ||= createClient(
      config.public.supabaseUrl,
      config.public.supabasePublishableKey,
    );
    return client;
  }
  async function token() {
    const { data, error } = await auth().auth.getSession();
    if (error || !data.session) {
      throw new Error(
        "Session expired. Sign in again in another tab, then retry to keep these form fields.",
      );
    }
    return data.session.access_token;
  }
  async function request<T = any>(
    path: string,
    options: { method?: "GET" | "POST" | "PUT" | "DELETE"; body?: any } = {},
  ): Promise<T> {
    try {
      const result = (await $fetch<T>(`/api/admin/${path}`, {
        ...options,
        headers: { Authorization: `Bearer ${await token()}` },
      })) as T;
      if (options.method && options.method !== "GET")
        clearNuxtData(["site-content", "gallery"]);
      return result;
    } catch (error: any) {
      if (error.statusCode === 401)
        throw new Error(
          "Session expired. Sign in again in another tab, then retry to keep these form fields.",
        );
      throw new Error(
        error.data?.statusMessage ||
          error.message ||
          "Something went wrong. Please retry.",
      );
    }
  }
  async function upload(
    file: File,
    poster: File | null,
    progress: (percent: number) => void,
  ) {
    const describe = (value: File) => ({ name: value.name, type: value.type, size: value.size });
    const input = { file: describe(file), poster: poster ? describe(poster) : null };
    const parsed = uploadSchema.safeParse(input);
    if (!parsed.success) throw new Error(parsed.error.issues.map(i => i.message).join("; "));
    const pending = await request<{ id: string; upload: { signedUrl: string }; poster: { signedUrl: string } | null }>("media", { method: "POST", body: input });
    const total = file.size + (poster?.size || 0);
    let sent = 0;
    const send = (url: string, value: File) => new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", value.type);
      xhr.setRequestHeader("x-upsert", "false");
      xhr.setRequestHeader("cache-control", "max-age=60");
      xhr.timeout = 240000;
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable)
          progress(Math.min(99, Math.round(((sent + value.size * e.loaded / e.total) / total) * 100)));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) { sent += value.size; resolve(); }
        else {
          let message = "Upload failed. Please retry.";
          try {
            message = JSON.parse(xhr.responseText).message || message;
          } catch {}
          reject(new Error(message));
        }
      };
      xhr.onerror = () =>
        reject(
          new Error(
            "Connection lost. Refresh the media library before retrying.",
          ),
        );
      xhr.ontimeout = () =>
        reject(
          new Error(
            "Upload timed out. Refresh the media library before retrying.",
          ),
        );
      xhr.send(value);
    });
    try {
      await send(pending.upload.signedUrl, file);
      if (poster && pending.poster) await send(pending.poster.signedUrl, poster);
      progress(100);
      await request(`media/${pending.id}/complete`, { method: "POST" });
    } catch (error: any) {
      throw new Error(`${error.message || "Upload failed."} Draft retained; delete the incomplete draft before uploading again.`);
    }
  }
  return { configured, auth, request, upload };
}
