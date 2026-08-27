"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { MutatingInTenantChip } from "@/components/MutatingInTenantChip";
import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  IDENTITY_PROVIDERS_ACTION_SAVE,
  IDENTITY_PROVIDERS_SAML_ISSUER_LABEL,
  IDENTITY_PROVIDERS_SAML_SAVE_EFFECT_LINE,
  IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_LINK_HREF,
  IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_LINK_LABEL,
  IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_SUFFIX,
  IDENTITY_PROVIDERS_TEST_BEFORE_ENABLE_NOTICE,
} from "@/lib/identity-providers-settings-copy";

import { IdentityProvidersSaveConfirmDialog } from "./IdentityProvidersSaveConfirmDialog";
import { SamlSpClaimMappingsFields } from "./SamlSpClaimMappingsFields";
import { SamlSpMetadataLookupBlock } from "./SamlSpMetadataLookupBlock";
import { useSamlSpConfigurationForm } from "./use-saml-sp-configuration-form";

type SamlSpConfigurationFormProps = {
  readonly onDirtyChange?: (dirty: boolean) => void;
};

/** Admin form for SAML 2.0 SP tenant configuration (issuer, IdP metadata URL, claim mappings). */
export function SamlSpConfigurationForm(props: SamlSpConfigurationFormProps = {}) {
  const {
    values,
    setValues,
    loading,
    busy,
    error,
    savedUtc,
    discoveredClaimNames,
    successMessage,
    saveConfirmOpen,
    setSaveConfirmOpen,
    touchedFields,
    setTouchedFields,
    validationErrors,
    fieldErrors,
    runDiscover,
    persistConfiguration,
    requestSaveConfiguration,
    canSave,
    saveDisabledReason,
    fetchMetadataDisabledReason,
  } = useSamlSpConfigurationForm({ onDirtyChange: props.onDirtyChange });

  return (
    <Card data-testid="saml-sp-configuration-form">
      <CardHeader>
        <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {IDENTITY_PROVIDERS_TEST_BEFORE_ENABLE_NOTICE}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error !== null ? (
          <div role="alert">
            <OperatorApiProblem problem={null} fallbackMessage={error} />
          </div>
        ) : null}

        {successMessage !== null ? (
          <OperatorSuccessCallout message={successMessage} testId="saml-sp-configuration-success-callout" />
        ) : null}

        {loading ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="status">
            Loading SAML configuration…
          </p>
        ) : (
          <>
            <SamlSpMetadataLookupBlock
              values={values}
              busy={busy}
              fetchMetadataDisabledReason={fetchMetadataDisabledReason}
              onMetadataUrlChange={(idpMetadataUrl) => {
                setValues((prev) => ({ ...prev, idpMetadataUrl }));
              }}
              onFetchMetadata={() => void runDiscover()}
            />

            <div className="space-y-2">
              <Label htmlFor="saml-sp-issuer">{IDENTITY_PROVIDERS_SAML_ISSUER_LABEL}</Label>
              <Input
                id="saml-sp-issuer"
                data-testid="saml-sp-issuer"
                value={values.issuerUri}
                onChange={(e) => {
                  setValues((prev) => ({ ...prev, issuerUri: e.target.value }));
                }}
                onBlur={() => {
                  setTouchedFields((prev) => ({ ...prev, issuerUri: true }));
                }}
                aria-invalid={fieldErrors.issuerUri !== null ? true : undefined}
                aria-describedby={fieldErrors.issuerUri !== null ? "saml-sp-issuer-error" : undefined}
                placeholder="https://sts.example.com/"
              />
              {fieldErrors.issuerUri !== null ? (
                <p
                  id="saml-sp-issuer-error"
                  className={cn("m-0 text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.helper)}
                  role="alert"
                  data-testid="saml-sp-issuer-error"
                >
                  {fieldErrors.issuerUri}
                </p>
              ) : (
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Issuer from identity provider federation metadata.
                </p>
              )}
            </div>

            <SamlSpClaimMappingsFields
              values={values}
              setValues={setValues}
              touchedFields={touchedFields}
              setTouchedFields={setTouchedFields}
              fieldErrors={fieldErrors}
              discoveredClaimNames={discoveredClaimNames}
            />

            <div className="flex flex-col gap-2">
              <p
                className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="saml-save-effect-line"
              >
                {IDENTITY_PROVIDERS_SAML_SAVE_EFFECT_LINE}{" "}
                <Link href={IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_LINK_HREF} className={OPERATOR_LINK.inline}>
                  {IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_LINK_LABEL}
                </Link>
                {IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_SUFFIX}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <MutatingInTenantChip />
                <Button
                  type="button"
                  disabled={!canSave}
                  onClick={() => requestSaveConfiguration()}
                  data-testid="saml-save-configuration-button"
                  aria-describedby={!canSave ? "saml-save-configuration-disabled-hint" : undefined}
                >
                  {busy ? "Saving…" : IDENTITY_PROVIDERS_ACTION_SAVE}
                </Button>
                {savedUtc !== null ? (
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
                    Last saved {new Date(savedUtc).toLocaleString()}
                  </p>
                ) : null}
              </div>
              <WhyDisabledCtaHint
                id="saml-save-configuration-disabled-hint"
                reason={!canSave ? saveDisabledReason : null}
                testId="saml-save-configuration-disabled-hint"
                className="max-w-3xl"
              />
              {!canSave && validationErrors.length > 0 ? (
                <div data-testid="saml-save-readiness-list">
                  <p className={cn("m-0 font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Complete these items before saving:
                  </p>
                  <ul className={cn("m-0 mt-1 list-disc pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {validationErrors.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
      <IdentityProvidersSaveConfirmDialog
        open={saveConfirmOpen}
        busy={busy}
        onCancel={() => setSaveConfirmOpen(false)}
        onConfirm={() => void persistConfiguration()}
      />
    </Card>
  );
}
