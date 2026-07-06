"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/slugify";
import { defaultOrganizationSettings } from "@/lib/store/get-store";
import { createClient } from "@/lib/supabase/server";
import type { ActionState, OrganizationInput } from "@/types/database";

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email y contraseña son obligatorios." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: "Credenciales inválidas." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profile?.role === "super_admin") redirect("/admin");
  if (profile?.role === "org_admin" || profile?.role === "staff") {
    redirect("/dashboard");
  }

  await supabase.auth.signOut();
  return { error: "Tu cuenta no tiene permisos de administrador." };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

function parseOrganization(formData: FormData): OrganizationInput {
  return {
    slug: slugify(String(formData.get("slug") ?? "")),
    name: String(formData.get("name") ?? "").trim(),
    whatsapp_number: String(formData.get("whatsapp_number") ?? "").trim(),
    logo_url: String(formData.get("logo_url") ?? "").trim() || undefined,
    currency: String(formData.get("currency") ?? "ARS").trim() || "ARS",
    order_prefix: String(formData.get("order_prefix") ?? "PED").trim() || "PED",
    theme_primary: String(formData.get("theme_primary") ?? "#E63946").trim(),
    theme_secondary: String(formData.get("theme_secondary") ?? "#1D3557").trim(),
    is_active: formData.get("is_active") === "on",
  };
}

function validateOrganization(data: OrganizationInput): string | null {
  if (!data.slug) return "El slug es obligatorio.";
  if (!data.name) return "El nombre es obligatorio.";
  if (!/^\d{10,15}$/.test(data.whatsapp_number.replace(/\D/g, ""))) {
    return "WhatsApp debe ser numérico (10-15 dígitos, sin +).";
  }
  return null;
}

export async function createOrganizationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseOrganization(formData);
  const validationError = validateOrganization(parsed);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { data: org, error } = await supabase
    .from("organizations")
    .insert({
      ...parsed,
      whatsapp_number: parsed.whatsapp_number.replace(/\D/g, ""),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Ese slug ya existe." };
    return { error: error.message };
  }

  const defaults = defaultOrganizationSettings(org.id);
  await supabase.from("organization_settings").insert({
    organization_id: defaults.organization_id,
    delivery_enabled: defaults.delivery_enabled,
    pickup_enabled: defaults.pickup_enabled,
    min_order_amount: defaults.min_order_amount,
    payment_methods: defaults.payment_methods,
    business_hours: defaults.business_hours,
    welcome_message: defaults.welcome_message,
  });

  revalidatePath("/admin/organizations");
  redirect(`/admin/organizations/${org.id}`);
}

export async function updateOrganizationAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const data = parseOrganization(formData);
  const validationError = validateOrganization(data);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      ...data,
      whatsapp_number: data.whatsapp_number.replace(/\D/g, ""),
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "Ese slug ya existe." };
    return { error: error.message };
  }

  revalidatePath("/admin/organizations");
  revalidatePath(`/admin/organizations/${id}`);
  return { success: "Cambios guardados." };
}

export async function deleteOrganizationAction(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("organizations").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/organizations");
  redirect("/admin/organizations");
}

export async function assignUserToOrgAction(
  orgId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "org_admin");

  if (!email) return { error: "El email es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("assign_user_to_org", {
    user_email: email,
    org_id: orgId,
    new_role: role,
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/organizations/${orgId}`);
  return { success: `Usuario ${email} asignado al local.` };
}
