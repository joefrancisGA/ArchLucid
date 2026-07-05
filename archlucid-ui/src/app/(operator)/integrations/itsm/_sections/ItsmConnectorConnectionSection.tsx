"use client";

import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildItsmAtlassianOAuthRedirectUri,
  deleteTenantItsmConnectorConnection,
  startItsmAtlassianOAuthConsent,
  type TenantItsmConnectorConnectionResponse,
  upsertTenantItsmConnectorConnection,
} from "@/lib/api/itsm-outbound-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type Provider = "jira" | "servicenow";
type AuthMode = "BasicApiToken" | "OAuth2RefreshToken" | "OAuth2ClientCredentials";

type Props = {
  readonly provider: Provider;
  readonly title: string;
  readonly summary: string;
  readonly connection: TenantItsmConnectorConnectionResponse | null;
  readonly canMutate: boolean;
  readonly onSaved: (connection: TenantItsmConnectorConnectionResponse | null) => void;
};

function resolveInitialAuthMode(connection: TenantItsmConnectorConnectionResponse | null): AuthMode {
  const raw = connection?.authMode?.trim();

  if (raw === "OAuth2RefreshToken")
    return "OAuth2RefreshToken";

  if (raw === "OAuth2ClientCredentials")
    return "OAuth2ClientCredentials";

  return "BasicApiToken";
}

