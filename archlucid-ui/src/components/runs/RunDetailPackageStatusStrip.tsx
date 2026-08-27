"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { GovernanceStatusTag } from "@/components/governance/GovernanceStatusTag";
import { StatusTag } from "@/components/ui/status-tag";
import { useNavCommittedArchitectureReview } from "@/components/operator/OperatorNavAuthorityProvider";
import { BUYER_FINDINGS_COUNT_WITH_MONITORED_RISK } from "@/lib/buyer/buyer-polish-copy";
import { CORE_PILOT_PATH_STREAMLINED_LABELS, isStreamlinedCorePilotPath } from "@/lib/vocabulary/core-pilot-path-vocabulary";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { ShowcasePolicyPackStripLink } from "./RunDetailOutcomeCards";

const stripShell =
  "rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950/30";

function stripSegmentLabelClass(): string {
  return cn("m-0", OPERATOR_NAV_GROUP_LABEL);
}

export function manifestWarningsSecondaryCopy(warningCountDisplay: number | null): string | null {
  if (typeof warningCountDisplay !== "number" || !Number.isFinite(warningCountDisplay)) {
    return null;
  }

  const n = Math.trunc(warningCountDisplay);

  if (n <= 0) {
    return null;
  }

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (buyerPolishedShell) {
    return `${n} monitored risk${n === 1 ? "" : "s"} (PHI minimization)`;
  }

  return `${n} review warning${n === 1 ? "" : "s"} (PHI minimization)`;
}

function buyerFindingSeveritySignal(
  findingCountDisplay: number | null,
  aggregateRiskPosture: string | null | undefined,
): string | null {
  const n =
    typeof findingCountDisplay === "number" && Number.isFinite(findingCountDisplay)
      ? Math.trunc(findingCountDisplay)
      : null;

  if (n === null || n <= 0) {
    return null;
  }

  const raw = aggregateRiskPosture?.trim() ?? "";

  if (raw.length === 0) {
    return null;
  }

  const key = raw.toLowerCase();

  if (key === "not rated" || key === "low") {
    return null;
  }

  if (n === 1 && (key === "high" || key === "critical")) {
    return `${raw.charAt(0).toUpperCase()}${raw.slice(1).toLowerCase()} severity`;
  }

  if (key === "high" || key === "critical") {
    return `Includes ${key}-severity items`;
  }

  if (key === "medium") {
    return "Medium risk posture";
  }

  if (key === "approved with monitoring") {
    return "Approved with monitoring";
  }

  if (key === "controlled") {
    return "Mitigated and monitored";
  }

  if (key === "acceptable" || key === "accepted") {
    return "Residual risk accepted with documented controls";
  }

  if (key === "elevated") {
    return "Elevated — prioritize sponsor review";
  }

  if (key === "monitored") {
    return "Monitored pending validation";
  }

  const capitalized = `${raw.charAt(0).toUpperCase()}${raw.slice(1).toLowerCase()}`;

  return `${capitalized} posture — confirm meaning with approvals`;
}

export function useStreamlinedPilotOutcomeLabels(): {
  readonly evaluationStandardsLabel: string;
  readonly approvalStatusLabel: string;
} {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const streamlinedPilotPath = isStreamlinedCorePilotPath(hasCommittedArchitectureReview);

  return {
    evaluationStandardsLabel: streamlinedPilotPath
      ? CORE_PILOT_PATH_STREAMLINED_LABELS.evaluationStandards
      : "Policy pack",
    approvalStatusLabel: streamlinedPilotPath
      ? CORE_PILOT_PATH_STREAMLINED_LABELS.reviewApproval
      : "Resolve outcomes",
  };
}

export type RunDetailPackageStatusStripProps = {
  manifestId: string | null | undefined;
  hasGoldenManifest: boolean;
  warningCountDisplay: number | null;
  findingCountDisplay: number | null;
  aggregateRiskPosture: string | null | undefined;
  artifactCount: number;
  governanceGateLabel: string | null | undefined;
  showcasePolicyPackStrip: ShowcasePolicyPackStripLink | null | undefined;
  readonly pagePrimaryOwnedElsewhere?: boolean;
};

