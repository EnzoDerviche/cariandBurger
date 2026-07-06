import { PageHeader } from "@/components/dashboard/page-header";
import { requireOrgMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  deleteModifierGroupAction,
  deleteModifierOptionAction,
  saveModifierGroupAction,
  saveModifierOptionAction,
} from "@/app/dashboard/actions";
import { ModifierPanels } from "@/app/dashboard/(protected)/modifiers/modifier-panels";
import type { ModifierGroup, ModifierOption } from "@/types/database";

export default async function ModifiersPage() {
  const { organization } = await requireOrgMember();
  const supabase = await createClient();
  const { data: groups } = await supabase
    .from("modifier_groups")
    .select("*, modifier_options(*)")
    .eq("organization_id", organization.id)
    .order("sort_order");

  const sorted = ((groups ?? []) as (ModifierGroup & { modifier_options: ModifierOption[] })[]).map(
    (g) => ({
      ...g,
      modifier_options: [...g.modifier_options].sort((a, b) => a.sort_order - b.sort_order),
    }),
  );

  return (
    <div>
      <PageHeader
        title="Modificadores"
        description="Grupos de extras (papas, sazón…) y sus opciones. Después vinculalos en cada producto."
      />
      <ModifierPanels
        groups={sorted}
        saveGroup={saveModifierGroupAction}
        deleteGroup={deleteModifierGroupAction}
        saveOption={saveModifierOptionAction}
        deleteOption={deleteModifierOptionAction}
      />
    </div>
  );
}
