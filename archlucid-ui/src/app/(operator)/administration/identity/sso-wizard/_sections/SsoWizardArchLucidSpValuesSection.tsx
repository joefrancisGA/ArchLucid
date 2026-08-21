"use client";

import { HelpCopyableValue } from "@/components/help/HelpCopyableValue";
import { ArchLucidSamlSpValuesCard } from "@/app/(operator)/administration/identity-providers/_sections/ArchLucidSamlSpValuesCard";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { getOidcClientId, getOidcRedirectUri } from "@/lib/oidc/config";
import {
  SSO_WIZARD_OIDC_SP_CLIENT_ID_LABEL,
  SSO_WIZARD_OIDC_SP_REDIRECT_URI_LABEL,
  SSO_WIZARD_OIDC_SP_VALUES_INTRO,
} from "@/lib/sso-wizard-copy";
import { cn } from "@/lib/utils";

import type { SsoWizardProtocol } from "./sso-wizard-state";

export type SsoWizardArchLucidSpValuesSectionProps = {
  readonly protocol: SsoWizardProtocol | null;
};

export function SsoWizardArchLucidSpValuesSection(
  props: SsoWizardArchLucidSpValuesSectionProps,
): React.JSX.Element | null {
  if (props.protocol === "saml") {
    return (
      <div data-testid="sso-wizard-sp-values-saml">
        <ArchLucidSamlSpValuesCard />
      </div>
    );
  }

  if (props.protocol === "oidc") {
    const redirectUri = getOidcRedirectUri();
    const clientId = getOidcClientId();

    return (
      <div
        className={cn(
          "space-y-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-700",
          OPERATOR_TYPOGRAPHY.body,
        )}
        data-testid="sso-wizard-sp-values-oidc"
      >
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{SSO_WIZARD_OIDC_SP_VALUES_INTRO}</p>
        <HelpCopyableValue
          label={SSO_WIZARD_OIDC_SP_REDIRECT_URI_LABEL}
          value={redirectUri || " — "}
          testId="sso-wizard-oidc-redirect-uri"
        />
        <HelpCopyableValue
          label={SSO_WIZARD_OIDC_SP_CLIENT_ID_LABEL}
          value={clientId || " — "}
          testId="sso-wizard-oidc-client-id"
        />
      </div>
    );
  }

  return null;
}