export function RunDetailPackageStatusStrip(props: RunDetailPackageStatusStripProps) {
  const { evaluationStandardsLabel, approvalStatusLabel } = useStreamlinedPilotOutcomeLabels();
  const inlineLinkClass =
    props.pagePrimaryOwnedElsewhere === true ? OPERATOR_LINK.optional : OPERATOR_LINK.inline;
  const trimmedManifestId = props.manifestId?.trim() ?? "";
  const hasManifest = trimmedManifestId.length > 0;
  const warningsLine = manifestWarningsSecondaryCopy(props.warningCountDisplay);
  const findingN =
    typeof props.findingCountDisplay === "number" && Number.isFinite(props.findingCountDisplay)
      ? Math.trunc(props.findingCountDisplay)
      : null;
  const warningN =
    typeof props.warningCountDisplay === "number" && Number.isFinite(props.warningCountDisplay)
      ? Math.trunc(props.warningCountDisplay)
      : null;
  const findingsWord = findingN === 1 ? "finding" : "findings";
  const findingsPrimary =
    findingN !== null && findingN >= 0
      ? isBuyerPolishedOperatorShellEnv() && warningN !== null && warningN > 0
        ? BUYER_FINDINGS_COUNT_WITH_MONITORED_RISK(findingN, warningN)
        : `${findingN} ${findingsWord}`
      : finiteIntegerCountDisplay(props.findingCountDisplay);
  const severitySignal = buyerFindingSeveritySignal(props.findingCountDisplay, props.aggregateRiskPosture);
  const gate =
    props.governanceGateLabel !== null &&
    props.governanceGateLabel !== undefined &&
    props.governanceGateLabel.trim().length > 0
      ? props.governanceGateLabel.trim()
      : " — ";

  const segmentInner = "min-w-0 flex-1 px-3 py-3 sm:px-4";
  const valueClass = cn("m-0 font-semibold tabular-nums text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body);
  const detailClass = cn("m-0 mt-0.5 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper);

  const packageBody = (
    <>
      {props.hasGoldenManifest ? (
        <StatusTag kind="ready" label="Finalized" aria-label="Package state: finalized" />
      ) : (
        <StatusTag kind="in-progress" label="In progress" aria-label="Package state: in progress" />
      )}
      {warningsLine !== null ? <p className={detailClass}>{warningsLine}</p> : null}
    </>
  );

  const findingsBody = (
    <>
      <p className={valueClass}>{findingsPrimary}</p>
      {severitySignal !== null ? <p className={detailClass}>{severitySignal}</p> : null}
    </>
  );

  return (
    <section
      role="status"
      aria-label="Review status summary"
      className={cn(stripShell, "flex flex-col divide-y divide-neutral-200 sm:flex-row sm:divide-x sm:divide-y-0 dark:divide-neutral-700")}
    >
      <div className={segmentInner}>
        <p className={stripSegmentLabelClass()}>Package state</p>
        <div className="mt-1">
          {props.hasGoldenManifest && hasManifest ? (
            <Link
              href={signedRecordDetailPath(trimmedManifestId)}
              className={cn("block rounded outline-none ring-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:outline-offset-neutral-950", inlineLinkClass)}
              data-testid="run-detail-finalized-package-link"
            >
              {packageBody}
            </Link>
          ) : (
            packageBody
          )}
        </div>
      </div>

      {props.showcasePolicyPackStrip !== null &&
      props.showcasePolicyPackStrip !== undefined &&
      props.showcasePolicyPackStrip.href.trim().length > 0 &&
      props.showcasePolicyPackStrip.label.trim().length > 0 ? (
        <div className={segmentInner}>
          <p className={stripSegmentLabelClass()}>{evaluationStandardsLabel}</p>
          <div className="mt-1">
            <Link
              href={props.showcasePolicyPackStrip.href.trim()}
              className={cn("block rounded outline-none ring-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:outline-offset-neutral-950", inlineLinkClass)}
            >
              <p className={valueClass}>{props.showcasePolicyPackStrip.label.trim()}</p>
              <p className={detailClass}>Read-only pack rules and version</p>
            </Link>
          </div>
        </div>
      ) : null}

      <div className={segmentInner}>
        <p className={stripSegmentLabelClass()}>Findings</p>
        <div className="mt-1">
          {hasManifest ? (
            <Link
              href="#run-explanation"
              className={cn("block rounded outline-none ring-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:outline-offset-neutral-950", inlineLinkClass)}
            >
              {findingsBody}
            </Link>
          ) : (
            findingsBody
          )}
        </div>
      </div>

      <div className={segmentInner}>
        <p className={stripSegmentLabelClass()}>Deliverables</p>
        <div className="mt-1">
          {hasManifest ? (
            <Link
              href="#artifacts-exports"
              className={cn("block rounded outline-none ring-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:outline-offset-neutral-950", inlineLinkClass)}
            >
              <p className={valueClass}>{finiteIntegerCountDisplay(props.artifactCount)}</p>
              <p className={detailClass}>Export-ready deliverables</p>
            </Link>
          ) : (
            <>
              <p className={valueClass}>{finiteIntegerCountDisplay(props.artifactCount)}</p>
              <p className={detailClass}>Export-ready deliverables</p>
            </>
          )}
        </div>
      </div>

      <div className={segmentInner}>
        <p className={stripSegmentLabelClass()}>Approval status</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {gate !== " — " ? (
            <GovernanceStatusTag status={gate} aria-label={`${approvalStatusLabel}: ${gate}`} />
          ) : (
            <p className={cn(valueClass, "mt-0")}>{gate}</p>
          )}
        </div>
      </div>
    </section>
  );
}
