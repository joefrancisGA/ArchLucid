"use client";

import Link from "next/link";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { describeTeamsNotificationTrigger } from "./teams-integration-trigger-descriptions";
import type { TeamsNotificationsIntegrationPageViewModel } from "./teams-notifications-integration-view-model";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type Props = {
  readonly model: TeamsNotificationsIntegrationPageViewModel;
};

export function TeamsNotificationsIntegrationPageView(props: Props) {
  const m = props.model;

  if (m.isDemo) {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="Microsoft Teams integration"
        description="In a connected tenant, administrators configure Microsoft Teams notification routing for governance events."
      />
    );
  }

  return (
    <div className="w-full max-w-3xl space-y-6">
      <LayerHeader pageKey="teams-notifications" />

      <div>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Microsoft Teams</h1>
        <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Register the{" "}
          <strong>Key Vault secret name</strong> that holds your Teams incoming webhook URL. ArchLucid never stores the
          webhook URL in SQL — Logic Apps or workers resolve the secret at delivery time. For custom HTTPS webhook routes,
          use{" "}
          <Link className={OPERATOR_LINK.nav} href="/integrations/webhooks">
            Webhooks
          </Link>
          . See{" "}
          <Link className={OPERATOR_LINK.nav} href="/help/troubleshooting">
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
          <p className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            Status:{" "}
            <span className="font-medium">{m.conn.isConfigured ? "Configured (Key Vault reference)" : "Not configured"}</span>
            {m.conn.isConfigured ? (
              <span className="text-al-text-secondary">
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
            <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
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
            <legend className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              Notification triggers
            </legend>
            <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
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
                      <p id={`${checkboxId}-help`} className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                        {description.helpText}
                      </p>
                      <p className={cn("font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>{eventType}</p>
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
            <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Your role can view this page; saving requires elevated permissions (same as other Enterprise configuration
              surfaces).
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