export function ItsmConnectorConnectionSection(props: Props): React.ReactElement {
  const [authMode, setAuthMode] = useState<AuthMode>(resolveInitialAuthMode(props.connection));
  const [instanceBaseUrl, setInstanceBaseUrl] = useState(props.connection?.instanceBaseUrl ?? "");
  const [authUserName, setAuthUserName] = useState(props.connection?.authUserName ?? "");
  const [credentialSecretName, setCredentialSecretName] = useState(
    props.connection?.credentialKeyVaultSecretName ?? "",
  );
  const [oauthClientIdSecretName, setOauthClientIdSecretName] = useState(
    props.connection?.oAuthClientIdKeyVaultSecretName ?? "",
  );
  const [oauthClientSecretSecretName, setOauthClientSecretSecretName] = useState(
    props.connection?.oAuthClientSecretKeyVaultSecretName ?? "",
  );
  const [oauthRefreshSecretName, setOauthRefreshSecretName] = useState(
    props.connection?.oAuthRefreshTokenKeyVaultSecretName ?? "",
  );
  const [inboundSecretName, setInboundSecretName] = useState(
    props.connection?.inboundWebhookKeyVaultSecretName ?? "",
  );
  const [label, setLabel] = useState(props.connection?.label ?? "");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isOAuthMode = authMode !== "BasicApiToken";
  const supportsAtlassianConsent = props.provider === "jira" && authMode === "OAuth2RefreshToken";

  const saveConnection = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const saved = await upsertTenantItsmConnectorConnection(props.provider, {
        instanceBaseUrl: instanceBaseUrl.trim(),
        authMode,
        authUserName: isOAuthMode ? null : authUserName.trim(),
        credentialKeyVaultSecretName: isOAuthMode ? null : credentialSecretName.trim(),
        oAuthClientIdKeyVaultSecretName: isOAuthMode ? oauthClientIdSecretName.trim() : null,
        oAuthClientSecretKeyVaultSecretName: isOAuthMode ? oauthClientSecretSecretName.trim() : null,
        oAuthRefreshTokenKeyVaultSecretName:
          authMode === "OAuth2RefreshToken" ? oauthRefreshSecretName.trim() : null,
        inboundWebhookKeyVaultSecretName:
          inboundSecretName.trim().length > 0 ? inboundSecretName.trim() : null,
        label: label.trim().length > 0 ? label.trim() : null,
      });
      props.onSaved(saved);
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "Could not save connector reference.");
    } finally {
      setIsSaving(false);
    }
  }, [
    authMode,
    authUserName,
    credentialSecretName,
    inboundSecretName,
    instanceBaseUrl,
    isOAuthMode,
    label,
    oauthClientIdSecretName,
    oauthClientSecretSecretName,
    oauthRefreshSecretName,
    props,
  ]);

  const connectWithAtlassian = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const started = await startItsmAtlassianOAuthConsent({
        instanceBaseUrl: instanceBaseUrl.trim(),
        redirectUri: buildItsmAtlassianOAuthRedirectUri(),
        oAuthClientIdKeyVaultSecretName: oauthClientIdSecretName.trim(),
        oAuthClientSecretKeyVaultSecretName: oauthClientSecretSecretName.trim(),
        oAuthRefreshTokenKeyVaultSecretName: oauthRefreshSecretName.trim(),
        inboundWebhookKeyVaultSecretName:
          inboundSecretName.trim().length > 0 ? inboundSecretName.trim() : null,
        label: label.trim().length > 0 ? label.trim() : null,
      });

      if (!started.authorizeUrl) {
        setSaveError("Atlassian consent could not be started.");

        return;
      }

      window.location.assign(started.authorizeUrl);
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "Could not start Atlassian consent.");
    } finally {
      setIsSaving(false);
    }
  }, [
    inboundSecretName,
    instanceBaseUrl,
    label,
    oauthClientIdSecretName,
    oauthClientSecretSecretName,
    oauthRefreshSecretName,
  ]);

  const removeConnection = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      await deleteTenantItsmConnectorConnection(props.provider);
      setInstanceBaseUrl("");
      setAuthUserName("");
      setCredentialSecretName("");
      setOauthClientIdSecretName("");
      setOauthClientSecretSecretName("");
      setOauthRefreshSecretName("");
      setInboundSecretName("");
      setLabel("");
      setAuthMode("BasicApiToken");
      props.onSaved(null);
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "Could not remove connector reference.");
    } finally {
      setIsSaving(false);
    }
  }, [props]);

  return (
    <Card data-testid={`integrations-itsm-${props.provider}-connection`}>
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{props.title}</CardTitle>
        <CardDescription className={OPERATOR_TYPOGRAPHY.helper}>{props.summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Status:{" "}
          <span className="font-medium text-al-text-primary">
            {props.connection?.isConfigured ? "Configured (Key Vault references)" : "Not configured"}
          </span>
          {props.connection?.authMode ? (
            <>
              {" "}
              · Auth: <span className="font-medium text-al-text-primary">{props.connection.authMode}</span>
            </>
          ) : null}
        </p>

        {saveError ? (
          <p className="m-0 text-red-600 dark:text-red-400" role="alert">
            {saveError}
          </p>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor={`${props.provider}-auth-mode`}>Auth mode</Label>
          <select
            id={`${props.provider}-auth-mode`}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={authMode}
            onChange={(event) => setAuthMode(event.target.value as AuthMode)}
            disabled={!props.canMutate || isSaving}
          >
            <option value="BasicApiToken">Basic API token</option>
            {props.provider === "jira" ? <option value="OAuth2RefreshToken">OAuth 2.0 (Atlassian)</option> : null}
            {props.provider === "servicenow" ? (
              <option value="OAuth2ClientCredentials">OAuth 2.0 client credentials</option>
            ) : null}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${props.provider}-instance-url`}>Instance base URL</Label>
          <Input
            id={`${props.provider}-instance-url`}
            value={instanceBaseUrl}
            onChange={(event) => setInstanceBaseUrl(event.target.value)}
            disabled={!props.canMutate || isSaving}
            placeholder={props.provider === "jira" ? "https://tenant.atlassian.net" : "https://tenant.service-now.com"}
            autoComplete="off"
          />
        </div>

        {!isOAuthMode ? (
          <>
            <div className="space-y-2">
              <Label htmlFor={`${props.provider}-auth-user`}>
                {props.provider === "jira" ? "Service account email" : "Integration username"}
              </Label>
              <Input
                id={`${props.provider}-auth-user`}
                value={authUserName}
                onChange={(event) => setAuthUserName(event.target.value)}
                disabled={!props.canMutate || isSaving}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${props.provider}-credential-kv`}>Credential Key Vault secret name</Label>
              <Input
                id={`${props.provider}-credential-kv`}
                value={credentialSecretName}
                onChange={(event) => setCredentialSecretName(event.target.value)}
                disabled={!props.canMutate || isSaving}
                placeholder="e.g. itsm-tenant-jira-api-token"
                autoComplete="off"
              />
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Must not be a raw URL or token (entries containing :// are rejected).
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor={`${props.provider}-oauth-client-id-kv`}>OAuth client id Key Vault secret name</Label>
              <Input
                id={`${props.provider}-oauth-client-id-kv`}
                value={oauthClientIdSecretName}
                onChange={(event) => setOauthClientIdSecretName(event.target.value)}
                disabled={!props.canMutate || isSaving}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${props.provider}-oauth-client-secret-kv`}>
                OAuth client secret Key Vault secret name
              </Label>
              <Input
                id={`${props.provider}-oauth-client-secret-kv`}
                value={oauthClientSecretSecretName}
                onChange={(event) => setOauthClientSecretSecretName(event.target.value)}
                disabled={!props.canMutate || isSaving}
                autoComplete="off"
              />
            </div>

            {authMode === "OAuth2RefreshToken" ? (
              <div className="space-y-2">
                <Label htmlFor={`${props.provider}-oauth-refresh-kv`}>
                  OAuth refresh token Key Vault secret name
                </Label>
                <Input
                  id={`${props.provider}-oauth-refresh-kv`}
                  value={oauthRefreshSecretName}
                  onChange={(event) => setOauthRefreshSecretName(event.target.value)}
                  disabled={!props.canMutate || isSaving}
                  autoComplete="off"
                />
                {supportsAtlassianConsent ? (
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Use Connect with Atlassian to obtain a refresh token and store it at this secret name.
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor={`${props.provider}-inbound-kv`}>Inbound webhook Key Vault secret name (optional)</Label>
          <Input
            id={`${props.provider}-inbound-kv`}
            value={inboundSecretName}
            onChange={(event) => setInboundSecretName(event.target.value)}
            disabled={!props.canMutate || isSaving}
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${props.provider}-label`}>Label (optional)</Label>
          <Input
            id={`${props.provider}-label`}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            disabled={!props.canMutate || isSaving}
            autoComplete="off"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {supportsAtlassianConsent ? (
            <Button
              type="button"
              onClick={() => void connectWithAtlassian()}
              disabled={!props.canMutate || isSaving}
            >
              {isSaving ? "Starting…" : "Connect with Atlassian"}
            </Button>
          ) : null}
          <Button type="button" onClick={() => void saveConnection()} disabled={!props.canMutate || isSaving}>
            {isSaving ? "Saving…" : "Save connector reference"}
          </Button>
          {props.connection?.isConfigured ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void removeConnection()}
              disabled={!props.canMutate || isSaving}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
