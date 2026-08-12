import type { QuickDecisionWorkItemContext } from "@/components/findings/QuickDecisionWorkspaceFindingSupportingDetails";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { PolicyPackFindingGroup, PolicyPackFindingGroupDetail } from "@/lib/group-findings-by-policy-pack";

export type QuickDecisionSummaryConfidenceVisibility = {
  readonly showLowConfidence: boolean;
  readonly onShowLowConfidenceChange: (value: boolean) => void;
  readonly hiddenByConfidenceCount: number;
  readonly managedExternally: true;
};

export type QuickDecisionSummaryAdvisoryVisibility = {
  readonly showAdvisory: boolean;
  readonly onShowAdvisoryChange: (value: boolean) => void;
  readonly managedExternally: true;
};

export type QuickDecisionSummaryProps = {
  readonly runId: string;
  readonly findings: readonly QuickDecisionFinding[];
  /** When true and headline counts disagree with extracted findings, show a finalized-review-safe narrative (buyer shell). */
  readonly buyerPolishedShell?: boolean;
  readonly headlineFindingCount?: number | null;
  readonly headlineWarningCount?: number | null;
  /** When true, rows were derived from explanation traces because agent results were empty on the authority payload. */
  readonly usingExplanationFallback?: boolean;
  readonly manifestRuleSetId?: string | null;
  readonly manifestRuleSetVersion?: string | null;
  /** Workspace layout: collapsible finding cards with critical/high expanded by default. */
  readonly workspaceCardMode?: boolean;
  readonly defaultExpandLowSeverity?: boolean;
  /** Architecture-creation review detail: provider-neutral work item affordance instead of Jira-biased copy controls. */
  readonly providerNeutralWorkItems?: boolean;
  readonly architectureWorkItemContext?: QuickDecisionWorkItemContext | null;
  /** When false, hide work-item / ITSM integration chrome until a committed manifest exists (TB-1854). */
  readonly packageCommitted?: boolean;
  /** When set, confidence filtering is owned by the parent (review detail findings workspace). */
  readonly confidenceVisibility?: QuickDecisionSummaryConfidenceVisibility;
  /** When set, advisory-note expansion is owned by the parent (review detail findings workspace). */
  readonly advisoryVisibility?: QuickDecisionSummaryAdvisoryVisibility;
  /** Create-home: assessment pipeline stages finished (distinct from in-flight tracker). */
  readonly analysisStagesComplete?: boolean;
  /** Create-home: navigate to Activity tab from in-progress empty state. */
  readonly onNavigateActivity?: () => void;
  /**
   * When the parent already applied toolbar/confidence filters to `findings`, pass the
   * unfiltered source length so create-home empty states do not fire on filtered-empty lists.
   */
  readonly sourceFindingsCount?: number;
};

export type QuickDecisionSummaryDerivedData = {
  readonly buyerPolishedShell: boolean;
  readonly headlineFindingCount: number | null | undefined;
  readonly headlineWarningCount: number | null | undefined;
  readonly confidenceManagedExternally: boolean;
  readonly afterMuteFilter: readonly QuickDecisionFinding[];
  readonly trustedFindings: readonly QuickDecisionFinding[];
  readonly lowConfidenceFindings: readonly QuickDecisionFinding[];
  readonly hiddenLowConfidenceHint: string | null;
  readonly policyViolations: readonly QuickDecisionFinding[];
  readonly advisoryNotes: readonly QuickDecisionFinding[];
  readonly lowConfidencePolicyViolations: readonly QuickDecisionFinding[];
  readonly lowConfidenceAdvisoryNotes: readonly QuickDecisionFinding[];
  readonly topGroups: readonly PolicyPackFindingGroupDetail[];
  readonly policyPackSummary: readonly PolicyPackFindingGroup[];
  readonly policyPackImpact: {
    readonly groups: readonly PolicyPackFindingGroup[];
    readonly mappedFindingCount: number;
    readonly unmappedFindingCount: number;
  };
  readonly hasSourceFindings: boolean;
  readonly provenanceAggregateLine: string | null;
};

export type QuickDecisionSummaryInteractionState = {
  readonly canMutate: boolean;
  readonly showMuted: boolean;
  readonly setShowMuted: (value: boolean) => void;
  readonly showLowConfidence: boolean;
  readonly setShowLowConfidence: (value: boolean) => void;
  readonly showAdvisory: boolean;
  readonly setShowAdvisory: (value: boolean) => void;
  readonly reasoningOpen: boolean;
  readonly setReasoningOpen: (open: boolean) => void;
  readonly activeReasoning: QuickDecisionFinding | null;
  readonly setActiveReasoning: (finding: QuickDecisionFinding | null) => void;
  readonly muteOpen: boolean;
  readonly muteTarget: QuickDecisionFinding | null;
  readonly askFindingId: string | null;
  readonly setAskFindingId: (value: string | null | ((current: string | null) => string | null)) => void;
  readonly handleMuteDialogOpenChange: (open: boolean) => void;
  readonly openMuteDialog: (finding: QuickDecisionFinding) => void;
  readonly openReasoningDialog: (finding: QuickDecisionFinding) => void;
  readonly toggleAskPanel: (finding: QuickDecisionFinding) => void;
};
