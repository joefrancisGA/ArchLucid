"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { StatusTag } from "@/components/ui/status-tag";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  MODEL_EXECUTION_PROFILES,
  modelExecutionProfileDescriptor,
  modelExecutionProfileLabel,
  type ModelExecutionProfile,
} from "@/lib/model-execution-profile";
import {
  MODEL_GOVERNANCE_ALLOWED_SET_RESET_CONFIRM_DESCRIPTION_COPY,
  MODEL_GOVERNANCE_ALLOWED_SET_RESET_CONFIRM_LABEL_COPY,
  MODEL_GOVERNANCE_ALLOWED_SET_RESET_CONFIRM_TITLE_COPY,
  MODEL_GOVERNANCE_CLEAR_OVERRIDE_FAILED_COPY,
  MODEL_GOVERNANCE_CONNECTION_STATEMENT_COPY,
  MODEL_GOVERNANCE_CONNECTION_TRUST_CENTER_LABEL,
  MODEL_GOVERNANCE_MUTATION_RETRY_LABEL,
  MODEL_GOVERNANCE_PROFILE_AUDIT_DEEP_LINK_EVENT_TYPE,
  MODEL_GOVERNANCE_PROFILE_LAST_CHANGED_UNAVAILABLE_COPY,
  MODEL_GOVERNANCE_PROFILE_MAPPINGS_EMPTY_COPY,
  MODEL_GOVERNANCE_REGISTRY_EMPTY_COPY,
  MODEL_GOVERNANCE_UNEXPECTED_ERROR_COPY,
  MODEL_GOVERNANCE_UPDATE_FAILED_COPY,
  modelGovernanceProfileLastChangedCopy,
  modelGovernanceProfileSourceLabel,
} from "@/lib/model-governance-copy";
import {
  modelGovernanceAgentTypeLabel,
  modelGovernanceCapabilityTagLabel,
} from "@/lib/model-governance-labels";
import type {
  ModelAliasRegistryEntryResponse,
  WorkspaceAllowedEngineSetResponse,
  WorkspaceModelExecutionProfileResponse,
} from "@/lib/model-governance-types";
import { formatRelativeTime } from "@/lib/relative-time";

import { allowedEngineSetEndpoint, useModelGovernanceSettings } from "./use-model-governance-settings";

const trustCenterHref = "/administration/security-trust";
const profileAuditHref = `/governance/audit?eventType=${encodeURIComponent(
  MODEL_GOVERNANCE_PROFILE_AUDIT_DEEP_LINK_EVENT_TYPE,
)}`;

type ProfileControlsProps = {
  profile: WorkspaceModelExecutionProfileResponse;
  saving: boolean;
  successMessage: string | null;
  mutationError: string | null;
  onRequestProfile: (profile: ModelExecutionProfile) => void;
  onRequestClearOverride: () => void;
  onRetryMutation: () => void;
};

function ProfileLastChangedAttribution(props: { profile: WorkspaceModelExecutionProfileResponse }) {
  const { profile } = props;
  const changedAt = profile.lastChangedAtUtc?.trim();
  const changedBy = profile.lastChangedBy?.trim();

  if (changedAt == null || changedAt.length === 0 || changedBy == null || changedBy.length === 0) {
    return (
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="model-execution-profile-last-changed-unavailable"
      >
        {MODEL_GOVERNANCE_PROFILE_LAST_CHANGED_UNAVAILABLE_COPY}
      </p>
    );
  }

  return (
    <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
      <span data-testid="model-execution-profile-last-changed">
        {modelGovernanceProfileLastChangedCopy(changedBy, formatRelativeTime(changedAt))}
      </span>{" "}
      <Link
        className={OPERATOR_LINK.inline}
        href={profileAuditHref}
        data-testid="model-execution-profile-audit-link"
      >
        View in audit trail
      </Link>
    </p>
  );
}

type ProfileSegmentedControlProps = {
  profile: WorkspaceModelExecutionProfileResponse;
  saving: boolean;
  onRequestProfile: (profile: ModelExecutionProfile) => void;
};

