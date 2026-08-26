"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { usePilotRunDeltasQuery } from "@/hooks/use-pilot-run-deltas-query";
import { useTenantBaselineRoiQuery } from "@/hooks/use-tenant-baseline-roi-query";
import { useTenantTrialStatusQuery } from "@/hooks/use-tenant-trial-status-query";
import { downloadFirstValueReportPdf, markSponsorPackSent } from "@/lib/api";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { isApiRequestError } from "@/lib/api-request-error";
import { AUTH_MODE } from "@/lib/auth-config";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";
import {
  describeSponsorProofReadiness,
  formatStructuralExecutionModeLabel,
  isAgentOutputPilotStrictSponsorSafe,
  isExternalSponsorPdfBlockedForExecutionMode,
  isProjectedDollarClaimsSponsorSafe,
  isProjectedUsdSponsorBadgeVisible,
  type PilotRunDeltasProofSummaryJson,
} from "@/lib/pilot-proof-readiness";
import { recordSponsorBannerFirstCommitBadge } from "@/lib/sponsor-banner-telemetry";

import type { EmailRunToSponsorBannerProps } from "./EmailRunToSponsorBanner";

type ProofGateState =
  | { status: "skipped" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ok"; payload: PilotRunDeltasProofSummaryJson };

function computeUtcDayN(firstCommitIso: string, nowMs: number): number | null {
  const commitMs = new Date(firstCommitIso).getTime();

  if (Number.isNaN(commitMs)) {
    return null;
  }

  const msPerDay = 24 * 60 * 60 * 1000;

  return Math.max(0, Math.floor((nowMs - commitMs) / msPerDay));
}

export function useEmailRunToSponsorBanner(props: EmailRunToSponsorBannerProps) {
  const {
    runId,
    manifestId,
    sponsorDocxAvailable = false,
    curatedSampleRun = false,
  } = props;

  const [busy, setBusy] = useState(false);
  const [markSentBusy, setMarkSentBusy] = useState(false);
  const [sentToSponsorUtc, setSentToSponsorUtc] = useState<string | null>(null);
  const [markSentError, setMarkSentError] = useState<string | null>(null);
  const [error, setError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);
  const [badgeDayN, setBadgeDayN] = useState<number | null>(null);
  const [timeToFirstCommitHours, setTimeToFirstCommitHours] = useState<number | null>(null);

  const skipSidecarFetches =
    AUTH_MODE !== "development-bypass" && isJwtAuthMode() && !isLikelySignedIn();
  const sidecarFetchesEnabled = !skipSidecarFetches;

  const { data: roiBaselineGate } = useTenantBaselineRoiQuery({ enabled: sidecarFetchesEnabled });
  const telemetrySentRef = useRef(false);
  const [readinessLoadingPhase, setReadinessLoadingPhase] = useState<"quick" | "slow">("quick");

  const { data: trialPayload } = useTenantTrialStatusQuery({ enabled: sidecarFetchesEnabled });
  const { data: deltasPayload, isPending: deltasPending, isError: deltasError } = usePilotRunDeltasQuery(runId, {
    enabled: sidecarFetchesEnabled,
  });

  const proofGate: ProofGateState = useMemo(() => {
    if (skipSidecarFetches) {
      return { status: "skipped" };
    }

    if (deltasPending) {
      return { status: "loading" };
    }

    if (deltasError || deltasPayload === undefined) {
      return { status: "error" };
    }

    return { status: "ok", payload: deltasPayload };
  }, [skipSidecarFetches, deltasPending, deltasError, deltasPayload]);

  const estimatedUsdSavings = useMemo((): number | null => {
    if (proofGate.status !== "ok") {
      return null;
    }

    if (
      isProjectedUsdSponsorBadgeVisible(proofGate.payload)
      && typeof proofGate.payload.estimatedUsdSavings === "number"
      && Number.isFinite(proofGate.payload.estimatedUsdSavings)
    ) {
      return proofGate.payload.estimatedUsdSavings;
    }

    return null;
  }, [proofGate]);

  useEffect(() => {
    if (trialPayload === undefined) {
      return;
    }

    if (trialPayload === null) {
      setBadgeDayN(null);
      setTimeToFirstCommitHours(null);

      return;
    }

    try {
      const iso = trialPayload.firstCommitUtc;

      if (
        typeof trialPayload.timeToFirstCommittedManifestTotalSeconds === "number"
        && Number.isFinite(trialPayload.timeToFirstCommittedManifestTotalSeconds)
        && trialPayload.timeToFirstCommittedManifestTotalSeconds > 0
      ) {
        setTimeToFirstCommitHours(trialPayload.timeToFirstCommittedManifestTotalSeconds / 3600);
      } else {
        setTimeToFirstCommitHours(null);
      }

      if (typeof iso !== "string" || iso.length === 0) {
        setBadgeDayN(null);
      } else {
        const n = computeUtcDayN(iso, Date.now());

        setBadgeDayN(n);
      }
    } catch {
      setBadgeDayN(null);
      setTimeToFirstCommitHours(null);
    }
  }, [trialPayload]);

  useEffect(() => {
    if (badgeDayN === null || telemetrySentRef.current) {
      return;
    }

    telemetrySentRef.current = true;
    recordSponsorBannerFirstCommitBadge(badgeDayN);
  }, [badgeDayN]);

  const markdownHref = `/api/proxy/v1/pilots/runs/${encodeURIComponent(runId)}/first-value-report`;
  const SponsorReviewPacketHref = `/api/proxy/v1/pilots/runs/${encodeURIComponent(runId)}/sponsor-review-packet`;
  const sponsorProofPackHref = `/api/proxy/v1/pilots/runs/${encodeURIComponent(runId)}/sponsor-proof-pack.zip`;
  const executiveBriefHref = resolveInAppDocHref("docs/go-to-market/SPONSOR_SPONSOR_BRIEF.md");
  const pilotRoiModelHref = resolveInAppDocHref("docs/library/PILOT_ROI_MODEL.md");

  useEffect(() => {
    if (proofGate.status !== "loading") {
      setReadinessLoadingPhase("quick");

      return;
    }

    setReadinessLoadingPhase("quick");
    const timer = window.setTimeout(() => {
      setReadinessLoadingPhase("slow");
    }, 6000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [proofGate.status]);

  async function onMarkSentToSponsor(): Promise<void> {
    setMarkSentBusy(true);
    setMarkSentError(null);

    try {
      await markSponsorPackSent(runId, { deliveryMethod: "email" });
      setSentToSponsorUtc(new Date().toISOString());
    } catch (e: unknown) {
      setMarkSentError(e instanceof Error ? e.message : "Could not record sponsor delivery.");
    } finally {
      setMarkSentBusy(false);
    }
  }

  async function onDownloadPdf(): Promise<void> {
    setBusy(true);
    setError(null);

    try {
      await downloadFirstValueReportPdf(runId);
    } catch (e: unknown) {
      if (isApiRequestError(e)) {
        setError({
          message: e.message,
          problem: e.problem,
          correlationId: e.correlationId,
        });
      } else {
        setError({
          message: e instanceof Error ? e.message : "Could not generate sponsor PDF.",
          problem: null,
          correlationId: null,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  const readinessCopy = proofGate.status === "ok" ? describeSponsorProofReadiness(proofGate.payload) : null;

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const blockSponsorPdfForRoi = roiBaselineGate === false && !curatedSampleRun;
  const blockSponsorPdfForProjectedDollar =
    proofGate.status === "ok" && !isProjectedDollarClaimsSponsorSafe(proofGate.payload) && !curatedSampleRun;
  const blockSponsorPdfForAiGate =
    proofGate.status === "ok" && !isAgentOutputPilotStrictSponsorSafe(proofGate.payload) && !curatedSampleRun;
  const blockSponsorPdfForExecutionMode =
    proofGate.status === "ok"
    && isExternalSponsorPdfBlockedForExecutionMode(proofGate.payload)
    && !curatedSampleRun;
  const blockSponsorPdf =
    blockSponsorPdfForRoi
    || blockSponsorPdfForProjectedDollar
    || blockSponsorPdfForAiGate
    || blockSponsorPdfForExecutionMode;
  const executionModeLabel =
    proofGate.status === "ok" ? formatStructuralExecutionModeLabel(proofGate.payload) : null;

  return {
    runId,
    manifestId,
    sponsorDocxAvailable,
    curatedSampleRun,
    busy,
    markSentBusy,
    sentToSponsorUtc,
    markSentError,
    error,
    badgeDayN,
    timeToFirstCommitHours,
    proofGate,
    estimatedUsdSavings,
    markdownHref,
    SponsorReviewPacketHref,
    sponsorProofPackHref,
    executiveBriefHref,
    pilotRoiModelHref,
    readinessLoadingPhase,
    onMarkSentToSponsor,
    onDownloadPdf,
    readinessCopy,
    buyerPolishedShell,
    blockSponsorPdfForRoi,
    blockSponsorPdfForProjectedDollar,
    blockSponsorPdfForAiGate,
    blockSponsorPdfForExecutionMode,
    blockSponsorPdf,
    executionModeLabel,
  };
}
