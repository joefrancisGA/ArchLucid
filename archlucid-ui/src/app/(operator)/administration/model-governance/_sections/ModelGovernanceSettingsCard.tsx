"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useState } from "react";

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
  isModelExecutionProfile,
  modelExecutionProfileDescriptor,
  modelExecutionProfileLabel,
  type ModelExecutionProfile,
} from "@/lib/model-execution-profile";
import {
  MODEL_GOVERNANCE_CLEAR_OVERRIDE_FAILED_COPY,
  MODEL_GOVERNANCE_CATALOG_UNAVAILABLE_COPY,
  MODEL_GOVERNANCE_CONNECTION_STATEMENT_COPY,
  MODEL_GOVERNANCE_CONNECTION_TRUST_CENTER_LABEL,
  MODEL_GOVERNANCE_MUTATION_RETRY_LABEL,
  MODEL_GOVERNANCE_PROFILE_AUDIT_DEEP_LINK_EVENT_TYPE,
  MODEL_GOVERNANCE_PROFILE_CONFIRM_CLEAR_DESCRIPTION_COPY,
  MODEL_GOVERNANCE_PROFILE_CONFIRM_CLEAR_LABEL_COPY,
  MODEL_GOVERNANCE_PROFILE_CONFIRM_CLEAR_TITLE_COPY,
  MODEL_GOVERNANCE_PROFILE_CONFIRM_DESCRIPTION_COPY,
  MODEL_GOVERNANCE_PROFILE_CONFIRM_LABEL_COPY,
  MODEL_GOVERNANCE_PROFILE_CONFIRM_TITLE_COPY,
  MODEL_GOVERNANCE_PROFILE_LAST_CHANGED_UNAVAILABLE_COPY,
  MODEL_GOVERNANCE_PROFILE_MAPPINGS_EMPTY_COPY,
  MODEL_GOVERNANCE_REGISTRY_EMPTY_COPY,
  MODEL_GOVERNANCE_UNEXPECTED_ERROR_COPY,
  MODEL_GOVERNANCE_UNEXPECTED_RESPONSE_COPY,
  MODEL_GOVERNANCE_UPDATE_FAILED_COPY,
  modelGovernanceLoadBlockedMessage,
  modelGovernanceProfileLastChangedCopy,
  modelGovernanceProfileSourceLabel,
  modelGovernanceProfileSuccessMessage,
} from "@/lib/model-governance-copy";
import {
  modelGovernanceAgentTypeLabel,
  modelGovernanceCapabilityTagLabel,
} from "@/lib/model-governance-labels";
import type {
  ModelAliasRegistryEntryResponse,
  ModelGovernanceCatalogResponse,
  WorkspaceModelExecutionProfileResponse,
} from "@/lib/model-governance-types";
import { formatRelativeTime } from "@/lib/relative-time";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; catalog: ModelGovernanceCatalogResponse; catalogUnavailableNote?: string }
  | { status: "blocked"; note: string };

type PendingProfileMutation =
  | { kind: "select"; profile: ModelExecutionProfile }
  | { kind: "clear" };

const profileEndpoint = "/api/proxy/v1/admin/settings/model-execution-profile";
const catalogEndpoint = "/api/proxy/v1/admin/settings/model-governance-catalog";
const trustCenterHref = "/administration/security-trust";
const profileAuditHref = `/governance/audit?eventType=${encodeURIComponent(
  MODEL_GOVERNANCE_PROFILE_AUDIT_DEEP_LINK_EVENT_TYPE,
)}`;

function emptyModelGovernanceCatalog(
  profile: WorkspaceModelExecutionProfileResponse,
): ModelGovernanceCatalogResponse {
  return {
    workspaceProfile: profile,
    registryEntries: [],
    profileMappings: [],
  };
}

function parseProfileResponse(body: unknown): WorkspaceModelExecutionProfileResponse | null {
  if (body == null || typeof body !== "object") {
    return null;
  }

  const record = body as WorkspaceModelExecutionProfileResponse;
  const effectiveProfile = record.effectiveProfile;
  const source = record.source;
  const workspaceDefaultProfile = record.workspaceDefaultProfile;

  if (!isModelExecutionProfile(effectiveProfile) || !isModelExecutionProfile(workspaceDefaultProfile)) {
    return null;
  }

  if (typeof source !== "string" || source.trim().length === 0) {
    return null;
  }

  return record;
}

