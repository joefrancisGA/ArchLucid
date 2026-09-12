import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  SYSTEM_NOT_JOB_COMPARE_GATE_CHEAP_PATH_OWNER,
  SYSTEM_NOT_JOB_COMPARE_GATE_DRAFT_DIFF_REJECTED_COUNT_BASELINE,
  SYSTEM_NOT_JOB_COMPARE_GATE_INVENTORY_DOC_PATH,
  SYSTEM_NOT_JOB_COMPARE_GATE_JOURNEYS,
} from "@/lib/system-not-job-compare-gate-inventory";

const REPO_ROOT = join(process.cwd(), "..");

const AUTHORITY_COMPARE_SERVICE_PATH =
  "ArchLucid.Persistence/Coordination/Compare/AuthorityCompareService.cs";
const COMPARE_FINALIZED_AVAILABILITY_PATH =
  "archlucid-ui/src/app/(operator)/insights/compare-two-reviews/_sections/useCompareFinalizedRunAvailability.ts";
const COMPARE_BASELINE_RUN_PATH = "archlucid-ui/src/lib/compare-baseline-run.ts";
const COMPARE_RUN_PAIR_BLOCKED_PATH =
  "archlucid-ui/src/lib/compare/compare-run-pair-blocked-reason.ts";
const DRAFT_BRANCH_AUTO_COMPARE_PATH = "archlucid-ui/src/lib/draft-branch-auto-compare.ts";
const DRAFT_INVARIANT_ENVELOPE_PATH =
  "archlucid-ui/src/components/architecture/DraftInvariantEnvelopePreview.tsx";
const ADR_0092_PATH = "docs/architecture/adrs/0092-working-cheap-what-if-envelope.md";

describe("system-not-job Compare gate inventory (SN-006)", () => {
  it("documents shrink-only journey table in repo markdown", () => {
    const markdown = readFileSync(join(REPO_ROOT, SYSTEM_NOT_JOB_COMPARE_GATE_INVENTORY_DOC_PATH), "utf8");

    expect(markdown).toMatch(/ADR \*\*0092\*\*/);
    expect(markdown).toMatch(/AuthorityCompareService/);
    expect(markdown).toMatch(/draftVsDraft/);
    expect(markdown).toMatch(/SN-008/);
    expect(markdown).toMatch(/draft-to-draft Compare as Career proof/i);

    for (const journey of SYSTEM_NOT_JOB_COMPARE_GATE_JOURNEYS) {
      expect(markdown).toContain(journey.journeyId);
    }
  });

  it("anchors Compare gate to AuthorityCompareService golden manifest requirement", () => {
    const compareService = readFileSync(join(REPO_ROOT, AUTHORITY_COMPARE_SERVICE_PATH), "utf8");
    const finalizedAvailability = readFileSync(
      join(REPO_ROOT, COMPARE_FINALIZED_AVAILABILITY_PATH),
      "utf8",
    );
    const baselineRun = readFileSync(join(REPO_ROOT, COMPARE_BASELINE_RUN_PATH), "utf8");

    expect(compareService).toContain("GoldenManifestId");
    expect(compareService).toContain("CompareManifestsAsync");
    expect(finalizedAvailability).toContain("committedOnly: true");
    expect(finalizedAvailability).toContain("insufficientForCompare");
    expect(baselineRun).toContain("isRunCommittedForBaseline");
    expect(baselineRun).toContain("hasGoldenManifest === true");
    expect(existsSync(join(REPO_ROOT, AUTHORITY_COMPARE_SERVICE_PATH))).toBe(true);
  });

  it("keeps draft-diff rejected journeys at or above baseline and points cheap path at SN-008", () => {
    const draftDiffRejected = SYSTEM_NOT_JOB_COMPARE_GATE_JOURNEYS.filter(
      (journey) => journey.draftDiffRejected,
    );

    expect(draftDiffRejected.length).toBeGreaterThanOrEqual(
      SYSTEM_NOT_JOB_COMPARE_GATE_DRAFT_DIFF_REJECTED_COUNT_BASELINE,
    );

    const cheapPathJourneys = SYSTEM_NOT_JOB_COMPARE_GATE_JOURNEYS.filter(
      (journey) => journey.cheapPathOwner === SYSTEM_NOT_JOB_COMPARE_GATE_CHEAP_PATH_OWNER,
    );

    expect(cheapPathJourneys.length).toBeGreaterThan(0);

    for (const journey of cheapPathJourneys) {
      expect(journey.cheapPathOwner).toBe("SN-008");
    }

    const draftVsDraft = SYSTEM_NOT_JOB_COMPARE_GATE_JOURNEYS.find(
      (journey) => journey.journeyId === "draftVsDraft",
    );

    expect(draftVsDraft).toBeDefined();
    expect(draftVsDraft!.gateOutcome).toBe("blocked");
    expect(draftVsDraft!.draftDiffRejected).toBe(true);
    expect(draftVsDraft!.cheapPathOwner).toBe("SN-008");
  });

  it("names Working journeys that die at Compare (draft, in-flight, envelope, spawn-lock)", () => {
    const blockedJourneyIds = [
      "draftVsDraft",
      "draftVsSealedRun",
      "spawnLockedDraftVsSealedRun",
      "inFlightRunVsSealedRun",
      "inFlightRunVsInFlightRun",
      "labeledEnvelopeVsSeal",
      "comparePageInsufficientFinalized",
      "compareToBaselineUnfinalizedCurrent",
    ];

    for (const journeyId of blockedJourneyIds) {
      const journey = SYSTEM_NOT_JOB_COMPARE_GATE_JOURNEYS.find((entry) => entry.journeyId === journeyId);

      expect(journey, journeyId).toBeDefined();
      expect(journey!.gateOutcome).toBe("blocked");
    }

    const whatIfBranch = SYSTEM_NOT_JOB_COMPARE_GATE_JOURNEYS.find(
      (journey) => journey.journeyId === "whatIfBranchBeforeFinalize",
    );

    expect(whatIfBranch).toBeDefined();
    expect(whatIfBranch!.gateOutcome).toBe("polls-until-sealed");
  });

  it("wires R12 branch compare polling and 409 blocked-reason copy", () => {
    const branchAutoCompare = readFileSync(join(REPO_ROOT, DRAFT_BRANCH_AUTO_COMPARE_PATH), "utf8");
    const blockedReason = readFileSync(join(REPO_ROOT, COMPARE_RUN_PAIR_BLOCKED_PATH), "utf8");
    const adr = readFileSync(join(REPO_ROOT, ADR_0092_PATH), "utf8");

    expect(branchAutoCompare).toContain("bothRunsReadyForBranchCompare");
    expect(branchAutoCompare).toContain("hasGoldenManifest");
    expect(blockedReason).toContain("sealed manifest");
    expect(adr).toMatch(/Compare unsealed drafts is forbidden/i);
    expect(adr).toContain("SN-008");
  });

  it("documents orientation-only surfaces that are not Compare substitutes", () => {
    const envelopePreview = readFileSync(join(REPO_ROOT, DRAFT_INVARIANT_ENVELOPE_PATH), "utf8");

    expect(envelopePreview).toMatch(/committed package/i);

    const orientationJourneys = SYSTEM_NOT_JOB_COMPARE_GATE_JOURNEYS.filter(
      (journey) => journey.gateOutcome === "orientation-only",
    );

    expect(orientationJourneys.map((journey) => journey.journeyId)).toEqual(
      expect.arrayContaining(["labeledEnvelopePreview", "architectureSealDeltaOrientation"]),
    );
  });
});
