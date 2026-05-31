"use client";

import { useCallback, useEffect, useState } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { showError, showSuccess } from "@/lib/toast";

type ScimTokenSummary = {
  id: string;
  createdUtc: string;
  revokedUtc?: string | null;
  publicLookupKey: string;
};

type ScimTokenIssueResponse = {
  id: string;
  publicLookupKey: string;
  plaintextToken: string;
};

type VerifyState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "ok"; detail: string }
  | { status: "failed"; message: string };

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; tokens: ScimTokenSummary[] }
  | { status: "blocked"; message: string };

const tokensPath = "/api/proxy/v1/admin/scim/tokens";
const serviceProviderConfigPath = "/api/proxy/scim/v2/ServiceProviderConfig";

/** SCIM inbound provisioning token management with bearer verification before save. */
export function ScimProvisioningSettingsPageClient() {
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [issuedToken, setIssuedToken] = useState<ScimTokenIssueResponse | null>(null);
  const [verifyToken, setVerifyToken] = useState("");
  const [verifyState, setVerifyState] = useState<VerifyState>({ status: "idle" });
  const [issuing, setIssuing] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const response = await fetch(
        tokensPath,
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
      );

      if (!response.ok) {
        setState({
          status: "blocked",
          message:
            response.status === 401 || response.status === 403
              ? "Admin session required for SCIM token management."
              : `SCIM tokens unavailable (HTTP ${response.status}).`,
        });

        return;
      }

      const payload = (await response.json()) as { tokens?: ScimTokenSummary[] };
      setState({ status: "ready", tokens: payload.tokens ?? [] });
    } catch (error: unknown) {
      setState({ status: "blocked", message: error instanceof Error ? error.message : String(error) });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const issueToken = useCallback(async () => {
    setIssuing(true);
    setIssuedToken(null);
    setVerifyState({ status: "idle" });

    try {
      const response = await fetch(
        tokensPath,
        mergeRegistrationScopeForProxy({ method: "POST", headers: { Accept: "application/json" } }),
      );

      if (!response.ok) {
        showError("Issue SCIM token", `HTTP ${response.status}`);

        return;
      }

      const payload = (await response.json()) as ScimTokenIssueResponse;
      setIssuedToken(payload);
      setVerifyToken(payload.plaintextToken);
      showSuccess("SCIM token issued — verify before configuring your IdP.");
      await load();
    } finally {
      setIssuing(false);
    }
  }, [load]);

  const verifyConnection = useCallback(async () => {
    const token = verifyToken.trim();

    if (token.length === 0) {
      setVerifyState({ status: "failed", message: "Paste a SCIM bearer token before verifying." });

      return;
    }

    setVerifyState({ status: "checking" });

    try {
      const response = await fetch(serviceProviderConfigPath, {
        headers: {
          Accept: "application/scim+json, application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const body = await response.text();
        setVerifyState({
          status: "failed",
          message: body.trim().length > 0 ? body : `Verification failed (HTTP ${response.status}).`,
        });

        return;
      }

      setVerifyState({ status: "ok", detail: "SCIM ServiceProviderConfig responded successfully." });
    } catch (error: unknown) {
      setVerifyState({
        status: "failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }, [verifyToken]);

  const revokeToken = useCallback(
    async (tokenId: string) => {
      setRevokingId(tokenId);

      try {
        const response = await fetch(
          `${tokensPath}/${encodeURIComponent(tokenId)}`,
          mergeRegistrationScopeForProxy({ method: "DELETE" }),
        );

        if (!response.ok) {
          showError("Revoke SCIM token", `HTTP ${response.status}`);

          return;
        }

        showSuccess("SCIM token revoked.");
        await load();
      } finally {
        setRevokingId(null);
      }
    },
    [load],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6" data-testid="scim-provisioning-settings-page">
      <header>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">SCIM provisioning</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Issue inbound SCIM bearer tokens for your identity provider and verify connectivity before saving IdP configuration.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Issue token</CardTitle>
          <CardDescription>Plaintext tokens are shown once. Store them in your IdP SCIM provisioning app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button type="button" onClick={() => void issueToken()} disabled={issuing}>
            {issuing ? "Issuing…" : "Issue new SCIM token"}
          </Button>
          {issuedToken !== null ? (
            <div className="rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50 p-3 text-sm">
              <p className="m-0 font-medium text-amber-950 dark:text-amber-100">Copy this token now — it will not be shown again.</p>
              <code className="mt-2 block break-all rounded bg-white/80 p-2 font-mono text-xs dark:bg-neutral-900/80">
                {issuedToken.plaintextToken}
              </code>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verify connection</CardTitle>
          <CardDescription>Calls <code>GET /scim/v2/ServiceProviderConfig</code> with the bearer token you plan to configure.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="scim-verify-token">SCIM bearer token</Label>
            <Input
              id="scim-verify-token"
              type="password"
              autoComplete="off"
              value={verifyToken}
              onChange={(event) => {
                setVerifyToken(event.currentTarget.value);
                setVerifyState({ status: "idle" });
              }}
              data-testid="scim-verify-token-input"
            />
          </div>
          <Button type="button" variant="outline" onClick={() => void verifyConnection()} disabled={verifyState.status === "checking"}>
            {verifyState.status === "checking" ? "Verifying…" : "Verify connection"}
          </Button>
          {verifyState.status === "ok" ? (
            <p className="m-0 text-sm font-medium text-emerald-800 dark:text-emerald-300" data-testid="scim-verify-success">
              {verifyState.detail}
            </p>
          ) : null}
          {verifyState.status === "failed" ? (
            <OperatorApiProblem fallbackMessage={verifyState.message} problem={null} variant="warning" />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active tokens</CardTitle>
          <CardDescription>Revoke tokens when rotating IdP provisioning credentials.</CardDescription>
        </CardHeader>
        <CardContent>
          {state.status === "loading" || state.status === "idle" ? (
            <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">Loading tokens…</p>
          ) : null}
          {state.status === "blocked" ? <OperatorApiProblem fallbackMessage={state.message} problem={null} /> : null}
          {state.status === "ready" && state.tokens.length === 0 ? (
            <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">No SCIM tokens issued yet.</p>
          ) : null}
          {state.status === "ready" && state.tokens.length > 0 ? (
            <ul className="m-0 space-y-3">
              {state.tokens.map((token) => (
                <li key={token.id} className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
                  <p className="m-0 font-mono text-xs">{token.publicLookupKey}</p>
                  <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                    Created {token.createdUtc}
                    {token.revokedUtc ? ` · Revoked ${token.revokedUtc}` : ""}
                  </p>
                  {!token.revokedUtc ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      disabled={revokingId === token.id}
                      onClick={() => {
                        void revokeToken(token.id);
                      }}
                    >
                      {revokingId === token.id ? "Revoking…" : "Revoke"}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
