"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { Textarea } from "@/components/ui/textarea";
import {
  AZURE_OPENAI_CONNECTION_ENDPOINT,
  AZURE_OPENAI_CONNECTION_PROBE_ENDPOINT,
  type TenantAzureOpenAiConnectionProbeResponse,
  type TenantAzureOpenAiConnectionResponse,
  type TenantAzureOpenAiConnectionUpsertRequest,
} from "@/lib/api/azure-openai-connection-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { MODEL_GOVERNANCE_CONNECTION_STATEMENT_COPY } from "@/lib/model-governance-copy";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { cn } from "@/lib/utils";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; connection: TenantAzureOpenAiConnectionResponse }
  | { status: "blocked"; note: string };

const defaultDeploymentsJson = '{\n  "default": "gpt-4o"\n}';

export function ModelGovernanceAzureOpenAiConnectionCard() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [endpoint, setEndpoint] = useState("");
  const [secretName, setSecretName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [deploymentsJson, setDeploymentsJson] = useState(defaultDeploymentsJson);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [probing, setProbing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [probeMessage, setProbeMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadState({ status: "loading" });
    setError(null);

    try {
      const response = await fetch(
        AZURE_OPENAI_CONNECTION_ENDPOINT,
        mergeRegistrationScopeForProxy({ method: "GET" }),
      );

      if (!response.ok) {
        setLoadState({ status: "blocked", note: "Azure OpenAI connection settings are unavailable." });

        return;
      }

      const body = (await response.json()) as TenantAzureOpenAiConnectionResponse;
      setEndpoint(body.endpoint ?? "");
      setSecretName(body.apiKeyKeyVaultSecretName ?? "");
      setDeploymentsJson(body.deploymentsJson ?? defaultDeploymentsJson);
      setLabel(body.label ?? "");
      setLoadState({ status: "ready", connection: body });
    } catch {
      setLoadState({ status: "blocked", note: "Azure OpenAI connection settings are unavailable." });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveConnection() {
    setSaving(true);
    setError(null);
    setProbeMessage(null);

    const payload: TenantAzureOpenAiConnectionUpsertRequest = {
      endpoint,
      authMode: "ApiKey",
      apiKeyKeyVaultSecretName: secretName,
      deploymentsJson,
      isEnabled: true,
      label: label.trim().length > 0 ? label.trim() : undefined,
      apiKey: apiKey.trim().length > 0 ? apiKey.trim() : undefined,
    };

    try {
      const response = await fetch(
        AZURE_OPENAI_CONNECTION_ENDPOINT,
        mergeRegistrationScopeForProxy({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      );

      if (!response.ok) {
        setError("Could not save the Azure OpenAI connection.");

        return;
      }

      const body = (await response.json()) as TenantAzureOpenAiConnectionResponse;
      setApiKey("");
      setLoadState({ status: "ready", connection: body });
    } catch {
      setError("Could not save the Azure OpenAI connection.");
    } finally {
      setSaving(false);
    }
  }

  async function probeConnection() {
    setProbing(true);
    setProbeMessage(null);
    setError(null);

    try {
      const response = await fetch(
        AZURE_OPENAI_CONNECTION_PROBE_ENDPOINT,
        mergeRegistrationScopeForProxy({ method: "POST" }),
      );

      const body = (await response.json()) as TenantAzureOpenAiConnectionProbeResponse;
      setProbeMessage(body.message);
      await load();
    } catch {
      setError("Connection probe failed.");
    } finally {
      setProbing(false);
    }
  }

  if (loadState.status === "loading") {
    return (
      <Card data-testid="model-governance-azure-openai-connection-card">
        <CardHeader>
          <CardTitle>Azure OpenAI connection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Loading…</p>
        </CardContent>
      </Card>
    );
  }

  if (loadState.status === "blocked") {
    return (
      <Card data-testid="model-governance-azure-openai-connection-card">
        <CardHeader>
          <CardTitle>Azure OpenAI connection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{loadState.note}</p>
        </CardContent>
      </Card>
    );
  }

  const connection = loadState.connection;

  return (
    <Card data-testid="model-governance-azure-openai-connection-card">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle>Azure OpenAI connection</CardTitle>
        {connection.isConfigured ? (
          <StatusTag
            kind={connection.isEnabled ? "success" : "neutral"}
            label={connection.isEnabled ? "Enabled" : "Disabled"}
          />
        ) : (
          <StatusTag kind="neutral" label="Not configured" />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {MODEL_GOVERNANCE_CONNECTION_STATEMENT_COPY} Embeddings remain ArchLucid-managed.
        </p>
        <div className="space-y-2">
          <Label htmlFor="azure-openai-endpoint">Endpoint</Label>
          <Input
            id="azure-openai-endpoint"
            value={endpoint}
            onChange={(event) => setEndpoint(event.target.value)}
            placeholder="https://your-resource.openai.azure.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="azure-openai-secret-name">API key Key Vault secret name</Label>
          <Input
            id="azure-openai-secret-name"
            value={secretName}
            onChange={(event) => setSecretName(event.target.value)}
            placeholder="tenant-azure-openai-api-key"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="azure-openai-api-key">API key (write-once to Key Vault)</Label>
          <Input
            id="azure-openai-api-key"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="azure-openai-deployments">Deployments JSON</Label>
          <Textarea
            id="azure-openai-deployments"
            value={deploymentsJson}
            onChange={(event) => setDeploymentsJson(event.target.value)}
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="azure-openai-label">Label (optional)</Label>
          <Input id="azure-openai-label" value={label} onChange={(event) => setLabel(event.target.value)} />
        </div>
        {connection.lastProbeMessage ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Last probe: {connection.lastProbeMessage}
          </p>
        ) : null}
        {probeMessage ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{probeMessage}</p>
        ) : null}
        {error ? (
          <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={saving} onClick={() => void saveConnection()}>
            Save connection
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={probing || !connection.isConfigured} onClick={() => void probeConnection()}>
            Probe connection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
