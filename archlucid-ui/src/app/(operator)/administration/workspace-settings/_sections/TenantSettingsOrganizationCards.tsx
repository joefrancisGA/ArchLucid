"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { TenantSettingsOrganizationSummary } from "./TenantSettingsOrganizationSummary";
import { TenantWorkspaceProjectsCard } from "./TenantWorkspaceProjectsCard";
import type { TenantSettingsPageContentModel } from "./tenant-settings-page-view-model";

type Props = {
  readonly tenantDisplayName: string;
  readonly scope: Readonly<Record<string, string>>;
  readonly model: TenantSettingsPageContentModel;
  readonly buyerPolishedShell?: boolean;
};

export function TenantSettingsOrganizationCards({
  tenantDisplayName,
  scope,
  model,
  buyerPolishedShell = false,
}: Props) {
  const tenantId = scope["x-tenant-id"] ?? "";

  return (
    <>
      {buyerPolishedShell ? (
        <Card data-testid="tenant-settings-organization-card">
          <CardHeader>
            <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.cardTitle}>
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent className={cn("space-y-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            <TenantSettingsOrganizationSummary tenantDisplayName={tenantDisplayName} tenantId={tenantId} />
          </CardContent>
        </Card>
      ) : (
        <TenantWorkspaceProjectsCard tenantDisplayName={tenantDisplayName} scope={scope} />
      )}

      {model.trial != null && model.trial.status != null && model.trial.status !== "None" ? (
        <Card>
          <CardHeader>
            <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.cardTitle}>
              Pilot / trial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              <span className="font-medium">Status:</span> {model.trial.status}
              {typeof model.trial.daysRemaining === "number" ? (
                <span>
                  {" "}
                  — <span className="font-medium">Days remaining:</span> {model.trial.daysRemaining}
                </span>
              ) : null}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
