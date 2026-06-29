"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  activateTenantSamlIdentityProvider,
  discoverIdentityProviderMetadata,
  fetchTenantIdentityProviderConfiguration,
} from "@/lib/admin-identity-provider-api";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildSamlSpActivateRequest,
  createDefaultSamlSpConfigurationFormValues,
  hydrateSamlSpConfigurationFormValues,
  isSamlSpConfigurationFormValid,
  type SamlSpConfigurationFormValues,
} from "@/lib/saml-sp-configuration-form-state";
import { showSuccess } from "@/lib/toast";

const ARCHLUCID_ROLES = ["Admin", "Operator", "Reader", "Auditor"] as const;

/** Admin form for SAML 2.0 SP tenant configuration (issuer, IdP metadata URL, claim mappings). */
export function SamlSpConfigurationForm() {
  const [values, setValues] = useState<SamlSpConfigurationFormValues>(() => createDefaultSamlSpConfigurationFormValues());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedUtc, setSavedUtc] = useState<string | null>(null);
  const [discoveredClaimNames, setDiscoveredClaimNames] = useState<string[]>([]);

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

      showSuccess("IdP metadata fetched — confirm issuer and claim mappings.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [values.idpMetadataUrl]);

  const saveConfiguration = useCallback(async () => {
    if (!isSamlSpConfigurationFormValid(values)) {
      setError("Issuer, role claim name, and at least one IdP value mapping are required.");

      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await activateTenantSamlIdentityProvider(buildSamlSpActivateRequest(values));

      setSavedUtc(response.updatedUtc ?? new Date().toISOString());
      showSuccess("SAML 2.0 SP configuration saved for this tenant.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [values]);

  const canSave = isSamlSpConfigurationFormValid(values) && !busy && !loading;

  return (
    <Card data-testid="saml-sp-configuration-form">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>SAML 2.0 SP configuration</CardTitle>
        <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Configure workforce SSO for this tenant. Saves to{" "}
          <code className={cn("font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>
            dbo.TenantIdentityProviderConfigurations
          </code>{" "}
          via{" "}
          <code className={cn("font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>
            POST /v1/admin/identity/activate
          </code>
          . Host{" "}
          <code className={cn("font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>ArchLucidAuth:Saml2</code>{" "}
          startup wiring is unchanged — mirror SP entity ID and signing cert in your deployment environment. For OIDC or
          step-by-step discovery, use the{" "}
          <Link href="/settings/identity/sso-wizard" className={OPERATOR_LINK.inline}>
            SSO configuration wizard
          </Link>
          .
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error !== null ? (
          <div role="alert">
            <OperatorApiProblem problem={null} fallbackMessage={error} />
          </div>
        ) : null}

        {loading ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="status">
            Loading SAML configuration…
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="saml-idp-metadata-url">IdP metadata URL</Label>
              <Input
                id="saml-idp-metadata-url"
                data-testid="saml-idp-metadata-url"
                value={values.idpMetadataUrl}
                onChange={(e) => {
                  setValues((prev) => ({ ...prev, idpMetadataUrl: e.target.value }));
                }}
                placeholder="https://idp.example.com/FederationMetadata/2007-06/FederationMetadata.xml"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy || values.idpMetadataUrl.trim().length === 0}
                  onClick={() => void runDiscover()}
                  data-testid="saml-fetch-metadata-button"
                >
                  Fetch IdP issuer
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="saml-sp-issuer">Issuer (IdP entity ID)</Label>
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
                Issuer from IdP federation metadata. Align host{" "}
                <code className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>ArchLucidAuth:Saml2:IdPMetadata</code> with
                the metadata URL above.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="saml-role-claim">SAML attribute for roles / groups</Label>
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
              <Label htmlFor="saml-group-regex">Optional custom group claim regex</Label>
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

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                disabled={!canSave}
                onClick={() => void saveConfiguration()}
                data-testid="saml-save-configuration-button"
              >
                {busy ? "Saving…" : "Save SAML configuration"}
              </Button>
              {savedUtc !== null ? (
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
                  Last saved {new Date(savedUtc).toLocaleString()}
                </p>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
