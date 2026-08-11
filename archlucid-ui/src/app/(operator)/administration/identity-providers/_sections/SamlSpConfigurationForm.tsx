"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { MutatingInWorkspaceChip } from "@/components/MutatingInWorkspaceChip";
import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  activateTenantSamlIdentityProvider,
  discoverIdentityProviderMetadata,
  fetchTenantIdentityProviderConfiguration,
} from "@/lib/admin-identity-provider-api";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildSamlSpActivateRequest,
  createDefaultSamlSpConfigurationFormValues,
  hydrateSamlSpConfigurationFormValues,
  isSamlSpConfigurationFormValid,
  resolveSamlSpConfigurationValidationError,
  type SamlSpConfigurationFormValues,
} from "@/lib/saml-sp-configuration-form-state";
import {
  IDENTITY_PROVIDERS_ACTION_FETCH_IDP_METADATA,
  IDENTITY_PROVIDERS_ACTION_SAVE,
  IDENTITY_PROVIDERS_ROLE_MAPPING_HELPER,
  IDENTITY_PROVIDERS_SAML_GROUP_REGEX_LABEL,
  IDENTITY_PROVIDERS_SAML_ISSUER_LABEL,
  IDENTITY_PROVIDERS_SAML_METADATA_URL_LABEL,
  IDENTITY_PROVIDERS_SAML_ROLE_CLAIM_LABEL,
  IDENTITY_PROVIDERS_TEST_BEFORE_ENABLE_NOTICE,
} from "@/lib/identity-providers-settings-copy";
import {
  SAML_CONFIGURATION_SAVED_SUCCESS_MESSAGE,
  SAML_METADATA_FETCHED_SUCCESS_MESSAGE,
} from "@/lib/admin-integration-mutation-outcome-copy";
import {
  resolveSamlSpFetchMetadataDisabledReason,
  resolveSamlSpSaveDisabledReason,
} from "@/lib/saml-sp-configuration-disabled-cta";

import { IdentityProvidersSaveConfirmDialog } from "./IdentityProvidersSaveConfirmDialog";

const ARCHLUCID_ROLES = ["Admin", "Operator", "Reader", "Auditor"] as const;