function ProfileSegmentedControl(props: ProfileSegmentedControlProps) {
  const { profile, saving, onRequestProfile } = props;

  return (
    <div
      className="grid gap-2 sm:grid-cols-3"
      role="radiogroup"
      aria-label="Workspace execution profile"
      data-testid="model-execution-profile-segmented-control"
    >
      {MODEL_EXECUTION_PROFILES.map((option) => {
        const selected = profile.effectiveProfile === option;
        const descriptor = modelExecutionProfileDescriptor(option);

        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={saving}
            className={cn(
              "rounded-md border p-3 text-left transition-colors",
              selected
                ? "border-teal-600 bg-teal-50/80 ring-1 ring-teal-600 dark:border-teal-500 dark:bg-teal-950/30 dark:ring-teal-500"
                : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700",
              saving && "cursor-not-allowed opacity-60",
            )}
            data-testid={`model-execution-profile-option-${option}`}
            onClick={() => {
              if (!selected) {
                onRequestProfile(option);
              }
            }}
          >
            <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {modelExecutionProfileLabel(option)}
            </p>
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{descriptor.summary}</p>
          </button>
        );
      })}
    </div>
  );
}

function ProfileTradeoffComparison(props: { profile: ModelExecutionProfile; "data-testid"?: string }) {
  const descriptor = modelExecutionProfileDescriptor(props.profile);

  return (
    <div
      className="space-y-1 rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
      data-testid={props["data-testid"] ?? "model-execution-profile-tradeoffs"}
    >
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        {modelExecutionProfileLabel(props.profile)} trade-offs
      </p>
      <ul className={cn("m-0 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {descriptor.tradeoffs.map((tradeoff) => (
          <li key={tradeoff}>{tradeoff}</li>
        ))}
      </ul>
    </div>
  );
}

