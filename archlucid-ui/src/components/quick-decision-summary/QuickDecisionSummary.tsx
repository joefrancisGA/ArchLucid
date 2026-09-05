"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { ReactElement } from "react";

import type { QuickDecisionWorkspaceCardContext } from "@/components/findings/QuickDecisionWorkspaceFindingSupportingDetails";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useOptionallyControlledBoolean } from "@/hooks/use-optionally-controlled-boolean";
import {
  aggregateFindingProvenance,
  formatFindingProvenanceAggregateLine,
} from "@/lib/findings/finding-provenance-display";
import {
  formatHiddenLowConfidenceHint,
  partitionQuickDecisionFindingsByConfidence,
} from "@/lib/findings/finding-confidence-filter";
import {
  groupQuickDecisionFindingsByPolicyPack,
  summarizePolicyPackFindingImpact,
} from "@/lib/group-findings-by-policy-pack";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import {
  partitionQuickDecisionFindings,
  sortQuickDecisionFindings,
} from "@/lib/quick-decision-summary-derive";
import { usePrefetchItsmFindingCorrelations } from "@/lib/use-itsm-finding-correlations";
import {
  parseQuickDecisionMuteFindingIdFromSearch,
  quickDecisionMutePanelsHrefFromSearch,
} from "@/lib/reviews/quick-decision-mute-panels-url";
import {
  parseQuickDecisionAskFindingIdFromSearch,
  quickDecisionAskPanelsHrefFromSearch,
} from "@/lib/reviews/quick-decision-ask-panels-url";
import {
  parseQuickDecisionReasoningFindingIdFromSearch,
  quickDecisionReasoningPanelsHrefFromSearch,
} from "@/lib/reviews/quick-decision-reasoning-panels-url";

import { QuickDecisionSummaryCardView } from "./QuickDecisionSummaryCardView";
import { QuickDecisionSummaryDialogs } from "./QuickDecisionSummaryDialogs";
import { QuickDecisionSummaryWorkspaceView } from "./QuickDecisionSummaryWorkspaceView";
import type {
  QuickDecisionSummaryDerivedData,
  QuickDecisionSummaryInteractionState,
  QuickDecisionSummaryProps,
} from "./types";

/** Derived data plus the filter toggles the hook owns; {@link splitDerivedState} separates the two again. */
type QuickDecisionSummaryDerivedState = QuickDecisionSummaryDerivedData & {
  readonly showMuted: boolean;
  readonly setShowMuted: (value: boolean) => void;
  readonly showLowConfidence: boolean;
  readonly setShowLowConfidence: (value: boolean) => void;
  readonly showAdvisory: boolean;
  readonly setShowAdvisory: (value: boolean) => void;
};

