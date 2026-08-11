"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { StatusTag } from "@/components/ui/status-tag";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { identityProviderCustomerStatusPresentation } from "@/lib/identity-provider-probe-status-presentation";
import {
  IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES,
  IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES_HELPER,
  IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES_LABEL,
  IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_TITLE,
} from "@/lib/identity-providers-settings-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { IdentityProvidersSettingsShell } from "./IdentityProvidersSettingsShell";
import type { UseIdentityProvidersSettingsPageModel } from "./use-identity-providers-settings-page";

type IdentityProvidersRoleMappingPageViewProps = {
  readonly model: UseIdentityProvidersSettingsPageModel;
};

export function IdentityProvidersRoleMappingPageView(
  props: IdentityProvidersRoleMappingPageViewProps,
): React.JSX.Element {
  const identitySource =
    props.model.authConfigurationDiagnostics?.tenantIdentityProviderProtocol === "Saml"
      ? "SAML tenant configuration"
      : props.model.authConfigurationDiagnostics?.authMode === "JwtBearer"
        ? "OIDC/JWT claims"
        : "Not configured";

  const claimSource = props.model.authConfigurationDiagnostics?.roleClaimNameConfigured === true
    ? "Configured"
    : "Not configured";
  const mappingPresentation = identityProviderCustomerStatusPresentation(props.model.overview.roleMappingStatus);

  return (
    <IdentityProvidersSettingsShell
      pageTitle={IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_TITLE}
      pageSubtitle={IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_SUBTITLE}
      refreshing={props.model.refreshing}
      lastRefreshedAt={props.model.lastRefreshedAt}
      onRefresh={() => void props.model.refresh()}
    >
      <div className="flex justify-end">
        <PageContextualHelpButton />
      </div>
<Card data-testid="identity-providers-role-mapping-status">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Role mapping status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <dl className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
            <div>
              <dt className="text-al-text-secondary">Identity source</dt>
              <dd className="m-0 mt-1 font-medium text-al-text-primary">{identitySource}</dd>
            </div>
            <div>
              <dt className="text-al-text-secondary">Claim / group source</dt>
              <dd className="m-0 mt-1 font-medium text-al-text-primary">{claimSource}</dd>
            </div>
            <div>
              <dt className="text-al-text-secondary">Mapping status</dt>
              <dd className="m-0 mt-1" data-testid="identity-providers-role-mapping-status-tag">
                <StatusTag kind={mappingPresentation.kind} label={mappingPresentation.label} />
              </dd>
            </div>
            <div>
              <dt className="text-al-text-secondary">Default role behavior</dt>
              <dd className="m-0 mt-1 text-al-text-primary">
                Unmapped users do not receive elevated workspace roles until a matching group or claim is mapped.
              </dd>
            </div>
          </dl>
          <div>
            <p
              className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
              id="identity-providers-role-mapping-examples-label"
            >
              {IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES_LABEL}
            </p>
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES_HELPER}
            </p>
            <ul
              aria-labelledby="identity-providers-role-mapping-examples-label"
              className={cn("m-0 mt-2 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="identity-providers-role-mapping-examples"
            >
            {IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES.map((example) => (
              <li key={example.archLucidRole}>
                {example.idpValue} → {example.archLucidRole}
              </li>
            ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/administration/identity-providers/saml">Edit SAML role mapping</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/administration/identity-providers/diagnostics">Test role mapping</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </IdentityProvidersSettingsShell>
  );
}
