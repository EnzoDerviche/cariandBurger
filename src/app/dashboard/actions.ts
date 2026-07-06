"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrgMember } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { parseBusinessHoursFromForm } from "@/lib/business-hours";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/database";

async function ctx() {
  const { organization } = await requireOrgMember();
  const supabase = await createClient();
  return { orgId: organization.id, orgSlug: organization.slug, supabase };
}

function revalidateDashboard() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/modifiers");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/resumen");
  revalidatePath("/dashboard/settings");
}

// --- Categorías ---

export async function saveCategoryAction(
  id: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { orgId, supabase } = await ctx();
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));
  const sort_order = Number(formData.get("sort_order") ?? 0);
  const is_active = formData.get("is_active") === "on";

  if (!name) return { error: "El nombre es obligatorio." };

  const payload = { name, slug, sort_order, is_active, organization_id: orgId };

  const { error } = id
    ? await supabase.from("categories").update(payload).eq("id", id).eq("organization_id", orgId)
    : await supabase.from("categories").insert(payload);

  if (error) {
    if (error.code === "23505") return { error: "Ese slug ya existe." };
    return { error: error.message };
  }

  revalidateDashboard();
  if (!id) redirect("/dashboard/categories");
  return { success: "Categoría guardada." };
}

export async function deleteCategoryAction(id: string): Promise<void> {
  const { orgId, supabase } = await ctx();
  await supabase.from("categories").delete().eq("id", id).eq("organization_id", orgId);
  revalidateDashboard();
  redirect("/dashboard/categories");
}

// --- Productos ---

export async function saveProductAction(
  id: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { orgId, supabase } = await ctx();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const category_id = String(formData.get("category_id") ?? "") || null;
  const price = Number(formData.get("price") ?? 0);
  const sort_order = Number(formData.get("sort_order") ?? 0);
  const is_promo = formData.get("is_promo") === "on";
  const is_active = formData.get("is_active") === "on";
  const image_url = String(formData.get("image_url") ?? "").trim() || null;
  const modifierGroupIds = formData.getAll("modifier_groups") as string[];

  if (!name) return { error: "El nombre es obligatorio." };
  if (price < 0) return { error: "El precio no puede ser negativo." };

  const payload = {
    name,
    description,
    category_id,
    price,
    sort_order,
    is_promo,
    is_active,
    image_url,
    organization_id: orgId,
  };

  let productId = id;

  if (id) {
    const { error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id)
      .eq("organization_id", orgId);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select("id")
      .single();
    if (error) return { error: error.message };
    productId = data.id;
  }

  if (productId) {
    await supabase.from("product_modifier_groups").delete().eq("product_id", productId);
    if (modifierGroupIds.length > 0) {
      await supabase.from("product_modifier_groups").insert(
        modifierGroupIds.map((modifier_group_id, i) => ({
          product_id: productId!,
          modifier_group_id,
          sort_order: i,
        })),
      );
    }
  }

  revalidateDashboard();
  if (!id) redirect("/dashboard/products");
  return { success: "Producto guardado." };
}

export async function deleteProductAction(id: string): Promise<void> {
  const { orgId, supabase } = await ctx();
  await supabase.from("products").delete().eq("id", id).eq("organization_id", orgId);
  revalidateDashboard();
  redirect("/dashboard/products");
}

export async function uploadProductImageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState & { url?: string }> {
  const { orgId, supabase } = await ctx();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Seleccioná una imagen." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${orgId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { upsert: false });

  if (error) return { error: error.message };

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return { success: "Imagen subida.", url: data.publicUrl };
}

// --- Modificadores ---

export async function saveModifierGroupAction(
  id: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { orgId, supabase } = await ctx();
  const name = String(formData.get("name") ?? "").trim();
  const min_selections = Number(formData.get("min_selections") ?? 0);
  const max_selections = Number(formData.get("max_selections") ?? 1);
  const is_required = formData.get("is_required") === "on";
  const sort_order = Number(formData.get("sort_order") ?? 0);

  if (!name) return { error: "El nombre es obligatorio." };

  const payload = {
    name,
    min_selections,
    max_selections,
    is_required,
    sort_order,
    organization_id: orgId,
  };

  const { error } = id
    ? await supabase.from("modifier_groups").update(payload).eq("id", id).eq("organization_id", orgId)
    : await supabase.from("modifier_groups").insert(payload);

  if (error) return { error: error.message };

  revalidateDashboard();
  return { success: "Grupo guardado." };
}

export async function deleteModifierGroupAction(id: string): Promise<void> {
  const { orgId, supabase } = await ctx();
  await supabase.from("modifier_groups").delete().eq("id", id).eq("organization_id", orgId);
  revalidateDashboard();
}

export async function saveModifierOptionAction(
  groupId: string,
  id: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { orgId, supabase } = await ctx();

  const { data: group } = await supabase
    .from("modifier_groups")
    .select("id")
    .eq("id", groupId)
    .eq("organization_id", orgId)
    .single();

  if (!group) return { error: "Grupo no encontrado." };

  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const sort_order = Number(formData.get("sort_order") ?? 0);
  const is_active = formData.get("is_active") === "on";

  if (!name) return { error: "El nombre es obligatorio." };

  const payload = { name, price, sort_order, is_active, modifier_group_id: groupId };

  const { error } = id
    ? await supabase.from("modifier_options").update(payload).eq("id", id)
    : await supabase.from("modifier_options").insert(payload);

  if (error) return { error: error.message };

  revalidateDashboard();
  return { success: "Opción guardada." };
}

export async function deleteModifierOptionAction(id: string): Promise<void> {
  const { supabase } = await ctx();
  await supabase.from("modifier_options").delete().eq("id", id);
  revalidateDashboard();
}

// --- Configuración ---

export async function saveSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { orgId, orgSlug, supabase } = await ctx();

  const whatsapp_number = String(formData.get("whatsapp_number") ?? "").replace(/\D/g, "");
  const delivery_enabled = formData.get("delivery_enabled") === "on";
  const pickup_enabled = formData.get("pickup_enabled") === "on";
  const min_order_amount = Number(formData.get("min_order_amount") ?? 0);
  const welcome_message = String(formData.get("welcome_message") ?? "").trim() || null;
  const business_hours = parseBusinessHoursFromForm(formData);

  const payment_methods = ["efectivo", "mercado_pago", "transferencia", "tarjeta"].filter(
    (m) => formData.get(`pay_${m}`) === "on",
  );

  if (!whatsapp_number) return { error: "WhatsApp es obligatorio." };
  if (payment_methods.length === 0) {
    return { error: "Seleccioná al menos un método de pago." };
  }

  const { error: orgError } = await supabase
    .from("organizations")
    .update({ whatsapp_number })
    .eq("id", orgId);

  if (orgError) return { error: orgError.message };

  const { error: settingsError } = await supabase
    .from("organization_settings")
    .upsert({
      organization_id: orgId,
      delivery_enabled,
      pickup_enabled,
      min_order_amount,
      payment_methods,
      welcome_message,
      business_hours,
    });

  if (settingsError) return { error: settingsError.message };

  revalidateDashboard();
  revalidatePath(`/${orgSlug}`);
  return { success: "Configuración guardada." };
}
