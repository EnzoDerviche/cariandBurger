import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Organization, OrganizationSettings, Profile } from "@/types/database";

export async function getSessionProfile(): Promise<{
  profile: Profile | null;
  email: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { profile: null, email: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { profile: profile as Profile | null, email: user.email ?? null };
}

export async function requireSuperAdmin() {
  const { profile, email } = await getSessionProfile();

  if (!email) redirect("/admin/login");
  if (!profile || profile.role !== "super_admin") redirect("/admin/unauthorized");

  return { profile, email };
}

export const requireOrgMember = cache(async function requireOrgMember() {
  const { profile, email } = await getSessionProfile();

  if (!email) redirect("/admin/login");
  if (
    !profile?.organization_id ||
    !["org_admin", "staff"].includes(profile.role)
  ) {
    redirect("/admin/unauthorized");
  }

  const supabase = await createClient();
  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", profile.organization_id)
    .single();

  if (!organization) redirect("/admin/unauthorized");

  const { data: settings } = await supabase
    .from("organization_settings")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .single();

  return {
    profile,
    email,
    organization: organization as Organization,
    settings: settings as OrganizationSettings | null,
  };
});
