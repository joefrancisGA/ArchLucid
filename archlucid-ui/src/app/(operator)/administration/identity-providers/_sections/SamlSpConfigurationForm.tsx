"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { MutatingInTenantChip } from "@/components/MutatingInTenantChip";
import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  activateTenantSamlIdentityProvider,
  discoverIdentityProviderMetadata,
  fetchTenantIdentityProviderConfiguration,
} from "@/lib/admin-identity-provider-api";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  addSamlSpClaimMappingRow,
  buildSamlSpActivateRequest,
  createDefaultSamlSpConfigurationFormValues,
  hydrateSamlSpConfigurationFormValues,
  isSamlSpConfigurationFormValid,
  removeSamlSpClaimMappingRow,
  resolveSamlSpConfigurationFieldErrors,
  resolveSamlSpConfigurationValidationErrors,
  type SamlSpConfigurationFormValues,
} from "@/lib/saml-sp-configuration-form-state";
import {
  IDENTITY_PROVIDERS_ACTION_FETCH_IDP_METADATA,
  IDENTITY_PROVIDERS_ACTION_SAVE,
  IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES,
  IDENTITY_PROVIDERS_ROLE_MAPPING_HELPER,
  IDENTITY_PROVIDERS_ROLE_MAPPING_SEMANTICS_HELPER,
  IDENTITY_PROVIDERS_SAML_ADVANCED_SETTINGS_TITLE,
  IDENTITY_PROVIDERS_SAML_GROUP_REGEX_LABEL,
  IDENTITY_PROVIDERS_SAML_ISSUER_LABEL,
  IDENTITY_PROVIDERS_SAML_MAPPING_ADD_ROW,
  IDENTITY_PROVIDERS_SAML_MAPPING_REMOVE_ROW,
  IDENTITY_PROVIDERS_SAML_METADATA_URL_HELPER,
  IDENTITY_PROVIDERS_SAML_METADATA_URL_LABEL,
  IDENTITY_PROVIDERS_SAML_ROLE_CLAIM_LABEL,
  IDENTITY_PROVIDERS_SAML_SAVE_EFFECT_LINE,
  IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_LINK_HREF,
  IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_LINK_LABEL,
  IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_SUFFIX,
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

type SamlSpConfigurationFormProps = {
  readonly onDirtyChange?: (dirty: boolean) => void;
};

function resolveRoleMappingPlaceholder(archLucidRole: string): string {
  const example = IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES.find((row) => row.archLucidRole === archLucidRole);

  return example?.idpValue ?? "e.g. archlucid-admins";
}

function serializeSamlSpConfigurationValues(values: SamlSpConfigurationFormValues): string {
  return JSON.stringify({
    issuerUri: values.issuerUri.trim(),
    roleClaimName: values.roleClaimName.trim(),
    customGroupClaimRegex: values.customGroupClaimRegex.trim(),
    mappings: values.mappings.map((row) => ({
      idpValue: row.idpValue.trim(),
      archLucidRole: row.archLucidRole.trim(),
    })),
  });
}

/** Admin form for SAML 2.0 SP tenant configuration (issuer, IdP metadata URL, claim mappings). */
export function SamlSpConfigurationForm(props: SamlSpConfigurationFormProps = {}) {
  const [values, setValues] = useState<SamlSpConfigurationFormValues>(() => createDefaultSamlSpConfigurationFormValues());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedUtc, setSavedUtc] = useState<string | null>(null);
  const [discoveredClaimNames, setDiscoveredClaimNames] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState({
    issuerUri: false,
    roleClaimName: false,
    mappings: false,
  });

  const validationErrors = useMemo(() => resolveSamlSpConfigurationValidationErrors(values), [values]);
  const fieldErrors = useMemo(() => resolveSamlSpConfigurationFieldErrors(values), [values]);
  const hasUnsavedEdits =
    savedSnapshot !== null && serializeSamlSpConfigurationValues(values) !== savedSnapshot;

  const loadConfiguration = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const record = await fetchTenantIdentityProviderConfiguration();

      const hydratedValues = hydrateSamlSpConfigurationFormValues(record);
      setValues(hydratedValues);
      setSavedSnapshot(serializeSamlSpConfigurationValues(hydratedValues));
      setTouchedFields({ issuerUri: false, roleClaimName: false, mappings: false });
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

  useEffect(() => {
    props.onDirtyChange?.(hasUnsavedEdits);
  }, [hasUnsavedEdits, props]);

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
      setSavedSnapshot(serializeSamlSpConfigurationValues(values));
      setTouchedFields({ issuerUri: false, roleClaimName: false, mappings: false });
      setSuccessMessage(SAML_CONFIGURATION_SAVED_SUCCESS_MESSAGE);
      setSaveConfirmOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [values]);

  const requestSaveConfiguration = useCallback(() => {
    if (!isSamlSpConfigurationFormValid(values)) {
      setTouchedFields({ issuerUri: true, roleClaimName: true, mappings: true });

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
                  setValues((prev) => ({ ...prev, idpMetadataUrl: e.target.value }));
                }}
                placeholder="https://idp.example.com/FederationMetadata/2007-06/FederationMetadata.xml"
              />
              <div className="flex flex-col items-start gap-2">
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
                  className="max-w-3xl"
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
                onBlur={() => {
                  setTouchedFields((prev) => ({ ...prev, roleClaimName: true }));
                }}
                aria-invalid={touchedFields.roleClaimName && fieldErrors.roleClaimName !== null ? true : undefined}
                aria-describedby={
                  touchedFields.roleClaimName && fieldErrors.roleClaimName !== null
                    ? "saml-role-claim-error"
                    : undefined
                }
                placeholder="groups"
              />
              {touchedFields.roleClaimName && fieldErrors.roleClaimName !== null ? (
                <p
                  id="saml-role-claim-error"
                  className={cn("m-0 text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.helper)}
                  role="alert"
                  data-testid="saml-role-claim-error"
                >
                  {fieldErrors.roleClaimName}
                </p>
              ) : null}
              <datalist id="saml-discovered-claim-names">
                {discoveredClaimNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{IDENTITY_PROVIDERS_ROLE_MAPPING_HELPER}</p>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="saml-role-mapping-semantics">
              {IDENTITY_PROVIDERS_ROLE_MAPPING_SEMANTICS_HELPER}
            </p>

            <div className="overflow-x-auto">
              <table className={cn("w-full text-left", OPERATOR_TYPOGRAPHY.body)} data-testid="saml-claim-mapping-table">
                <thead>
                  <tr className={cn("border-b border-neutral-200 dark:border-neutral-700", OPERATOR_NAV_GROUP_LABEL)}>
                    <th className="py-2 pr-2">IdP group / role value</th>
                    <th className="py-2 pr-2">ArchLucid role</th>
                    <th className="py-2">
                      <span className="sr-only">Row actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {values.mappings.map((row, index) => (
                    <tr key={row.rowId} className="border-b border-neutral-100 dark:border-neutral-800">
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
                          onBlur={() => {
                            setTouchedFields((prev) => ({ ...prev, mappings: true }));
                          }}
                          placeholder={resolveRoleMappingPlaceholder(row.archLucidRole)}
                          data-testid={`saml-mapping-idp-${row.rowId}`}
                          aria-label={`IdP group or role value for mapping ${index + 1}`}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Select
                          value={row.archLucidRole}
                          onValueChange={(archLucidRole) => {
                            setValues((prev) => {
                              const mappings = [...prev.mappings];
                              mappings[index] = { ...mappings[index], archLucidRole };

                              return { ...prev, mappings };
                            });
                          }}
                        >
                          <SelectTrigger
                            className="h-9 w-full"
                            aria-label={`ArchLucid role for mapping ${index + 1}`}
                            data-testid={`saml-mapping-role-${row.rowId}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ARCHLUCID_ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={values.mappings.length <= 1}
                          onClick={() => {
                            setValues((prev) => removeSamlSpClaimMappingRow(prev, row.rowId));
                          }}
                          data-testid={`saml-mapping-remove-${row.rowId}`}
                          aria-label={`Remove mapping ${index + 1}`}
                        >
                          {IDENTITY_PROVIDERS_SAML_MAPPING_REMOVE_ROW}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {touchedFields.mappings && fieldErrors.mappings !== null ? (
              <p
                className={cn("m-0 text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.helper)}
                role="alert"
                data-testid="saml-mapping-table-error"
              >
                {fieldErrors.mappings}
              </p>
            ) : null}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setValues((prev) => addSamlSpClaimMappingRow(prev));
              }}
              data-testid="saml-mapping-add-row"
            >
              {IDENTITY_PROVIDERS_SAML_MAPPING_ADD_ROW}
            </Button>

            <details
              className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
              data-testid="saml-advanced-settings"
            >
              <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {IDENTITY_PROVIDERS_SAML_ADVANCED_SETTINGS_TITLE}
              </summary>
              <div className="mt-4 space-y-2">
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
            </details>

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
