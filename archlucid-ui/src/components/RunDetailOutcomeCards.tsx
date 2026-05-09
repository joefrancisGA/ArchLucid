import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import { cn } from "@/lib/utils";

type RunDetailOutcomeCardsProps = {
  readonly runId: string;
  /** When finalized, links the manifest outcome card to manifest detail. */
  readonly manifestId?: string | null;
  readonly hasGoldenManifest: boolean;
  readonly findingCountDisplay: number | null;
  readonly warningCountDisplay: number | null;
  readonly artifactCount: number;
  readonly unresolvedIssueCountDisplay: number | null;
  /** From manifest status when summary is loaded; omit to hide the governance line on the manifest card. */
  readonly governanceGateLabel?: string | null;
  /** Aggregate posture from explanation summary (buyer strip severity signal). */
  readonly aggregateRiskPosture?: string | null;
};

/**
 * Top-of-run proof summary: reviewers see outcomes before scrolling to timeline and agent diagnostics.
 */
const samePageJumpClass =
  "block rounded-lg no-underline outline-none ring-offset-2 transition hover:ring-2 hover:ring-teal-500/40 focus-visible:ring-2 focus-visible:ring-teal-600 dark:ring-offset-neutral-950";

const stripShell =
  "rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950/30";

function manifestWarningsSecondaryCopy(warningCountDisplay: number | null): string | null {
  if (typeof warningCountDisplay !== "number" || !Number.isFinite(warningCountDisplay)) {
    return null;
  }

  const n = Math.trunc(warningCountDisplay);

  if (n <= 0) {
    return null;
  }

  return `${n} manifest warning${n === 1 ? "" : "s"}`;
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

  return `${raw} risk`;
}

function stripSegmentLabelClass(): string {
  return "m-0 text-[0.65rem] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400";
}

type PackageStatusStripProps = {
  manifestId: string | null | undefined;
  hasGoldenManifest: boolean;
  warningCountDisplay: number | null;
  findingCountDisplay: number | null;
  aggregateRiskPosture: string | null | undefined;
  artifactCount: number;
  governanceGateLabel: string | null | undefined;
};

function PackageStatusStrip(props: PackageStatusStripProps) {
  const trimmedManifestId = props.manifestId?.trim() ?? "";
  const hasManifest = trimmedManifestId.length > 0;
  const warningsLine = manifestWarningsSecondaryCopy(props.warningCountDisplay);
  const findingN =
    typeof props.findingCountDisplay === "number" && Number.isFinite(props.findingCountDisplay)
      ? Math.trunc(props.findingCountDisplay)
      : null;
  const findingsWord = findingN === 1 ? "finding" : "findings";
  const findingsPrimary =
    findingN !== null && findingN >= 0
      ? `${findingN} ${findingsWord}`
      : finiteIntegerCountDisplay(props.findingCountDisplay);
  const severitySignal = buyerFindingSeveritySignal(props.findingCountDisplay, props.aggregateRiskPosture);
  const gate =
    props.governanceGateLabel !== null &&
    props.governanceGateLabel !== undefined &&
    props.governanceGateLabel.trim().length > 0
      ? props.governanceGateLabel.trim()
      : "—";

  const segmentInner = "min-w-0 flex-1 px-3 py-3 sm:px-4";
  const valueClass = "m-0 text-base font-semibold tabular-nums text-neutral-900 dark:text-neutral-100";
  const detailClass = "m-0 mt-0.5 text-xs text-neutral-600 dark:text-neutral-400";

  const packageBody = (
    <>
      <p
        className={cn(
          valueClass,
          props.hasGoldenManifest ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-200",
        )}
      >
        {props.hasGoldenManifest ? "Finalized" : "In progress"}
      </p>
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
      aria-label="Package status"
      className={cn(stripShell, "flex flex-col divide-y divide-neutral-200 sm:flex-row sm:divide-x sm:divide-y-0 dark:divide-neutral-700")}
    >
      <div className={segmentInner}>
        <p className={stripSegmentLabelClass()}>Package</p>
        <div className="mt-1">
          {props.hasGoldenManifest && hasManifest ? (
            <Link
              href={`/manifests/${encodeURIComponent(trimmedManifestId)}`}
              className="block rounded outline-none ring-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-teal-600 dark:ring-offset-neutral-950"
            >
              {packageBody}
            </Link>
          ) : (
            packageBody
          )}
        </div>
      </div>

      <div className={segmentInner}>
        <p className={stripSegmentLabelClass()}>Findings</p>
        <div className="mt-1">
          {hasManifest ? (
            <Link
              href="#run-explanation"
              className="block rounded outline-none ring-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-teal-600 dark:ring-offset-neutral-950"
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
              className="block rounded outline-none ring-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-teal-600 dark:ring-offset-neutral-950"
            >
              <p className={valueClass}>{finiteIntegerCountDisplay(props.artifactCount)}</p>
              <p className={detailClass}>Artifact files</p>
            </Link>
          ) : (
            <>
              <p className={valueClass}>{finiteIntegerCountDisplay(props.artifactCount)}</p>
              <p className={detailClass}>Artifact files</p>
            </>
          )}
        </div>
      </div>

      <div className={segmentInner}>
        <p className={stripSegmentLabelClass()}>Governance</p>
        <p className={cn(valueClass, "mt-1")}>{gate}</p>
      </div>
    </section>
  );
}

