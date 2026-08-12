import { Card, CardContent } from "@/components/ui/card";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const TENANT_SETTINGS_RESTRICTED_DESCRIPTION =
  "Workspace settings change configuration for everyone in this tenant, so they are limited to workspace administrators.";

/**
 * Shown when a non-admin caller deep-links to workspace settings.
 *
 * This is UI shaping, not enforcement — the API policies on the underlying writes are authoritative. The page
 * exists so a Reader or Operator who follows an old link gets an explanation instead of a broken form.
 */
export function TenantSettingsRestrictedState(): React.JSX.Element {
  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="tenant-settings-restricted">
      <OperatorPageHeader
        title={OPERATOR_NAV_LINK_LABELS.workspaceSettings}
        headingLevel="h1"
        subtitle={<span role="alert">{TENANT_SETTINGS_RESTRICTED_DESCRIPTION}</span>}
        subtitleClassName="max-w-prose"
      />
      <Card>
        <CardContent className={cn("py-6 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <p className="m-0">
            Your personal settings — appearance and sign-in methods — are available from the account menu in the top
            bar. Ask a workspace administrator if you need a tenant-wide setting changed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