function parseCatalogResponse(body: unknown): ModelGovernanceCatalogResponse | null {
  if (body == null || typeof body !== "object") {
    return null;
  }

  const record = body as ModelGovernanceCatalogResponse;

  if (!Array.isArray(record.registryEntries) || !Array.isArray(record.profileMappings)) {
    return null;
  }

  if (parseProfileResponse(record.workspaceProfile) == null) {
    return null;
  }

  return record;
}

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
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [pendingMutation, setPendingMutation] = useState<PendingProfileMutation | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lastFailedMutation, setLastFailedMutation] = useState<PendingProfileMutation | null>(null);

  const load = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const fetchOpts = mergeRegistrationScopeForProxy({
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      const [profileRes, catalogRes] = await Promise.all([
        fetch(profileEndpoint, fetchOpts),
        fetch(catalogEndpoint, fetchOpts),
      ]);

      if (!profileRes.ok) {
        setState({
          status: "blocked",
          note: modelGovernanceLoadBlockedMessage(profileRes.status),
        });

        return;
      }

      const profileBody = parseProfileResponse(await profileRes.json());

      if (profileBody == null) {
        setState({ status: "blocked", note: MODEL_GOVERNANCE_UNEXPECTED_RESPONSE_COPY });

        return;
      }

      let catalogBody: ModelGovernanceCatalogResponse | null = null;
      let catalogUnavailableNote: string | undefined;

      if (!catalogRes.ok) {
        catalogUnavailableNote = MODEL_GOVERNANCE_CATALOG_UNAVAILABLE_COPY;
      } else {
        catalogBody = parseCatalogResponse(await catalogRes.json());

        if (catalogBody == null) {
          catalogUnavailableNote = MODEL_GOVERNANCE_CATALOG_UNAVAILABLE_COPY;
        }
      }

      setState({
        status: "ready",
        catalog: catalogBody
          ? {
              ...catalogBody,
              workspaceProfile: profileBody,
            }
          : emptyModelGovernanceCatalog(profileBody),
        catalogUnavailableNote,
      });
    } catch {
      setState({ status: "blocked", note: MODEL_GOVERNANCE_UNEXPECTED_ERROR_COPY });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const executeMutation = useCallback(
    async (mutation: PendingProfileMutation) => {
      setSaving(true);
      setMutationError(null);
      setSuccessMessage(null);

      try {
        const isClear = mutation.kind === "clear";
        const res = await fetch(profileEndpoint, {
          ...mergeRegistrationScopeForProxy({
            method: isClear ? "DELETE" : "PUT",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
          }),
          ...(isClear
            ? {}
            : {
                body: JSON.stringify({ profile: mutation.profile }),
              }),
        });

        if (!res.ok) {
          setMutationError(
            isClear ? MODEL_GOVERNANCE_CLEAR_OVERRIDE_FAILED_COPY : MODEL_GOVERNANCE_UPDATE_FAILED_COPY,
          );
          setLastFailedMutation(mutation);

          return;
        }

        const parsed = parseProfileResponse(await res.json());

        if (parsed == null) {
          setMutationError(MODEL_GOVERNANCE_UNEXPECTED_RESPONSE_COPY);
          setLastFailedMutation(mutation);

          return;
        }

        setLastFailedMutation(null);
        setSuccessMessage(
          isClear
            ? modelGovernanceProfileSuccessMessage(
                modelExecutionProfileLabel(parsed.workspaceDefaultProfile),
              )
            : modelGovernanceProfileSuccessMessage(modelExecutionProfileLabel(parsed.effectiveProfile)),
        );
        await load();
      } finally {
        setSaving(false);
        setConfirmOpen(false);
        setPendingMutation(null);
      }
    },
    [load],
  );

  const requestProfile = useCallback((profile: ModelExecutionProfile) => {
    setPendingMutation({ kind: "select", profile });
    setConfirmOpen(true);
  }, []);

  const requestClearOverride = useCallback(() => {
    setPendingMutation({ kind: "clear" });
    setConfirmOpen(true);
  }, []);

  const confirmMutation = useCallback(() => {
    if (pendingMutation == null) {
      return;
    }

    void executeMutation(pendingMutation);
  }, [executeMutation, pendingMutation]);

  const retryMutation = useCallback(() => {
    if (lastFailedMutation == null) {
      return;
    }

    void executeMutation(lastFailedMutation);
  }, [executeMutation, lastFailedMutation]);

  const confirmTitle =
    pendingMutation?.kind === "clear"
      ? MODEL_GOVERNANCE_PROFILE_CONFIRM_CLEAR_TITLE_COPY
      : MODEL_GOVERNANCE_PROFILE_CONFIRM_TITLE_COPY;

  const confirmDescription =
    pendingMutation?.kind === "clear"
      ? MODEL_GOVERNANCE_PROFILE_CONFIRM_CLEAR_DESCRIPTION_COPY
      : MODEL_GOVERNANCE_PROFILE_CONFIRM_DESCRIPTION_COPY;

  const confirmLabel =
    pendingMutation?.kind === "clear"
      ? MODEL_GOVERNANCE_PROFILE_CONFIRM_CLEAR_LABEL_COPY
      : MODEL_GOVERNANCE_PROFILE_CONFIRM_LABEL_COPY;

  const confirmProfile =
    pendingMutation?.kind === "select" ? pendingMutation.profile : null;

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
        onOpenChange={(open) => {
          setConfirmOpen(open);

          if (!open) {
            setPendingMutation(null);
          }
        }}
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