export function RunDetailOutcomeCards({
  runId,
  manifestId,
  hasGoldenManifest,
  findingCountDisplay,
  warningCountDisplay,
  artifactCount,
  unresolvedIssueCountDisplay,
  governanceGateLabel,
  aggregateRiskPosture,
}: RunDetailOutcomeCardsProps) {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (buyerPolishedShell) {
    return (
      <PackageStatusStrip
        manifestId={manifestId}
        hasGoldenManifest={hasGoldenManifest}
        warningCountDisplay={warningCountDisplay}
        findingCountDisplay={findingCountDisplay}
        aggregateRiskPosture={aggregateRiskPosture}
        artifactCount={artifactCount}
        governanceGateLabel={governanceGateLabel}
      />
    );
  }

  const unresolvedTrunc =
    typeof unresolvedIssueCountDisplay === "number" && Number.isFinite(unresolvedIssueCountDisplay)
      ? Math.trunc(unresolvedIssueCountDisplay)
      : null;

  const warningsLine = manifestWarningsSecondaryCopy(warningCountDisplay);

  const findingsCardEl = (
    <Card className="h-full border-neutral-200 dark:border-neutral-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Findings</CardTitle>
        <CardDescription>
          {manifestId ? "From architecture review — click to jump" : "From architecture review"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        <p className="m-0 text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
          {finiteIntegerCountDisplay(findingCountDisplay)}
        </p>
        {unresolvedTrunc !== null && unresolvedTrunc > 0 ? (
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
            {unresolvedTrunc} unresolved on manifest
          </p>
        ) : null}
      </CardContent>
    </Card>
  );

  const artifactsCardEl = (
    <Card className="h-full border-neutral-200 dark:border-neutral-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Artifacts</CardTitle>
        <CardDescription>{manifestId ? "Generated outputs — click to jump" : "Generated outputs"}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="m-0 text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
          {finiteIntegerCountDisplay(artifactCount)}
        </p>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">Attached to manifest when finalized</p>
      </CardContent>
    </Card>
  );

  return (
    <section aria-label="Review outcomes" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Manifest</CardTitle>
          <CardDescription>Reviewed architecture record</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <p
            className={`m-0 text-base font-semibold ${
              hasGoldenManifest ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-200"
            }`}
          >
            {hasGoldenManifest ? "Finalized" : "Awaiting finalize"}
          </p>
          {warningsLine !== null ? (
            <p className="m-0 mt-1 text-sm tabular-nums text-neutral-800 dark:text-neutral-200">{warningsLine}</p>
          ) : null}
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
            {hasGoldenManifest
              ? "Architecture manifest is pinned to this review."
              : "Finalize from the finalize control when ready."}
          </p>
          {governanceGateLabel !== null && governanceGateLabel !== undefined && governanceGateLabel.length > 0 ? (
            <p className="m-0 mt-2 text-xs text-neutral-700 dark:text-neutral-300">
              <span className="font-medium text-neutral-800 dark:text-neutral-200">Governance gate:</span>{" "}
              {governanceGateLabel}
            </p>
          ) : null}
          {hasGoldenManifest && manifestId !== null && manifestId !== undefined && manifestId.trim().length > 0 ? (
            <Link
              className="mt-2 inline-block text-sm font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-200 dark:hover:text-teal-100"
              href={`/manifests/${encodeURIComponent(manifestId.trim())}`}
            >
              Open manifest detail
            </Link>
          ) : null}
        </CardContent>
      </Card>

      {manifestId ? (
        <Link href="#run-explanation" className={samePageJumpClass}>
          {findingsCardEl}
        </Link>
      ) : (
        findingsCardEl
      )}

      {manifestId ? (
        <Link href="#artifacts-exports" className={samePageJumpClass}>
          {artifactsCardEl}
        </Link>
      ) : (
        artifactsCardEl
      )}

      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Review trail</CardTitle>
          <CardDescription>Pipeline + traceability</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Link
            className="text-sm font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-200 dark:hover:text-teal-100"
            href="#authority-chain"
          >
            Jump to review trail on this page
          </Link>
          <Link
            className="mt-2 block text-sm font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-200 dark:hover:text-teal-100"
            href={`/reviews/${encodeURIComponent(runId)}/provenance`}
          >
            Full provenance view
          </Link>
          <Link
            className="mt-2 block text-sm font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-200 dark:hover:text-teal-100"
            href={`/showcase/${encodeURIComponent(runId)}`}
          >
            Completed output (public showcase)
          </Link>
          <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
            Timeline and audit identifiers stay below — start here for the proof path.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
