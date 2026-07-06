"use server";

import { slugify } from "@/lib/slugify";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/database";

const MAX_LOGO_BYTES = 4 * 1024 * 1024;

async function assertSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") throw new Error("No autorizado.");
  return supabase;
}

export async function uploadOrganizationLogoAction(
  orgId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState & { url?: string }> {
  try {
    const supabase = await assertSuperAdmin();
    const file = formData.get("file");
    const slug = slugify(String(formData.get("slug") ?? ""));
    const folder = orgId || slug;

    if (!(file instanceof File) || file.size === 0) {
      return { error: "Seleccioná una imagen." };
    }
    if (file.size > MAX_LOGO_BYTES) {
      return { error: "La imagen no puede superar 4 MB." };
    }
    if (!folder) return { error: "Completá el slug antes de subir el logo." };

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${folder}/logo-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: false });

    if (error) return { error: error.message };

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return { success: "Logo subido.", url: data.publicUrl };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al subir." };
  }
}