function useQuickDecisionSummaryDerivedData(props: QuickDecisionSummaryProps): QuickDecisionSummaryDerivedState {
  const sorted = sortQuickDecisionFindings(props.findings);
  const confidenceManagedExternally = props.confidenceVisibility?.managedExternally === true;
  const [showMuted, setShowMuted] = useState(false);
  const [showLowConfidence, setShowLowConfidence] = useOptionallyControlledBoolean(
    confidenceManagedExternally && props.confidenceVisibility
      ? {
          value: props.confidenceVisibility.showLowConfidence,
          onChange: props.confidenceVisibility.onShowLowConfidenceChange,
          managedExternally: true,
        }
      : undefined,
  );
  const [showAdvisory, setShowAdvisory] = useOptionallyControlledBoolean(
    props.advisoryVisibility?.managedExternally === true && props.advisoryVisibility
      ? {
          value: props.advisoryVisibility.showAdvisory,
          onChange: props.advisoryVisibility.onShowAdvisoryChange,
          managedExternally: true,
        }
      : undefined,
  );
  const afterMuteFilter = showMuted ? sorted : sorted.filter((finding) => !finding.isMuted);
  const confidencePartition = confidenceManagedExternally
    ? {
        trustedFindings: afterMuteFilter,
        lowConfidenceFindings: [] as QuickDecisionFinding[],
      }
    : partitionQuickDecisionFindingsByConfidence(afterMuteFilter);
  const { trustedFindings, lowConfidenceFindings } = confidencePartition;
  const hiddenLowConfidenceCount = confidenceManagedExternally
    ? (props.confidenceVisibility?.hiddenByConfidenceCount ?? 0)
    : showLowConfidence
      ? 0
      : lowConfidenceFindings.length;
  const hiddenLowConfidenceHint = formatHiddenLowConfidenceHint(hiddenLowConfidenceCount);
  const { policyViolations, advisoryNotes } = partitionQuickDecisionFindings(trustedFindings);
  const {
    policyViolations: lowConfidencePolicyViolations,
    advisoryNotes: lowConfidenceAdvisoryNotes,
  } = partitionQuickDecisionFindings(lowConfidenceFindings);
  const topGroups = groupQuickDecisionFindingsByPolicyPack(
    policyViolations,
    props.manifestRuleSetId,
    props.manifestRuleSetVersion,
  );
  const policyPackImpact = summarizePolicyPackFindingImpact(
    afterMuteFilter,
    props.manifestRuleSetId,
    props.manifestRuleSetVersion,
  );
  const policyPackSummary = policyPackImpact.groups;
  const hasSourceFindings =
    typeof props.sourceFindingsCount === "number" ? props.sourceFindingsCount > 0 : props.findings.length > 0;
  const itsmFindingIds = useMemo(
    () => props.findings.map((finding) => finding.findingId),
    [props.findings],
  );
  usePrefetchItsmFindingCorrelations(
    itsmFindingIds,
    props.packageCommitted !== false && props.workspaceCardMode !== true,
  );
  const provenanceAggregateLine = formatFindingProvenanceAggregateLine(
    aggregateFindingProvenance(
      props.findings.map((finding) => ({
        trustLabel: finding.trustLabel,
        policyRuleId: finding.policyRuleId,
        evidenceRefCount: finding.evidenceRefCount,
        confidenceLevel: finding.confidenceLevel,
      })),
    ),
  );

  return {
    buyerPolishedShell: props.buyerPolishedShell === true,
    headlineFindingCount: props.headlineFindingCount,
    headlineWarningCount: props.headlineWarningCount,
    confidenceManagedExternally,
    afterMuteFilter,
    trustedFindings,
    lowConfidenceFindings,
    hiddenLowConfidenceHint,
    policyViolations,
    advisoryNotes,
    lowConfidencePolicyViolations,
    lowConfidenceAdvisoryNotes,
    topGroups,
    policyPackSummary,
    policyPackImpact,
    hasSourceFindings,
    provenanceAggregateLine,
    showMuted,
    setShowMuted,
    showLowConfidence,
    setShowLowConfidence,
    showAdvisory,
    setShowAdvisory,
  };
}

function splitDerivedState(state: QuickDecisionSummaryDerivedState): {
  derived: QuickDecisionSummaryDerivedData;
  filters: Pick<
    QuickDecisionSummaryInteractionState,
    "showMuted" | "setShowMuted" | "showLowConfidence" | "setShowLowConfidence" | "showAdvisory" | "setShowAdvisory"
  >;
} {
  const {
    showMuted,
    setShowMuted,
    showLowConfidence,
    setShowLowConfidence,
    showAdvisory,
    setShowAdvisory,
    ...derived
  } = state;

  return {
    derived,
    filters: {
      showMuted,
      setShowMuted,
      showLowConfidence,
      setShowLowConfidence,
      showAdvisory,
      setShowAdvisory,
    },
  };
}

