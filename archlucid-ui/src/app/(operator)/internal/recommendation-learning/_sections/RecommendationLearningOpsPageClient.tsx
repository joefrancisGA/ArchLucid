"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { PilotFeedbackRecommendationLearningVocabularyRail } from "@/components/PilotFeedbackRecommendationLearningVocabularyRail";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { LearningProfile } from "@/types/recommendation-learning";
import type {
  RecommendationLearningOperationalStatus,
  RecommendationLearningPreview,
  RecommendationLearningProfileHistoryItem,
  RecommendationLearningWeightDelta,
} from "@/types/recommendation-learning-operational";

import {
  executeRecommendationLearningPreview,
  executeRecommendationLearningRebuild,
  executeRecommendationLearningRollback,
  reloadRecommendationLearningOpsBundle,
} from "./load-recommendation-learning-ops-page-data";
import {
  copyOperationalIdentifier,
  formatOperationalTimestamp,
  isProductionDeployEnvironment,
  profileStateLabel,
  resolveDeployEnvironmentLabel,
} from "./recommendation-learning-ops-display";

type Props = {
  readonly initialStatus: RecommendationLearningOperationalStatus | null;
  readonly initialProfile: LearningProfile | null;
  readonly initialHistory: RecommendationLearningProfileHistoryItem[];
  readonly initialFailure: ApiLoadFailureState | null;
};

type SortKey = keyof Pick<
  RecommendationLearningWeightDelta,
  "featureGroup" | "feature" | "currentWeight" | "proposedWeight" | "absoluteDelta" | "observationCount"
>;

