/**
 * FP-01 — every production write that can move dbo.FindingCurrentDispositions.
 * Status is done when the call site sends expectedCurrentDispositionRowVersionBase64
 * (or the bulk per-finding map) whenever a current pointer exists.
 */

export type FindingPointerCasStatus = "done" | "fpOwned";

export type FindingPointerCasSurface = {
  readonly id: string;
  readonly sourceRoots: readonly string[];
  readonly status: FindingPointerCasStatus;
  readonly ownerPrompt: string;
  readonly notes: string;
};

const EXPECTED_VERSION_MARKER = "expectedCurrentDispositionRowVersionBase64";

export const FINDING_POINTER_CAS_EXPECTED_VERSION_MARKER = EXPECTED_VERSION_MARKER;

/** UI call sites relative to `archlucid-ui/src`. */
export const FINDING_POINTER_CAS_UI_SURFACES: readonly FindingPointerCasSurface[] = [
  {
    id: "inspect-submit-disposition",
    sourceRoots: [
      "app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/use-finding-inspect-governance-stickiness-dispositions.ts",
    ],
    status: "done",
    ownerPrompt: "FP-04",
    notes: "submitDisposition POST",
  },
  {
    id: "inspect-mark-remediated",
    sourceRoots: [
      "app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/use-finding-inspect-governance-stickiness-dispositions.ts",
    ],
    status: "done",
    ownerPrompt: "FP-05",
    notes: "submitExplicitRemediation POST",
  },
  {
    id: "keyboard-apply",
    sourceRoots: ["components/governance/findings/FindingKeyboardTriageHost.tsx"],
    status: "done",
    ownerPrompt: "RS-11",
    notes: "Already sent the token before this wave; apply path kept.",
  },
  {
    id: "keyboard-undo",
    sourceRoots: ["components/governance/findings/FindingKeyboardTriageHost.tsx"],
    status: "done",
    ownerPrompt: "FP-10",
    notes: "Undo Deferred POST after keyboard apply",
  },
  {
    id: "restore-button",
    sourceRoots: ["components/governance/findings/FindingDispositionRestoreButton.tsx"],
    status: "done",
    ownerPrompt: "FP-11",
    notes: "24-hour accept/waive restore",
  },
  {
    id: "record-finding-disposition-client",
    sourceRoots: ["lib/api/governance-stickiness-api-dispositions.ts"],
    status: "done",
    ownerPrompt: "FP-02",
    notes: "API wrapper definition; allowlisted by the call-site ratchet",
  },
  {
    id: "bulk-ui",
    sourceRoots: ["components/usability/GovernanceFindingsBulkActions.tsx"],
    status: "done",
    ownerPrompt: "FP-17",
    notes: "Queue bulk accept/waive/defer",
  },
  {
    id: "cluster-strip-bulk",
    sourceRoots: ["components/findings/RootCauseClusterDispositionStrip.tsx"],
    status: "done",
    ownerPrompt: "FP-19",
    notes: "Root-cause cluster bulk disposition",
  },
] as const;

/** Backend call sites relative to the repo root. */
export const FINDING_POINTER_CAS_BACKEND_SURFACES: readonly FindingPointerCasSurface[] = [
  {
    id: "sql-bulk",
    sourceRoots: ["ArchLucid.Persistence/Data/Repositories/SqlFindingDispositionConcurrencyRepository.cs"],
    status: "done",
    ownerPrompt: "FP-14",
    notes: "RecordBulkAsync must pass per-event expectedCurrentRowVersion",
  },
  {
    id: "service-bulk",
    sourceRoots: ["ArchLucid.Application/Governance/FindingDisposition/FindingDispositionService.cs"],
    status: "done",
    ownerPrompt: "FP-15",
    notes: "Forwards ExpectedCurrentDispositionRowVersionBase64 into SQL bulk",
  },
  {
    id: "facade-bulk",
    sourceRoots: ["ArchLucid.Application/Governance/Stickiness/GovernanceStickinessFacade.Findings.Dispositions.cs"],
    status: "done",
    ownerPrompt: "FP-13",
    notes: "Copies client per-finding map onto RecordFindingDispositionRequest",
  },
  {
    id: "itsm-inbound",
    sourceRoots: ["ArchLucid.Application/Integrations/Itsm/ItsmInboundDispositionSync.cs"],
    status: "done",
    ownerPrompt: "LP-17",
    notes: "Already sends ExpectedCurrentDispositionRowVersionBase64",
  },
] as const;

export const FINDING_POINTER_CAS_DEFERRED_SURFACES: readonly FindingPointerCasSurface[] = [] as const;
