"use client";
import { cn } from "@/lib/utils";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteTenantItsmConnectorConnection,
  type TenantItsmConnectorConnectionResponse,
  upsertTenantItsmConnectorConnection,
} from "@/lib/api/itsm-outbound-api";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type Provider = "jira" | "servicenow";

type Props = {
  readonly provider: Provider;
  readonly title: string;
  readonly summary: string;
  readonly connection: TenantItsmConnectorConnectionResponse | null;
  readonly canMutate: boolean;
  readonly onSaved: (connection: TenantItsmConnectorConnectionResponse | null) => void;
};

export function ItsmConnectorConnectionSection(props: Props): React.ReactElement {
  const [instanceBaseUrl, setInstanceBaseUrl] = useState(props.connection?.instanceBaseUrl ?? "");
  const [authUserName, setAuthUserName] = useState(props.connection?.authUserName ?? "");
  const [credentialSecretName, setCredentialSecretName] = useState(
    props.connection?.credentialKeyVaultSecretName ?? "",
  );
  const [inboundSecretName, setInboundSecretName] = useState(
    props.connection?.inboundWebhookKeyVaultSecretName ?? "",
  );
  const [label, setLabel] = useState(props.connection?.label ?? "");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const saveConnection = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const saved = await upsertTenantItsmConnectorConnection(props.provider, {
        instanceBaseUrl: instanceBaseUrl.trim(),
        authUserName: authUserName.trim(),
        credentialKeyVaultSecretName: credentialSecretName.trim(),
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
  }, [authUserName, credentialSecretName, inboundSecretName, instanceBaseUrl, label, props]);

  const removeConnection = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      await deleteTenantItsmConnectorConnection(props.provider);
      setInstanceBaseUrl("");
      setAuthUserName("");
      setCredentialSecretName("");
      setInboundSecretName("");
      setLabel("");
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
        </p>

        {saveError ? (
          <p className="m-0 text-red-600 dark:text-red-400" role="alert">
            {saveError}
          </p>
        ) : null}

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
