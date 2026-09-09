"use client";

import Link from "next/link";

import { HelpCopyableValue } from "@/components/help/HelpCopyableValue";
import { useLocalizedProductCopy } from "@/hooks/use-localized-product-copy";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  IDENTITY_PROVIDERS_SAML_SP_ACS_HOST_NOTE,
  IDENTITY_PROVIDERS_SAML_SP_ACS_LABEL,
  IDENTITY_PROVIDERS_SAML_SP_ENTITY_ID_LABEL,
  IDENTITY_PROVIDERS_SAML_SP_METADATA_UNAVAILABLE,
  IDENTITY_PROVIDERS_SAML_SP_VALUES_CARD_INTRO,
  IDENTITY_PROVIDERS_SAML_SP_VALUES_CARD_TITLE,
} from "@/lib/identity-providers-settings-copy";
import { IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_HREF } from "@/lib/identity-providers-settings-copy";
import { SAML_SP_ACS_PATH } from "@/lib/saml-sp-acs-url";
import { cn } from "@/lib/utils";

/** Read-only ArchLucid SAML service provider values for IdP registration. */
export function ArchLucidSamlSpValuesCard(): React.JSX.Element {
  const { localize } = useLocalizedProductCopy();

  return (
    <Card data-testid="archlucid-saml-sp-values-card">
      <CardHeader>
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {localize(IDENTITY_PROVIDERS_SAML_SP_VALUES_CARD_TITLE)}
        </h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {IDENTITY_PROVIDERS_SAML_SP_VALUES_CARD_INTRO}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <HelpCopyableValue
            label={IDENTITY_PROVIDERS_SAML_SP_ACS_LABEL}
            value={SAML_SP_ACS_PATH}
            testId="archlucid-saml-sp-acs-url"
          />
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {localize(IDENTITY_PROVIDERS_SAML_SP_ACS_HOST_NOTE)}
          </p>
        </div>
        <div className="space-y-1" data-testid="archlucid-saml-sp-entity-id-unavailable">
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>
            {localize(IDENTITY_PROVIDERS_SAML_SP_ENTITY_ID_LABEL)}
          </p>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {localize(IDENTITY_PROVIDERS_SAML_SP_METADATA_UNAVAILABLE)}
          </p>
        </div>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          SP metadata XML and signing certificate details are not exposed on this page yet. Review read-only SP
          certificate health on{" "}
          <Link href={IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_HREF} className={OPERATOR_LINK.inline}>
            Identity diagnostics
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}
