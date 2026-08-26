"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  MODEL_EXECUTION_PROFILES,
  modelExecutionProfileDescriptor,
  modelExecutionProfileLabel,
  type ModelExecutionProfile,
} from "@/lib/model-execution-profile";
import {
  MODEL_GOVERNANCE_MUTATION_RETRY_LABEL,
  MODEL_GOVERNANCE_PROFILE_AUDIT_DEEP_LINK_EVENT_TYPE,
  MODEL_GOVERNANCE_PROFILE_LAST_CHANGED_UNAVAILABLE_COPY,
  modelGovernanceProfileLastChangedCopy,
  modelGovernanceProfileSourceLabel,
} from "@/lib/model-governance-copy";
import type { WorkspaceModelExecutionProfileResponse } from "@/lib/model-governance-types";
import { formatRelativeTime } from "@/lib/relative-time";

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

export function ProfileTradeoffComparison(props: { profile: ModelExecutionProfile; "data-testid"?: string }) {
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

export function ProfileControls(props: ProfileControlsProps) {
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
