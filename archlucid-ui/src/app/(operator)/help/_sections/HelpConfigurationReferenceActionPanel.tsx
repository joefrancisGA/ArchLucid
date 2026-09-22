"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  CONFIGURATION_REFERENCE_HELP_ACTION_PANEL_ID,
  CONFIGURATION_REFERENCE_HELP_ACTION_PANEL_TITLE,
  CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS,
} from "@/lib/configuration-reference-help-guide-content";
import {
  resolveConfigurationReferenceConfigurationSummarySurfaceStatus,
  resolveConfigurationReferenceIdentityProvidersSurfaceStatus,
  resolveConfigurationReferenceSsoSurfaceStatus,
} from "@/lib/configuration-reference-help-surface-status";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
  type EnterpriseStatusKind,
} from "@/lib/design-tokens";
import { useAdminConfigLintSummaryQuery } from "@/hooks/use-admin-config-lint-summary-query";
import { useAdminIdentityProvidersBundleQuery } from "@/hooks/use-admin-identity-providers-bundle-query";
import { cn } from "@/lib/utils";

type SurfaceActionRowProps = {
  readonly label: string;
  readonly href: string;
  readonly statusKind: EnterpriseStatusKind;
  readonly statusLabel: string;
};

function SurfaceActionRow(props: SurfaceActionRowProps): React.ReactElement {
  return (
    <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <Button asChild size="sm" variant="outline">
        <Link href={props.href}>{props.label}</Link>
      </Button>
      <StatusTag kind={props.statusKind} label={props.statusLabel} />
    </li>
  );
}

/** Live configuration surface CTAs with status tags for `/help/configuration-reference`. */
export function HelpConfigurationReferenceActionPanel(): React.ReactElement {
  const includeHostConfigurationLint = isArchLucidInternalOperatorShellEnv();
  const { data: identityBundle, isPending: identityPending } = useAdminIdentityProvidersBundleQuery();
  const { data: configLintData, isPending: configLintPending } = useAdminConfigLintSummaryQuery({
    enabled: includeHostConfigurationLint,
  });

  const identityInput =
    identityPending || identityBundle === null || identityBundle === undefined
      ? null
      : {
          authConfigurationDiagnostics: identityBundle.authConfigurationDiagnostics,
          authConfigurationDiagnosticsAvailable: true,
          identityProviderDiagnostics: identityBundle.identityProviderDiagnostics,
          identityProviderDiagnosticsAvailable: true,
          oidcDiagnostics: identityBundle.oidcDiagnostics,
          oidcDiagnosticsAvailable: true,
        };

  const identityLoadFailed = !identityPending && (identityBundle === null || identityBundle === undefined);

  const ssoStatus = resolveConfigurationReferenceSsoSurfaceStatus(identityInput, identityLoadFailed);
  const identityProvidersStatus = resolveConfigurationReferenceIdentityProvidersSurfaceStatus(
    identityInput,
    identityLoadFailed,
  );

  const configLintAvailable = includeHostConfigurationLint && !configLintPending && configLintData !== undefined;
  const configLintBlockingCount =
    configLintAvailable && configLintData !== undefined && !configLintData.loadFailed
      ? configLintData.blockingCount
      : null;

  const configurationSummaryStatus = resolveConfigurationReferenceConfigurationSummarySurfaceStatus(
    configLintAvailable,
    configLintBlockingCount,
  );

  return (
    <section
      id={CONFIGURATION_REFERENCE_HELP_ACTION_PANEL_ID}
      className={cn(HELP_PAGE_LAYOUT.contentPanel, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "scroll-mt-24")}
      data-testid="help-configuration-reference-action-panel"
      aria-labelledby="help-configuration-reference-action-panel-heading"
    >
      <h2
        id="help-configuration-reference-action-panel-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {CONFIGURATION_REFERENCE_HELP_ACTION_PANEL_TITLE}
      </h2>
      <ul className={cn("m-0 list-none space-y-3 p-0", OPERATOR_TYPOGRAPHY.body)}>
        <SurfaceActionRow
          label={CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openSsoWizard.label}
          href={CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openSsoWizard.href}
          statusKind={ssoStatus.kind}
          statusLabel={ssoStatus.label}
        />
        <SurfaceActionRow
          label={CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openIdentityProviders.label}
          href={CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openIdentityProviders.href}
          statusKind={identityProvidersStatus.kind}
          statusLabel={identityProvidersStatus.label}
        />
        <SurfaceActionRow
          label={CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openConfigurationSummary.label}
          href={CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openConfigurationSummary.href}
          statusKind={configurationSummaryStatus.kind}
          statusLabel={configurationSummaryStatus.label}
        />
      </ul>
    </section>
  );
}
