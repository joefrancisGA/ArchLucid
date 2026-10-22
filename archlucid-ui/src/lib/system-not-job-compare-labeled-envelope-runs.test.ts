import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  COMPARE_RUN_PICKERS_REQUIRE_COMMITTED_MANIFESTS,
  isHonestCompareApiRunId,
  isRunEligibleForComparePicker,
  resolveComparePickerFootnote,
  resolveCompareRunDoorStampLabel,
  resolveCompareRunPickerDropdownSecondaryLine,
  SYSTEM_NOT_JOB_COMPARE_LABELED_ENVELOPE_RUNS_DOC_ANCHOR,
  SYSTEM_NOT_JOB_COMPARE_LABELED_ENVELOPE_RUNS_OWNER,
} from "@/lib/system-not-job-compare-labeled-envelope-runs";
import type { RunSummary } from "@/types/authority";

const REPO_ROOT = join(process.cwd(), "..");

function committedRun(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    runId: "run-envelope-001",
    projectId: "default",
    hasGoldenManifest: true,
    workingCareerRehearsalDoor: "rehearsal",
    displayName: "What-if envelope branch",
    ...overrides,
  };
}

describe("SN-014 compare labeled envelope runs", () => {
  it("requires committed manifests for compare picker eligibility", () => {
    expect(isRunEligibleForComparePicker(committedRun())).toBe(true);
    expect(
      isRunEligibleForComparePicker(
        committedRun({ hasGoldenManifest: false, workingCareerRehearsalDoor: "rehearsal" }),
      ),
    ).toBe(false);
    expect(COMPARE_RUN_PICKERS_REQUIRE_COMMITTED_MANIFESTS).toBe(true);
  });

  it("labels rehearsal and career stamps for committed rows (CG-057)", () => {
    expect(resolveCompareRunDoorStampLabel(committedRun())).toBe("Rehearsal");
    expect(
      resolveCompareRunDoorStampLabel(
        committedRun({ workingCareerRehearsalDoor: "career" }),
      ),
    ).toBe("Career");
    expect(resolveCompareRunPickerDropdownSecondaryLine(committedRun())).toBe(
      "Rehearsal · run-envelope-001",
    );
  });

  it("builds picker footnotes with stamp plus title when picked from list", () => {
    expect(resolveComparePickerFootnote("run-envelope-001", committedRun())).toBe(
      "Rehearsal · What-if envelope branch",
    );
  });

  it("rejects draft workspace ids from Compare API entry", () => {
    expect(isHonestCompareApiRunId("run-42")).toBe(true);
    expect(isHonestCompareApiRunId("new")).toBe(false);
    expect(isHonestCompareApiRunId("drafts/draft-001")).toBe(false);
    expect(isHonestCompareApiRunId("")).toBe(false);
  });

  it("wires committedOnly and stamp helpers into compare pickers", () => {
    const pickersSection = readFileSync(
      join(
        REPO_ROOT,
        "archlucid-ui/src/app/(operator)/insights/compare-two-reviews/_sections/CompareRunPickersSection.tsx",
      ),
      "utf8",
    );
    const compareHelpers = readFileSync(
      join(
        REPO_ROOT,
        "archlucid-ui/src/app/(operator)/insights/compare-two-reviews/_sections/compare-page-helpers.ts",
      ),
      "utf8",
    );
    const runIdPicker = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/components/runs/RunIdPickerDropdownList.tsx"),
      "utf8",
    );

    expect(pickersSection).toContain("COMPARE_RUN_PICKERS_REQUIRE_COMMITTED_MANIFESTS");
    expect(compareHelpers).toContain("resolveComparePickerFootnote");
    expect(runIdPicker).toContain("resolveCompareRunPickerDropdownSecondaryLine");
    expect(existsSync(join(REPO_ROOT, SYSTEM_NOT_JOB_COMPARE_LABELED_ENVELOPE_RUNS_DOC_ANCHOR))).toBe(
      true,
    );
    expect(SYSTEM_NOT_JOB_COMPARE_LABELED_ENVELOPE_RUNS_OWNER).toBe("SN-014");
  });

  it("compare API modules use run id query params only", () => {
    const compareApi = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/api/architecture-runs-compare.ts"),
      "utf8",
    );

    expect(compareApi).toContain("leftRunId");
    expect(compareApi).toContain("rightRunId");
    expect(compareApi).not.toContain("draftId");
    expect(compareApi).not.toContain("DraftRequest");
  });
});
