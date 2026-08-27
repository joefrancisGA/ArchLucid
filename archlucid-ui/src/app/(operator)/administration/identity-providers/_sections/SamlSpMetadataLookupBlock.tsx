"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  IDENTITY_PROVIDERS_ACTION_FETCH_IDP_METADATA,
  IDENTITY_PROVIDERS_SAML_METADATA_URL_HELPER,
  IDENTITY_PROVIDERS_SAML_METADATA_URL_LABEL,
} from "@/lib/identity-providers-settings-copy";
import type { SamlSpConfigurationFormValues } from "@/lib/saml-sp-configuration-form-state";

type SamlSpMetadataLookupBlockProps = {
  readonly values: SamlSpConfigurationFormValues;
  readonly busy: boolean;
  readonly fetchMetadataDisabledReason: string | null;
  readonly onMetadataUrlChange: (value: string) => void;
  readonly onFetchMetadata: () => void;
};

export function SamlSpMetadataLookupBlock(props: SamlSpMetadataLookupBlockProps) {
  const { values, busy, fetchMetadataDisabledReason, onMetadataUrlChange, onFetchMetadata } = props;

  return (
    <div
      className="space-y-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
      data-testid="saml-idp-metadata-lookup-block"
    >
      <Label htmlFor="saml-idp-metadata-url">{IDENTITY_PROVIDERS_SAML_METADATA_URL_LABEL}</Label>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {IDENTITY_PROVIDERS_SAML_METADATA_URL_HELPER}
      </p>
      <Input
        id="saml-idp-metadata-url"
        data-testid="saml-idp-metadata-url"
        value={values.idpMetadataUrl}
        onChange={(e) => {
          onMetadataUrlChange(e.target.value);
        }}
        placeholder="https://idp.example.com/FederationMetadata/2007-06/FederationMetadata.xml"
      />
      <div className="flex flex-col items-start gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || values.idpMetadataUrl.trim().length === 0}
          onClick={() => void onFetchMetadata()}
          data-testid="saml-fetch-metadata-button"
          aria-describedby={
            busy || values.idpMetadataUrl.trim().length === 0 ? "saml-fetch-metadata-disabled-hint" : undefined
          }
        >
          {IDENTITY_PROVIDERS_ACTION_FETCH_IDP_METADATA}
        </Button>
        <WhyDisabledCtaHint
          id="saml-fetch-metadata-disabled-hint"
          reason={fetchMetadataDisabledReason}
          testId="saml-fetch-metadata-disabled-hint"
          className="max-w-3xl"
        />
      </div>
    </div>
  );
}
