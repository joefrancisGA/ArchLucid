"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { LayerHeader } from "@/components/LayerHeader";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEnterpriseMutationCapability } from "@/hooks/use-enterprise-mutation-capability";
import {
  deleteTeamsIncomingWebhookConnection,
  getTeamsIncomingWebhookConnection,
  upsertTeamsIncomingWebhookConnection,
} from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type {
  TeamsIncomingWebhookConnectionResponse,
  TeamsIncomingWebhookConnectionUpsertRequest,
} from "@/types/teams-incoming-webhook-connection";

export default function TeamsNotificationsIntegrationPage() {
  const canMutate = useEnterpriseMutationCapability();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [conn, setConn] = useState<TeamsIncomingWebhookConnectionResponse | null>(null);
  const [secretName, setSecretName] = useState("");
  const [label, setLabel] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);
    try {
      const data = await getTeamsIncomingWebhookConnection();
      setConn(data);
      setSecretName(data.keyVaultSecretName ?? "");
      setLabel(data.label ?? "");
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave() {
    if (!canMutate) {
      return;
    }

    setSaving(true);
    setFailure(null);
    try {
      const body: TeamsIncomingWebhookConnectionUpsertRequest = {
        keyVaultSecretName: secretName.trim(),
        label: label.trim().length > 0 ? label.trim() : null,
      };
      const saved = await upsertTeamsIncomingWebhookConnection(body);
      setConn(saved);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setSaving(false);
    }
  }

  async function onRemove() {
    if (!canMutate) {
      return;
    }

    setSaving(true);
    setFailure(null);
    try {
      await deleteTeamsIncomingWebhookConnection();
      await load();
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <LayerHeader pageKey="teams-notifications" />

      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Microsoft Teams</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Register the{" "}
          <strong>Key Vault secret name</strong> that holds your Teams incoming webhook URL. ArchLucid never stores the
          webhook URL in SQL — Logic Apps or workers resolve the secret at delivery time. See{" "}
          <Link
            className="text-blue-700 underline dark:text-blue-300"
            href="https://github.com/joefrancisGA/ArchLucid/blob/main/docs/integrations/MICROSOFT_TEAMS_NOTIFICATIONS.md"
          >
            MICROSOFT_TEAMS_NOTIFICATIONS.md
          </Link>
          .
        </p>
      </div>

      {failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      {loading || !conn ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading…</p>
      ) : (
        <div className="space-y-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            Status:{" "}
            <span className="font-medium">{conn.isConfigured ? "Configured (Key Vault reference)" : "Not configured"}</span>
            {conn.isConfigured ? (
              <span className="text-neutral-500 dark:text-neutral-400">
                {" "}
                — updated {new Date(conn.updatedUtc).toLocaleString()}
              </span>
            ) : null}
          </p>

          <div className="space-y-2">
            <Label htmlFor="kv-secret">Key Vault secret name</Label>
            <Input
              id="kv-secret"
              name="keyVaultSecretName"
              value={secretName}
              onChange={(e) => setSecretName(e.target.value)}
              disabled={!canMutate || saving}
              autoComplete="off"
              placeholder="e.g. teams-incoming-webhook-prod"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Must not be a raw URL (entries containing :// are rejected by the API).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="teams-label">Label (optional)</Label>
            <Input
              id="teams-label"
              name="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={!canMutate || saving}
              autoComplete="off"
              placeholder="Channel or team name"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void onSave()} disabled={!canMutate || saving || secretName.trim() === ""}>
              Save reference
            </Button>
            <Button type="button" variant="outline" onClick={() => void onRemove()} disabled={!canMutate || saving || !conn.isConfigured}>
              Remove reference
            </Button>
          </div>

          {!canMutate ? (
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Your role can view this page; saving requires Execute authority (same floor as other Enterprise mutation
              surfaces).
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
