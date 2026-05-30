"use client";

import Link from "next/link";

import { LayerHeader } from "@/components/LayerHeader";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { describeTeamsNotificationTrigger } from "./teams-integration-trigger-descriptions";
import type { TeamsNotificationsIntegrationPageViewModel } from "./teams-notifications-integration-view-model";

type Props = {
  readonly model: TeamsNotificationsIntegrationPageViewModel;
};

export function TeamsNotificationsIntegrationPageView(props: Props) {
  const m = props.model;

  if (m.isDemo) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">Teams integration not available in demo mode.</p>
        <p className="m-0 mt-1">Microsoft Teams notifications can be configured with a live API connection.</p>
      </div>
    );
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
            href="/help/troubleshooting"
          >
            Teams notifications help
          </Link>
          .
        </p>
      </div>

      {m.failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={m.failure.problem}
            fallbackMessage={m.failure.message}
            correlationId={m.failure.correlationId}
          />
        </div>
      ) : null}

      {m.loading && m.conn === null ? (
        <OperatorLoadingNotice>Loading Teams configuration…</OperatorLoadingNotice>
      ) : m.conn !== null ? (
        <div className="space-y-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            Status:{" "}
            <span className="font-medium">{m.conn.isConfigured ? "Configured (Key Vault reference)" : "Not configured"}</span>
            {m.conn.isConfigured ? (
              <span className="text-neutral-500 dark:text-neutral-400">
                {" "}
                — updated {new Date(m.conn.updatedUtc).toLocaleString()}
              </span>
            ) : null}
          </p>

          <div className="space-y-2">
            <Label htmlFor="kv-secret">Key Vault secret name</Label>
            <Input
              id="kv-secret"
              name="keyVaultSecretName"
              value={m.secretName}
              onChange={(e) => m.setSecretName(e.target.value)}
              disabled={!m.canMutate || m.saving}
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
              value={m.label}
              onChange={(e) => m.setLabel(e.target.value)}
              disabled={!m.canMutate || m.saving}
              autoComplete="off"
              placeholder="Channel or team name"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Notification triggers
            </legend>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Select which integration events fan out to this Teams channel. The Logic Apps workflow filters server-side
              before delivery, so disabled triggers cannot reach the channel even if upstream routing misbehaves.
            </p>

            <ul className="space-y-2">
              {m.catalog.map((eventType) => {
                const description = describeTeamsNotificationTrigger(eventType);
                const checkboxId = `trigger-${eventType.replace(/\./g, "-")}`;
                const checked = m.enabledTriggers.has(eventType);

                return (
                  <li key={eventType} className="flex items-start gap-2">
                    <input
                      id={checkboxId}
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => m.toggleTrigger(eventType, e.target.checked)}
                      disabled={!m.canMutate || m.saving}
                      className="mt-1 h-4 w-4 rounded border-neutral-300 text-blue-700 focus:ring-blue-500 dark:border-neutral-700"
                      aria-describedby={`${checkboxId}-help`}
                    />
                    <div className="flex-1">
                      <Label htmlFor={checkboxId} className="font-medium">
                        {description.label}
                      </Label>
                      <p id={`${checkboxId}-help`} className="text-xs text-neutral-500 dark:text-neutral-400">
                        {description.helpText}
                      </p>
                      <p className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500">{eventType}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void m.onSave()}
              disabled={!m.canMutate || m.saving || m.secretName.trim() === ""}
            >
              Save reference
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void m.onRemove()}
              disabled={!m.canMutate || m.saving || !m.conn.isConfigured}
            >
              Remove reference
            </Button>
          </div>

          {!m.canMutate ? (
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Your role can view this page; saving requires elevated permissions (same as other Enterprise configuration
              surfaces).
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
