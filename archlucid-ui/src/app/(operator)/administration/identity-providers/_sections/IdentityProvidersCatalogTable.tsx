"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { components } from "@/lib/openapi-schemas";

type ConfigSummaryKeyRow = components["schemas"]["ConfigSummaryKeyRow"];

export type IdentityProvidersCatalogTableProps = {
  readonly rows: ConfigSummaryKeyRow[] | null;
  readonly note: string | null;
  readonly showConfigPaths: boolean;
};

export function IdentityProvidersCatalogTable(props: IdentityProvidersCatalogTableProps): React.JSX.Element {
  return (
    <Card data-testid="identity-providers-catalog-card">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>OIDC catalog alignment</CardTitle>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Internal configuration alignment for OIDC/JWT wiring. Effective values are masked server-side.
        </p>
      </CardHeader>
      <CardContent>
        {props.note !== null ? (
          <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)}>{props.note}</p>
        ) : null}
        {props.rows !== null && props.rows.length > 0 ? (
          <EnterpriseTable ariaLabel="OIDC catalog alignment settings" className={OPERATOR_TYPOGRAPHY.body} data-testid="identity-providers-table">
            <EnterpriseTableHead>
              <EnterpriseTableHeadRow className={cn("border-b border-neutral-200 dark:border-neutral-700", OPERATOR_NAV_GROUP_LABEL)}>
                {props.showConfigPaths ? (
                  <EnterpriseTableHeaderCell className="py-2 pr-3">Config path</EnterpriseTableHeaderCell>
                ) : (
                  <EnterpriseTableHeaderCell className="py-2 pr-3">Setting</EnterpriseTableHeaderCell>
                )}
                <EnterpriseTableHeaderCell className="py-2 pr-3">Set</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell className="py-2 pr-3">Effective value</EnterpriseTableHeaderCell>
              </EnterpriseTableHeadRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {props.rows.map((row) => (
                <EnterpriseTableRow key={row.configPath}>
                  <EnterpriseTableCell className={cn("py-2 pr-3 text-al-text-primary", props.showConfigPaths ? OPERATOR_TYPOGRAPHY.micro : OPERATOR_TYPOGRAPHY.body, props.showConfigPaths ? "font-mono" : "")}>
                    {props.showConfigPaths ? row.configPath : formatCustomerSettingLabel(row.configPath)}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className="py-2 pr-3 text-al-text-secondary">{row.isSet ? "yes" : "no"}</EnterpriseTableCell>
                  <EnterpriseTableCell className="break-all py-2 pr-3 text-al-text-secondary">{row.effectiveValue ?? "—"}</EnterpriseTableCell>
                </EnterpriseTableRow>
              ))}
            </EnterpriseTableBody>
          </EnterpriseTable>
        ) : (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No catalog rows returned.</p>
        )}
      </CardContent>
    </Card>
  );
}

function formatCustomerSettingLabel(configPath: string | null | undefined): string {
  switch (configPath) {
    case "ArchLucidAuth:Authority":
      return "Provider authority";
    case "ArchLucidAuth:Audience":
      return "Audience / client identifier";
    case "ArchLucidAuth:Mode":
      return "Authentication mode";
    case "ArchLucidAuth:RoleClaimName":
      return "Role claim mapping";
    default:
      return configPath?.replace(/^ArchLucidAuth:/, "") ?? "Setting";
  }
}
