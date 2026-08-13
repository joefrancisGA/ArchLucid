"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  IDENTITY_PROVIDERS_SAML_TEST_MAPPING_CARD_DESCRIPTION,
  IDENTITY_PROVIDERS_SAML_TEST_MAPPING_CARD_TITLE,
} from "@/lib/identity-providers-settings-copy";
import type { components } from "@/lib/openapi-schemas";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { showError, showSuccess } from "@/lib/toast";

type AdminTokenClaimsDiagnosticResponse = components["schemas"]["AdminTokenClaimsDiagnosticResponse"];

/**
 * Dry-run JWT role mapping against current tenant configuration via POST /v1/admin/auth/diagnose-token.
 */
export function AuthTokenTestMappingCard(
  props: {
    readonly showTechnicalDetails?: boolean;
    readonly unsavedEditsNotice?: string | null;
  } = {},
): React.JSX.Element {
  const [bearerToken, setBearerToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AdminTokenClaimsDiagnosticResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onTestMapping(): Promise<void> {
    const token = bearerToken.trim();

    if (token.length === 0) {
      setErrorMessage("Paste a sample JWT bearer token (without the Bearer prefix).");
      setResult(null);

      return;
    }

    setBusy(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const response = await fetch(
        "/api/proxy/v1/admin/auth/diagnose-token",
        mergeRegistrationScopeForProxy({
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bearerToken: token }),
        }),
      );

      const bodyText = await response.text();

      if (!response.ok) {
        const apiError = buildApiRequestErrorFromParts(response, bodyText);
        setErrorMessage(apiError.message);
        showError("Test mapping", apiError.message);

        return;
      }

      const payload = JSON.parse(bodyText) as AdminTokenClaimsDiagnosticResponse;
      setResult(payload);
      showSuccess("Token mapping evaluated — review resolved roles below.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Test mapping request failed.";
      setErrorMessage(message);
      showError("Test mapping", message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card id="auth-token-test-mapping-card" data-testid="auth-token-test-mapping-card">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>
          {props.showTechnicalDetails === true ? "Test mapping" : IDENTITY_PROVIDERS_SAML_TEST_MAPPING_CARD_TITLE}
        </CardTitle>
        <CardDescription>
          {props.showTechnicalDetails === true
            ? "Paste a sample JWT from your IdP (payload only — signature is not validated). ArchLucid evaluates claim mappings and returns resolved roles without changing tenant configuration."
            : IDENTITY_PROVIDERS_SAML_TEST_MAPPING_CARD_DESCRIPTION}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {props.unsavedEditsNotice !== undefined && props.unsavedEditsNotice !== null ? (
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="auth-test-mapping-unsaved-notice"
            role="status"
          >
            {props.unsavedEditsNotice}
          </p>
        ) : null}
        <div className="space-y-1">
          <Label htmlFor="auth-test-mapping-token">Sample bearer token</Label>
          <Textarea
            id="auth-test-mapping-token"
            value={bearerToken}
            onChange={(event) => {
              setBearerToken(event.target.value);
            }}
            rows={4}
            className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}
            placeholder="eyJhbGciOiJ..."
            data-testid="auth-test-mapping-token-input"
          />
        </div>
        <Button
          type="button"
          size="sm"
          disabled={busy}
          data-testid="auth-test-mapping-submit"
          onClick={() => {
            void onTestMapping();
          }}
        >
          {busy ? "Evaluating…" : "Test mapping"}
        </Button>
        {errorMessage !== null ? (
          <p className={cn("m-0 text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.body)} role="alert" data-testid="auth-test-mapping-error">
            {errorMessage}
          </p>
        ) : null}
        {result !== null ? (
          <div className={cn("space-y-2", OPERATOR_TYPOGRAPHY.body)} data-testid="auth-test-mapping-result">
            <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>Resolved roles</p>
            {(result.resolvedRoles ?? []).length > 0 ? (
              <ul className="m-0 list-disc pl-5">
                {(result.resolvedRoles ?? []).map((role) => (
                  <li key={role}>{role}</li>
                ))}
              </ul>
            ) : (
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>No ArchLucid roles resolved.</p>
            )}
            {(result.unmappedValues ?? []).length > 0 ? (
              <>
                <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>Unmapped claim values</p>
                <ul className="m-0 list-disc pl-5">
                  {(result.unmappedValues ?? []).map((value) => (
                    <li key={value}>{value}</li>
                  ))}
                </ul>
              </>
            ) : null}
            {(result.warnings ?? []).length > 0 ? (
              <>
                <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>Warnings</p>
                <ul className="m-0 list-disc pl-5 text-amber-900 dark:text-amber-100">
                  {(result.warnings ?? []).map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
