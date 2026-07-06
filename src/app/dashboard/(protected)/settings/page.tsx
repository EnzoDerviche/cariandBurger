import { saveSettingsAction } from "@/app/dashboard/actions";
import { SettingsForm } from "@/app/dashboard/(protected)/settings/settings-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireOrgMember } from "@/lib/auth";

export default async function SettingsPage() {
  const { organization, settings } = await requireOrgMember();

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="WhatsApp, horarios, delivery y métodos de pago."
      />
      <SettingsForm
        action={saveSettingsAction}
        organization={organization}
        settings={settings}
      />
    </div>
  );
}