/** Top severity-ranked actionable findings from run detail agent results (no extra API calls). */
export function QuickDecisionSummary(props: QuickDecisionSummaryProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? `/architecture/reviews/${props.runId}`;
  const searchParams = useSearchParams();
  const muteFindingIdParam = searchParams.get("muteFindingId");
  const qdReasonIdParam = searchParams.get("qdReasonId");
  const qdAskFindingIdParam = searchParams.get("qdAskFindingId");
  const canMutate = useOperateCapability();
  const derivedState = useQuickDecisionSummaryDerivedData(props);
  const { derived, filters } = splitDerivedState(derivedState);
  const [reasoningOpen, setReasoningOpen] = useState(() => {
    const urlFindingId = parseQuickDecisionReasoningFindingIdFromSearch(qdReasonIdParam);

    return urlFindingId.length > 0;
  });
  const [activeReasoning, setActiveReasoning] = useState<QuickDecisionFinding | null>(() => {
    const urlFindingId = parseQuickDecisionReasoningFindingIdFromSearch(qdReasonIdParam);

    if (urlFindingId.length === 0) {
      return null;
    }

    return props.findings.find((finding) => finding.findingId === urlFindingId) ?? null;
  });
  const [muteOpen, setMuteOpen] = useState(() => {
    const urlFindingId = parseQuickDecisionMuteFindingIdFromSearch(muteFindingIdParam);

    return urlFindingId.length > 0;
  });
  const [muteTarget, setMuteTarget] = useState<QuickDecisionFinding | null>(() => {
    const urlFindingId = parseQuickDecisionMuteFindingIdFromSearch(muteFindingIdParam);

    if (urlFindingId.length === 0) {
      return null;
    }

    return props.findings.find((finding) => finding.findingId === urlFindingId) ?? null;
  });
  const [askFindingId, setAskFindingIdState] = useState<string | null>(() => {
    const urlFindingId = parseQuickDecisionAskFindingIdFromSearch(qdAskFindingIdParam);

    return urlFindingId.length > 0 ? urlFindingId : null;
  });

  const syncMuteFindingIdToUrl = useCallback(
    (findingId: string | null) => {
      router.replace(quickDecisionMutePanelsHrefFromSearch(searchParams.toString(), findingId, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const syncReasoningFindingIdToUrl = useCallback(
    (findingId: string | null) => {
      router.replace(quickDecisionReasoningPanelsHrefFromSearch(searchParams.toString(), findingId, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const syncAskFindingIdToUrl = useCallback(
    (findingId: string | null) => {
      router.replace(quickDecisionAskPanelsHrefFromSearch(searchParams.toString(), findingId, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  function handleReasoningDialogOpenChange(open: boolean): void {
    setReasoningOpen(open);

    if (!open) {
      setActiveReasoning(null);
      syncReasoningFindingIdToUrl(null);
    }
  }

  function handleMuteDialogOpenChange(open: boolean): void {
    setMuteOpen(open);

    if (!open) {
      setMuteTarget(null);
      syncMuteFindingIdToUrl(null);
    }
  }

  function openMuteDialog(finding: QuickDecisionFinding): void {
    setMuteTarget(finding);
    setMuteOpen(true);
    syncMuteFindingIdToUrl(finding.findingId);
  }

  function openReasoningDialog(finding: QuickDecisionFinding): void {
    setActiveReasoning(finding);
    setReasoningOpen(true);
    syncReasoningFindingIdToUrl(finding.findingId);
  }

  function toggleAskPanel(finding: QuickDecisionFinding): void {
    setAskFindingIdState((current) => {
      const next = current === finding.findingId ? null : finding.findingId;
      syncAskFindingIdToUrl(next);

      return next;
    });
  }

  const setAskFindingId = useCallback(
    (value: string | null) => {
      setAskFindingIdState(value);
      syncAskFindingIdToUrl(value);
    },
    [syncAskFindingIdToUrl],
  );

  const interaction: QuickDecisionSummaryInteractionState = {
    canMutate,
    ...filters,
    reasoningOpen,
    setReasoningOpen: handleReasoningDialogOpenChange,
    activeReasoning,
    setActiveReasoning,
    muteOpen,
    muteTarget,
    askFindingId,
    setAskFindingId,
    handleMuteDialogOpenChange,
    openMuteDialog,
    openReasoningDialog,
    toggleAskPanel,
  };

  const workspaceCardContext: QuickDecisionWorkspaceCardContext = {
    runId: props.runId,
    allFindings: props.findings,
    packageCommitted: props.packageCommitted,
    providerNeutralWorkItems: props.providerNeutralWorkItems,
    architectureWorkItemContext: props.architectureWorkItemContext,
  };

  if (props.workspaceCardMode === true) {
    return (
      <>
        <QuickDecisionSummaryWorkspaceView
          props={props}
          derived={derived}
          interaction={interaction}
          workspaceCardContext={workspaceCardContext}
        />
        <QuickDecisionSummaryDialogs
          runId={props.runId}
          reasoningOpen={reasoningOpen}
          setReasoningOpen={handleReasoningDialogOpenChange}
          activeReasoning={activeReasoning}
          setActiveReasoning={setActiveReasoning}
          muteOpen={muteOpen}
          muteTarget={muteTarget}
          onMuteDialogOpenChange={handleMuteDialogOpenChange}
          muteReasonInputId="finding-mute-reason-workspace"
        />
      </>
    );
  }

  return (
    <>
      <QuickDecisionSummaryCardView props={props} derived={derived} interaction={interaction} />
      <QuickDecisionSummaryDialogs
        runId={props.runId}
        reasoningOpen={reasoningOpen}
        setReasoningOpen={handleReasoningDialogOpenChange}
        activeReasoning={activeReasoning}
        setActiveReasoning={setActiveReasoning}
        muteOpen={muteOpen}
        muteTarget={muteTarget}
        onMuteDialogOpenChange={handleMuteDialogOpenChange}
        muteReasonInputId="finding-mute-reason"
      />
    </>
  );
}