function FieldRow(props: { readonly label: string; readonly value: string; readonly testId?: string; readonly copyable?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-al-border/60 py-2 sm:grid-cols-[12rem_1fr] sm:gap-4">
      <dt className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{props.label}</dt>
      <dd className={cn("m-0 break-all font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} data-testid={props.testId}>
        <span>{props.value}</span>
        {props.copyable ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-2 h-7 px-2"
            onClick={() => void copyOperationalIdentifier(props.value)}
          >
            Copy
          </Button>
        ) : null}
      </dd>
    </div>
  );
}

function WeightTable(props: { readonly deltas: RecommendationLearningWeightDelta[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("absoluteDelta");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...props.deltas];

    copy.sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];

      if (typeof left === "number" && typeof right === "number") {
        return sortAsc ? left - right : right - left;
      }

      return sortAsc
        ? String(left).localeCompare(String(right))
        : String(right).localeCompare(String(left));
    });

    return copy;
  }, [props.deltas, sortAsc, sortKey]);

  function onSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((value) => !value);
      return;
    }

    setSortKey(key);
    setSortAsc(false);
  }

  return (
    <div className="overflow-x-auto rounded-md border border-al-border/70">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-al-surface-muted/60">
          <tr>
            {[
              ["featureGroup", "Group"],
              ["feature", "Feature"],
              ["currentWeight", "Current"],
              ["proposedWeight", "Proposed"],
              ["absoluteDelta", "Δ"],
              ["observationCount", "Obs."],
            ].map(([key, label]) => (
              <th key={key} className="px-3 py-2 font-medium">
                <button type="button" className="hover:underline" onClick={() => onSort(key as SortKey)}>
                  {label}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={`${row.featureGroup}:${row.feature}`} className="border-t border-al-border/50">
              <td className="px-3 py-2">{row.featureGroup}</td>
              <td className="px-3 py-2 font-mono">{row.feature}</td>
              <td className="px-3 py-2 font-mono">{row.currentWeight.toFixed(3)}</td>
              <td className="px-3 py-2 font-mono">{row.proposedWeight.toFixed(3)}</td>
              <td className="px-3 py-2 font-mono">{row.absoluteDelta.toFixed(3)}</td>
              <td className="px-3 py-2">{row.observationCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RecommendationLearningOpsPageClient(props: Props) {
  const router = useRouter();
  const canMutate = useOperateCapability();
  const [isRefreshing, startRefreshing] = useTransition();
  const [status, setStatus] = useState(props.initialStatus);
  const [profile, setProfile] = useState(props.initialProfile);
  const [history, setHistory] = useState(props.initialHistory);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(props.initialFailure);
  const [preview, setPreview] = useState<RecommendationLearningPreview | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollbackProfileId, setRollbackProfileId] = useState<string | null>(null);
  const [activateReason, setActivateReason] = useState("");

  const environmentLabel = resolveDeployEnvironmentLabel();
  const production = isProductionDeployEnvironment();

  useEffect(() => {
    setStatus(props.initialStatus);
    setProfile(props.initialProfile);
    setHistory(props.initialHistory);
    setFailure(props.initialFailure);
  }, [props.initialFailure, props.initialHistory, props.initialProfile, props.initialStatus]);

  const refresh = useCallback(async () => {
    startRefreshing(() => {
      router.refresh();
    });

    try {
      const bundle = await reloadRecommendationLearningOpsBundle();
      setStatus(bundle.status);
      setProfile(bundle.profile);
      setHistory(bundle.history);
      setFailure(null);
    } catch (e: unknown) {
      setFailure(toApiLoadFailure(e));
    }
  }, [router]);

  const runPreview = useCallback(async () => {
    if (!canMutate) {
      return null;
    }

    setBusyAction("preview");
    setFailure(null);

    try {
      const result = await executeRecommendationLearningPreview();
      setPreview(result);
      return result;
    } catch (e: unknown) {
      setFailure(toApiLoadFailure(e));
      return null;
    } finally {
      setBusyAction(null);
    }
  }, [canMutate]);

  const runRebuild = useCallback(async () => {
    if (!canMutate) {
      return;
    }

    if (production && activateReason.trim().length < 8) {
      setFailure({
        message: "Enter an operational reason (minimum 8 characters) before rebuilding in production.",
        problem: null,
        correlationId: null,
        httpStatus: 409,
        retryAfterSeconds: null,
      });
      return;
    }

    setBusyAction("rebuild");
    setFailure(null);

    try {
      await executeRecommendationLearningRebuild();
      await refresh();
      setPreview(null);
    } catch (e: unknown) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setBusyAction(null);
    }
  }, [activateReason, canMutate, production, refresh]);

  const runRollback = useCallback(async () => {
    if (!canMutate || rollbackProfileId === null) {
      return;
    }

    if (rollbackReason.trim().length < 8) {
      setFailure({
        message: "Enter an operational reason (minimum 8 characters) before rollback.",
        problem: null,
        correlationId: null,
        httpStatus: 409,
        retryAfterSeconds: null,
      });
      return;
    }

    setBusyAction("rollback");
    setFailure(null);

    try {
      await executeRecommendationLearningRollback(rollbackProfileId, rollbackReason.trim());
      setRollbackProfileId(null);
      setRollbackReason("");
      await refresh();
    } catch (e: unknown) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setBusyAction(null);
    }
  }, [canMutate, refresh, rollbackProfileId, rollbackReason]);

  const canBuild = (status?.eligibleOutcomeCount ?? 0) >= (status?.minimumRequiredOutcomes ?? 1);
  const insufficient = status?.profileState === "InsufficientData";

  if (status === null && failure !== null) {
    return (
      <div className="px-4 py-6">
        <p className="text-rose-800 dark:text-rose-200" role="alert">
          {failure.message}
        </p>
        <Button type="button" className="mt-4" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>
    );
  }

  if (status === null) {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="Recommendation learning"
        description="Connect a tenant scope to inspect recommendation-ranking profiles and rebuild history."
      />
    );
  }

  const validationChecks = preview?.validationChecks ?? [];
  const weightDeltas = preview?.weightDeltas ?? [];

  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-6 px-4 py-6" data-testid="recommendation-learning-ops-page">
      <header className="space-y-3 border-b border-al-border/70 pb-4">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Internal Operations / Recommendation Learning</p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Recommendation learning</h1>
            <p className={cn("m-0 max-w-4xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Inspect and rebuild the recommendation-ranking profile derived from historical accepted, deferred,
              rejected, and implemented outcomes.
            </p>
            <PilotFeedbackRecommendationLearningVocabularyRail currentSurfaceId="recommendation-learning" />
            <p className={cn("m-0 font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Scope: Tenant / Workspace / Project · Model: {status.activeProfile?.algorithmVersion ?? "recommendation-ranking-v1"} ·
              Feature schema: {status.activeProfile?.featureSchemaVersion ?? "outcome-stats-v1"}
            </p>
          </div>
          <div className="space-y-2 text-right">
            <PageContextualHelpButton />
            <StatusPill
              status={production ? "critical" : "neutral"}
              domain="health"
              ariaLabel={`Environment ${environmentLabel}`}
            />
            <p className={cn("m-0 font-mono", OPERATOR_TYPOGRAPHY.body)}>{environmentLabel}</p>
            <p className={cn("m-0 font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{status.scopeLabel}</p>
          </div>
        </div>
<div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" disabled={isRefreshing} onClick={() => void refresh()}>
            {isRefreshing ? "Refreshing…" : "Refresh counts"}
          </Button>
          <Button type="button" variant="outline" disabled={busyAction !== null} onClick={() => void refresh()}>
            Load persisted profile
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!canMutate || !canBuild || busyAction !== null}
            onClick={() => void runPreview()}
          >
            {busyAction === "preview" ? "Previewing…" : "Preview rebuild"}
          </Button>
          <Button
            type="button"
            disabled={!canMutate || !canBuild || busyAction !== null}
            onClick={() => void runRebuild()}
          >
            {busyAction === "rebuild" ? "Rebuilding…" : "Rebuild from historical outcomes"}
          </Button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Load persisted profile — load the latest successfully persisted profile without recomputing weights.
          </p>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Rebuild from historical outcomes — recompute all recommendation-ranking weights from the eligible historical
            outcome set and persist a new profile version (immediately active).
          </p>
        </div>
        {!canMutate ? (
          <p className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>
            Preview and rebuild require ExecuteAuthority. You can still inspect status and eligibility.
          </p>
        ) : null}
      </header>

      {failure ? (
        <div className="rounded-md border border-rose-300 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/40" role="alert">
          <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>Operation failed</p>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{failure.message}</p>
          {failure.correlationId ? <p className="m-0 font-mono text-sm">Correlation ID: {failure.correlationId}</p> : null}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <article className="rounded-lg border border-al-border/70 p-4">
            <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Profile state</h2>
            <dl className="m-0">
              <FieldRow label="Profile state" value={profileStateLabel(status.profileState)} testId="rl-profile-state" />
              <FieldRow label="Scope" value={status.scopeLabel} />
              <FieldRow label="Eligible outcomes" value={String(status.eligibleOutcomeCount)} />
              <FieldRow label="Minimum required outcomes" value={String(status.minimumRequiredOutcomes)} />
              <FieldRow label="Oldest eligible outcome" value={formatOperationalTimestamp(status.oldestEligibleOutcomeUtc)} />
              <FieldRow label="Newest eligible outcome" value={formatOperationalTimestamp(status.newestEligibleOutcomeUtc)} />
              <FieldRow label="Last attempted build" value={formatOperationalTimestamp(status.lastAttemptedBuildUtc)} />
              <FieldRow label="Last build result" value={status.lastBuildResult ?? "Never"} />
              <FieldRow label="Blocking reason" value={status.blockingReason ?? "—"} />
            </dl>
            {insufficient ? (
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/architecture/reviews" className="text-al-accent underline-offset-2 hover:underline">
                  Open completed reviews
                </Link>
                <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
                  Refresh counts
                </Button>
              </div>
            ) : null}
            {!insufficient && status.profileState === "NotBuilt" ? (
              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="button" variant="outline" size="sm" disabled={!canMutate} onClick={() => void runPreview()}>
                  Preview first build
                </Button>
                <Button type="button" size="sm" disabled={!canMutate} onClick={() => void runRebuild()}>
                  Build first candidate profile
                </Button>
              </div>
            ) : null}
          </article>

          {status.activeProfile ? (
            <article className="rounded-lg border border-al-border/70 p-4">
              <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Current profile metadata</h2>
              <dl className="m-0">
                <FieldRow label="Profile ID" value={status.activeProfile.profileId} copyable />
                <FieldRow label="Generated at" value={formatOperationalTimestamp(status.activeProfile.generatedUtc)} />
                <FieldRow label="Status" value={status.activeProfile.status} />
                <FieldRow label="Algorithm version" value={status.activeProfile.algorithmVersion} />
                <FieldRow label="Feature-schema version" value={status.activeProfile.featureSchemaVersion} />
                <FieldRow label="Outcome count" value={String(status.activeProfile.outcomeCount)} />
                <FieldRow label="Eligible outcome count" value={String(status.activeProfile.eligibleOutcomeCount)} />
                <FieldRow label="Excluded outcome count" value={String(status.activeProfile.excludedOutcomeCount)} />
                <FieldRow label="Build source" value={status.activeProfile.buildSource} />
                <FieldRow label="Last activated at" value={formatOperationalTimestamp(status.activeProfile.lastActivatedUtc)} />
                <FieldRow label="Profile checksum" value={status.activeProfile.profileChecksum} copyable />
                <FieldRow label="Storage location" value={status.activeProfile.storageLocation} />
                <FieldRow label="Last validation result" value={status.activeProfile.lastValidationResult ?? "—"} />
              </dl>
            </article>
          ) : null}

          {profile ? (
            <article className="rounded-lg border border-al-border/70 p-4">
              <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Weighting details</h2>
              <details open>
                <summary className="cursor-pointer">Active profile weights</summary>
                <WeightTable
                  deltas={Object.entries(profile.categoryWeights).map(([feature, proposedWeight]) => ({
                    featureGroup: "Category",
                    feature,
                    currentWeight: proposedWeight,
                    proposedWeight,
                    absoluteDelta: 0,
                    percentageDelta: 0,
                    observationCount: 0,
                    confidence: 1,
                    fallbackUsed: false,
                  }))}
                />
              </details>
              <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Normalization: per-feature clamp [0.5, 2.0]. Deferred outcomes reduce weight; implemented outcomes increase
                weight. Missing categories use implicit fallback weight 1.0 until observed.
              </p>
            </article>
          ) : null}
        </div>

        <div className="space-y-6">
          <article className="rounded-lg border border-al-border/70 p-4">
            <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Outcome eligibility</h2>
            <dl className="m-0">
              <FieldRow label="Accepted" value={String(status.eligibility.accepted)} />
              <FieldRow label="Rejected" value={String(status.eligibility.rejected)} />
              <FieldRow label="Deferred" value={String(status.eligibility.deferred)} />
              <FieldRow label="Implemented" value={String(status.eligibility.implemented)} />
              <FieldRow label="Proposed (excluded)" value={String(status.eligibility.proposedExcluded)} />
              <FieldRow label="Truncated by batch cap" value={String(status.eligibility.truncatedByBatchCap)} />
            </dl>
            <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Rebuild scans up to {status.rebuildBatchCap} most recently updated non-proposed outcomes for the current
              tenant/workspace/project scope. Proposed-only rows are excluded. Demo/test exclusions follow repository filters.
            </p>
          </article>

          {preview ? (
            <article className="rounded-lg border border-al-border/70 p-4">
              <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Preview validation</h2>
              <ul className="m-0 space-y-2 p-0">
                {validationChecks.map((check) => (
                  <li key={check.name} className="list-none rounded border border-al-border/50 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{check.name}</span>
                      <span>{check.result}</span>
                    </div>
                    <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{check.detail}</p>
                  </li>
                ))}
              </ul>
              <p className="m-0 mt-3 font-mono text-sm">Correlation ID: {preview.correlationId}</p>
              <p className="m-0 font-mono text-sm">Build duration: {preview.buildDurationMs} ms</p>
            </article>
          ) : null}
        </div>
      </section>

      {preview && weightDeltas.length > 0 ? (
        <section className="rounded-lg border border-al-border/70 p-4">
          <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Before-and-after impact analysis</h2>
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {weightDeltas.filter((row) => Math.abs(row.absoluteDelta) > 0.001).length} weighted features change in the
            preview. Largest upward movement:{" "}
            {weightDeltas.reduce((best, row) => (row.absoluteDelta > best.absoluteDelta ? row : best), weightDeltas[0]).feature}.
          </p>
          <WeightTable deltas={weightDeltas} />
        </section>
      ) : null}

      {production ? (
        <section className="rounded-lg border border-amber-400 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
          <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Production activation</h2>
          <label className="block space-y-1">
            <span className={OPERATOR_TYPOGRAPHY.body}>Operational reason (required for rebuild in production)</span>
            <Textarea
              className="min-h-20 bg-al-surface-raised font-mono text-al-text-primary placeholder:text-al-text-placeholder"
              value={activateReason}
              onChange={(event) => setActivateReason(event.target.value)}
            />
          </label>
        </section>
      ) : null}

      <section className="rounded-lg border border-al-border/70 p-4">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Version history</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-al-border/60">
                <th className="px-2 py-2">Version</th>
                <th className="px-2 py-2">Built</th>
                <th className="px-2 py-2">Outcomes</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.profileId} className="border-b border-al-border/40">
                  <td className="px-2 py-2 font-mono text-xs">{item.profileId}</td>
                  <td className="px-2 py-2">{formatOperationalTimestamp(item.generatedUtc)}</td>
                  <td className="px-2 py-2">{item.outcomeCount}</td>
                  <td className="px-2 py-2">{item.isActive ? "Active" : "Historical"}</td>
                  <td className="px-2 py-2">
                    {!item.isActive ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!canMutate || busyAction !== null}
                        onClick={() => setRollbackProfileId(item.profileId)}
                      >
                        Roll back to this version
                      </Button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rollbackProfileId ? (
          <div className="mt-4 space-y-2 rounded border border-al-border/60 p-3">
            <p className="m-0 font-mono text-sm">Rollback target: {rollbackProfileId}</p>
            <Textarea
              className="min-h-20 bg-al-surface-raised font-mono text-al-text-primary placeholder:text-al-text-placeholder"
              placeholder="Operational reason (required)"
              value={rollbackReason}
              onChange={(event) => setRollbackReason(event.target.value)}
            />
            <div className="flex gap-2">
              <Button type="button" disabled={busyAction !== null} onClick={() => void runRollback()}>
                Confirm rollback
              </Button>
              <Button type="button" variant="outline" onClick={() => setRollbackProfileId(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