/** Admin form for SAML 2.0 SP tenant configuration (issuer, IdP metadata URL, claim mappings). */
export function SamlSpConfigurationForm() {
  const [values, setValues] = useState<SamlSpConfigurationFormValues>(() => createDefaultSamlSpConfigurationFormValues());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedUtc, setSavedUtc] = useState<string | null>(null);
  const [discoveredClaimNames, setDiscoveredClaimNames] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);

  const loadConfiguration = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const record = await fetchTenantIdentityProviderConfiguration();

      setValues(hydrateSamlSpConfigurationFormValues(record));
      setSavedUtc(record?.updatedUtc ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfiguration();
  }, [loadConfiguration]);

  const runDiscover = useCallback(async () => {
    if (values.idpMetadataUrl.trim().length === 0) {
      setError("Enter an IdP metadata URL before fetching.");

      return;
    }

    setBusy(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await discoverIdentityProviderMetadata("saml", values.idpMetadataUrl.trim());

      if (response.discoverySucceeded !== true) {
        setError(response.diagnosticSummary ?? "Metadata discovery did not succeed.");

        return;
      }

      setValues((prev) => ({
        ...prev,
        issuerUri: response.issuerUri?.trim() ?? prev.issuerUri,
      }));
      setDiscoveredClaimNames(response.availableClaimNames ?? []);

      setSuccessMessage(SAML_METADATA_FETCHED_SUCCESS_MESSAGE);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [values.idpMetadataUrl]);

  const persistConfiguration = useCallback(async () => {
    setBusy(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await activateTenantSamlIdentityProvider(buildSamlSpActivateRequest(values));

      setSavedUtc(response.updatedUtc ?? new Date().toISOString());
      setSuccessMessage(SAML_CONFIGURATION_SAVED_SUCCESS_MESSAGE);
      setSaveConfirmOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [values]);

  const requestSaveConfiguration = useCallback(() => {
    const validationError = resolveSamlSpConfigurationValidationError(values);

    if (validationError !== null) {
      setError(validationError);

      return;
    }

    setSaveConfirmOpen(true);
  }, [values]);

  const canSave = isSamlSpConfigurationFormValid(values) && !busy && !loading;
  const saveDisabledReason = resolveSamlSpSaveDisabledReason({ values, loading, busy });
  const fetchMetadataDisabledReason = resolveSamlSpFetchMetadataDisabledReason({
    metadataUrl: values.idpMetadataUrl,
    busy,
  });

  return (
    <Card data-testid="saml-sp-configuration-form">
      <CardHeader>
        <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
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
            Loading SAML configurationâ€¦
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="saml-idp-metadata-url">{IDENTITY_PROVIDERS_SAML_METADATA_URL_LABEL}</Label>
              <Input
                id="saml-idp-metadata-url"
                data-testid="saml-idp-metadata-url"
                value={values.idpMetadataUrl}
                onChange={(e) => {
                  setValues((prev) => ({ ...prev, idpMetadataUrl: e.target.value }));
                }}
                placeholder="https://idp.example.com/FederationMetadata/2007-06/FederationMetadata.xml"
              />
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy || values.idpMetadataUrl.trim().length === 0}
                  onClick={() => void runDiscover()}
                  data-testid="saml-fetch-metadata-button"
                  aria-describedby={
                    busy || values.idpMetadataUrl.trim().length === 0
                      ? "saml-fetch-metadata-disabled-hint"
                      : undefined
                  }
                >
                  {IDENTITY_PROVIDERS_ACTION_FETCH_IDP_METADATA}
                </Button>
                <WhyDisabledCtaHint
                  id="saml-fetch-metadata-disabled-hint"
                  reason={fetchMetadataDisabledReason}
                  testId="saml-fetch-metadata-disabled-hint"
                  className="max-w-prose"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="saml-sp-issuer">{IDENTITY_PROVIDERS_SAML_ISSUER_LABEL}</Label>
              <Input
                id="saml-sp-issuer"
                data-testid="saml-sp-issuer"
                value={values.issuerUri}
                onChange={(e) => {
                  setValues((prev) => ({ ...prev, issuerUri: e.target.value }));
                }}
                placeholder="https://sts.example.com/"
              />
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Issuer from identity provider federation metadata.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="saml-role-claim">{IDENTITY_PROVIDERS_SAML_ROLE_CLAIM_LABEL}</Label>
              <Input
                id="saml-role-claim"
                list="saml-discovered-claim-names"
                data-testid="saml-role-claim"
                value={values.roleClaimName}
                onChange={(e) => {
                  setValues((prev) => ({ ...prev, roleClaimName: e.target.value }));
                }}
                placeholder="groups"
              />
              <datalist id="saml-discovered-claim-names">
                {discoveredClaimNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{IDENTITY_PROVIDERS_ROLE_MAPPING_HELPER}</p>

            <div className="overflow-x-auto">
              <table className={cn("w-full text-left", OPERATOR_TYPOGRAPHY.body)} data-testid="saml-claim-mapping-table">
                <thead>
                  <tr className={cn("border-b border-neutral-200 dark:border-neutral-700", OPERATOR_NAV_GROUP_LABEL)}>
                    <th className="py-2 pr-2">IdP group / role value</th>
                    <th className="py-2">ArchLucid role</th>
                  </tr>
                </thead>
                <tbody>
                  {values.mappings.map((row, index) => (
                    <tr key={row.archLucidRole} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className="py-2 pr-2">
                        <Input
                          value={row.idpValue}
                          onChange={(e) => {
                            const idpValue = e.target.value;

                            setValues((prev) => {
                              const mappings = [...prev.mappings];
                              mappings[index] = { ...mappings[index], idpValue };

                              return { ...prev, mappings };
                            });
                          }}
                          placeholder="e.g. archlucid-admins"
                          data-testid={`saml-mapping-idp-${row.archLucidRole}`}
                        />
                      </td>
                      <td className="py-2">
                        <select
                          className={cn(
                            "w-full rounded-md border border-neutral-300 bg-white px-2 py-2 dark:border-neutral-600 dark:bg-neutral-900",
                            OPERATOR_TYPOGRAPHY.body,
                          )}
                          value={row.archLucidRole}
                          onChange={(e) => {
                            const archLucidRole = e.target.value;

                            setValues((prev) => {
                              const mappings = [...prev.mappings];
                              mappings[index] = { ...mappings[index], archLucidRole };

                              return { ...prev, mappings };
                            });
                          }}
                        >
                          {ARCHLUCID_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              <Label htmlFor="saml-group-regex">{IDENTITY_PROVIDERS_SAML_GROUP_REGEX_LABEL}</Label>
              <Input
                id="saml-group-regex"
                data-testid="saml-group-regex"
                value={values.customGroupClaimRegex}
                onChange={(e) => {
                  setValues((prev) => ({ ...prev, customGroupClaimRegex: e.target.value }));
                }}
                placeholder="^AL-(Admin|Operator)-.*$"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <MutatingInWorkspaceChip />
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
                className="max-w-prose"
              />
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