function ProfileControls(props: ProfileControlsProps) {
  const {
    profile,
    saving,
    successMessage,
    mutationError,
    onRequestProfile,
    onRequestClearOverride,
    onRetryMutation,
  } = props;
  const usingOverride = profile.source === "TenantOverride";

  return (
    <div
      className="space-y-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
      data-testid="model-execution-profile-controls"
    >
      <div className="space-y-1">
        <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          Effective profile:{" "}
          <span data-effective-profile={profile.effectiveProfile}>
            {modelExecutionProfileLabel(profile.effectiveProfile)}
          </span>
        </p>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Source:{" "}
          <span data-profile-source={profile.source}>{modelGovernanceProfileSourceLabel(profile.source)}</span>
          {" · "}
          Workspace default:{" "}
          <span data-workspace-default-profile={profile.workspaceDefaultProfile}>
            {modelExecutionProfileLabel(profile.workspaceDefaultProfile)}
          </span>
        </p>
        <ProfileLastChangedAttribution profile={profile} />
      </div>

      <ProfileSegmentedControl profile={profile} saving={saving} onRequestProfile={onRequestProfile} />
      <ProfileTradeoffComparison profile={profile.effectiveProfile} />

      {usingOverride ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={saving}
          data-testid="model-execution-profile-clear-override"
          onClick={() => void onRequestClearOverride()}
        >
          Use workspace default
        </Button>
      ) : null}

      {successMessage ? (
        <p className={cn("m-0 text-teal-800 dark:text-teal-200", OPERATOR_TYPOGRAPHY.body)} role="status">
          {successMessage}
        </p>
      ) : null}

      {mutationError ? (
        <div
          className="space-y-2 rounded-md border border-rose-200 bg-rose-50/60 p-3 dark:border-rose-900 dark:bg-rose-950/30"
          role="alert"
          data-testid="model-execution-profile-mutation-error"
        >
          <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)}>{mutationError}</p>
          <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => void onRetryMutation()}>
            {MODEL_GOVERNANCE_MUTATION_RETRY_LABEL}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function AllowedEngineSetControls(props: {
  registryEntries: ModelAliasRegistryEntryResponse[];
  allowedEngineSet: WorkspaceAllowedEngineSetResponse | null;
  saving: boolean;
  onSaved: () => void;
}) {
  const { registryEntries, allowedEngineSet, saving, onSaved } = props;
  const [allowedIds, setAllowedIds] = useState<string[]>(allowedEngineSet?.allowedAliasIds ?? []);
  const [defaultAliasId, setDefaultAliasId] = useState(allowedEngineSet?.defaultAliasId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useEffect(() => {
    setAllowedIds(allowedEngineSet?.allowedAliasIds ?? []);
    setDefaultAliasId(allowedEngineSet?.defaultAliasId ?? "");
  }, [allowedEngineSet]);

  const toggleAllowed = (aliasId: string) => {
    setAllowedIds((current) => {
      if (current.includes(aliasId)) {
        const next = current.filter((id) => id !== aliasId);

        if (defaultAliasId === aliasId && next.length > 0) {
          setDefaultAliasId(next[0] ?? "");
        }

        return next;
      }

      return [...current, aliasId];
    });
  };

  const save = async () => {
    setError(null);

    if (allowedIds.length === 0 || defaultAliasId.trim().length === 0) {
      setError("Select at least one allowed engine and a default.");

      return;
    }

    try {
      const res = await fetch(allowedEngineSetEndpoint, {
        ...mergeRegistrationScopeForProxy({
          method: "PUT",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
        }),
        body: JSON.stringify({ allowedAliasIds: allowedIds, defaultAliasId }),
      });

      if (!res.ok) {
        setError(MODEL_GOVERNANCE_UPDATE_FAILED_COPY);

        return;
      }

      onSaved();
    } catch {
      setError(MODEL_GOVERNANCE_UNEXPECTED_ERROR_COPY);
    }
  };

  const clearOverride = async () => {
    setError(null);
    setResetConfirmOpen(false);

    try {
      const res = await fetch(allowedEngineSetEndpoint, {
        ...mergeRegistrationScopeForProxy({
          method: "DELETE",
          headers: { Accept: "application/json" },
        }),
      });

      if (!res.ok) {
        setError(MODEL_GOVERNANCE_CLEAR_OVERRIDE_FAILED_COPY);

        return;
      }

      onSaved();
    } catch {
      setError(MODEL_GOVERNANCE_UNEXPECTED_ERROR_COPY);
    }
  };

  if (registryEntries.length === 0) {
    return null;
  }

  return (
    <div
      className="space-y-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
      data-testid="model-governance-allowed-engine-set"
    >
      <div className="space-y-1">
        <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Allowed engines for review selection
        </h3>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Workspace members can pick among these aliases when starting a review. Source:{" "}
          {allowedEngineSet?.source ?? "CatalogDefault"}.
        </p>
      </div>
      <div className="space-y-2">
        {registryEntries.map((entry) => (
          <label key={entry.aliasId} className="flex items-center gap-2 text-sm text-al-text-primary">
            <input
              type="checkbox"
              checked={allowedIds.includes(entry.aliasId)}
              disabled={saving}
              onChange={() => toggleAllowed(entry.aliasId)}
            />
            <span className="font-mono">{entry.aliasId}</span>
          </label>
        ))}
      </div>
      <div className="space-y-1">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Default engine</p>
        <select
          className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={defaultAliasId}
          disabled={saving || allowedIds.length === 0}
          onChange={(event) => setDefaultAliasId(event.target.value)}
          data-testid="model-governance-default-engine-select"
        >
          {allowedIds.map((aliasId) => (
            <option key={aliasId} value={aliasId}>
              {aliasId}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={saving} onClick={() => void save()}>
          Save allowed set
        </Button>
        {allowedEngineSet?.source === "TenantOverride" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() => setResetConfirmOpen(true)}
            data-testid="model-governance-allowed-set-reset"
          >
            {MODEL_GOVERNANCE_ALLOWED_SET_RESET_CONFIRM_LABEL_COPY}
          </Button>
        ) : null}
      </div>
      {error ? (
        <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {error}
        </p>
      ) : null}
      <ConfirmationDialog
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        title={MODEL_GOVERNANCE_ALLOWED_SET_RESET_CONFIRM_TITLE_COPY}
        description={MODEL_GOVERNANCE_ALLOWED_SET_RESET_CONFIRM_DESCRIPTION_COPY}
        confirmLabel={MODEL_GOVERNANCE_ALLOWED_SET_RESET_CONFIRM_LABEL_COPY}
        busy={saving}
        onConfirm={() => void clearOverride()}
      />
    </div>
  );
}

function GovernedAliasRegistryTable(props: { entries: ModelAliasRegistryEntryResponse[] }) {
  return (
    <Fragment>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {MODEL_GOVERNANCE_CONNECTION_STATEMENT_COPY}{" "}
        <Link className={OPERATOR_LINK.inline} href={trustCenterHref}>
          {MODEL_GOVERNANCE_CONNECTION_TRUST_CENTER_LABEL}
        </Link>
        .
      </p>
      <EnterpriseTable ariaLabel="Governed model aliases" data-testid="model-governance-registry-table">
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>Alias</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Capabilities</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Approved tasks</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {props.entries.map((entry) => (
            <EnterpriseTableRow key={entry.aliasId}>
              <EnterpriseTableCell>
                <span className="font-mono">{entry.aliasId}</span>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                {entry.capabilityTags.length === 0 ? (
                  "—"
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {entry.capabilityTags.map((tag) => (
                      <StatusTag
                        key={`${entry.aliasId}-${tag}`}
                        kind="neutral"
                        label={modelGovernanceCapabilityTagLabel(tag)}
                      />
                    ))}
                  </div>
                )}
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                {entry.approvedTaskTypes.length === 0
                  ? "—"
                  : entry.approvedTaskTypes.map((task) => modelGovernanceAgentTypeLabel(task)).join(", ")}
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </Fragment>
  );
}

export function ModelGovernanceSettingsCard() {
  const {
    state,
    saving,
    successMessage,
    mutationError,
    confirmOpen,
    confirmTitle,
    confirmDescription,
    confirmLabel,
    confirmProfile,
    load,
    requestProfile,
    requestClearOverride,
    confirmMutation,
    retryMutation,
    onConfirmOpenChange,
  } = useModelGovernanceSettings();

  return (
    <Card data-testid="model-governance-settings-card">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Workspace catalog</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.status === "loading" || state.status === "idle" ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading model governance catalog…</p>
        ) : null}

        {state.status === "blocked" ? (
          <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
            {state.note}
          </p>
        ) : null}

        {state.status === "ready" ? (
          <Fragment>
            <ProfileControls
              profile={state.catalog.workspaceProfile}
              saving={saving}
              successMessage={successMessage}
              mutationError={mutationError}
              onRequestProfile={requestProfile}
              onRequestClearOverride={requestClearOverride}
              onRetryMutation={retryMutation}
            />

            <AllowedEngineSetControls
              registryEntries={state.catalog.registryEntries}
              allowedEngineSet={state.allowedEngineSet ?? null}
              saving={saving}
              onSaved={() => void load()}
            />

            {state.catalogUnavailableNote ? (
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
                data-testid="model-governance-catalog-unavailable"
              >
                {state.catalogUnavailableNote}
              </p>
            ) : null}

            <div className="space-y-2" data-testid="model-governance-registry">
              <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                Governed model aliases
              </h3>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Read-only registry entries. Deployment names are never shown here.
              </p>
              {state.catalog.registryEntries.length === 0 ? (
                <p
                  className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
                  data-testid="model-governance-registry-empty"
                >
                  {MODEL_GOVERNANCE_REGISTRY_EMPTY_COPY}
                </p>
              ) : (
                <GovernedAliasRegistryTable entries={state.catalog.registryEntries} />
              )}
            </div>

            <div className="space-y-2" data-testid="model-governance-profile-mappings">
              <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                Profile → alias mappings
              </h3>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Resolved alias per agent role for each execution profile tier.
              </p>
              {state.catalog.profileMappings.length === 0 ? (
                <p
                  className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
                  data-testid="model-governance-profile-mappings-empty"
                >
                  {MODEL_GOVERNANCE_PROFILE_MAPPINGS_EMPTY_COPY}
                </p>
              ) : (
                state.catalog.profileMappings.map((mapping) => (
                  <details
                    key={mapping.profile}
                    className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
                  >
                    <summary className="cursor-pointer font-medium text-al-text-primary">
                      {modelExecutionProfileLabel(mapping.profile)}
                    </summary>
                    <ul className={cn("m-0 mt-2 list-inside list-disc", OPERATOR_TYPOGRAPHY.body)}>
                      {mapping.agentAliasMappings.map((row) => (
                        <li key={`${mapping.profile}-${row.agentType}`} data-agent-type={row.agentType}>
                          {modelGovernanceAgentTypeLabel(row.agentType)}:{" "}
                          <span className="font-mono">{row.aliasId}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))
              )}
            </div>
          </Fragment>
        ) : null}
      </CardContent>

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={onConfirmOpenChange}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={confirmLabel}
        variant="default"
        busy={saving}
        onConfirm={confirmMutation}
        extraContent={
          confirmProfile != null ? (
            <ProfileTradeoffComparison profile={confirmProfile} data-testid="model-execution-profile-confirm-tradeoffs" />
          ) : undefined
        }
      />
    </Card>
  );
}
