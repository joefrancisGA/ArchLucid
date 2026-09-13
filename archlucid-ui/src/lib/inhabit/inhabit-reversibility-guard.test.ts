import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  INHABIT_DISPOSITION_AMEND_MOUNTED_CONTROL_SURFACES,
} from "@/lib/inhabit/inhabit-disposition-amend-mounted-controls";
import {
  INHABIT_DISPOSITION_HISTORY_EMPTY_BODY,
  INHABIT_DISPOSITION_HISTORY_SECTION_TITLE,
} from "@/lib/inhabit/inhabit-disposition-history-copy";
import {
  MUTATION_UNDO_WINDOW_RECORD_CORRECTION_COPY,
  MUTATION_UNDO_WINDOW_SECONDS,
} from "@/lib/mutation-reversibility-registry";

const SRC_ROOT = join(process.cwd(), "src");

describe("inhabit reversibility guard (IH-034–039)", () => {
  it("IH-035 keeps undo window at 300s and mounts record-correction copy on toast", () => {
    expect(MUTATION_UNDO_WINDOW_SECONDS).toBe(300);
    expect(MUTATION_UNDO_WINDOW_RECORD_CORRECTION_COPY).toMatch(/record correction/i);

    const callout = readFileSync(
      join(SRC_ROOT, "components/operator/ReversibleMutationSuccessCallout.tsx"),
      "utf8",
    );

    expect(callout).toContain("MUTATION_UNDO_WINDOW_RECORD_CORRECTION_COPY");
  });

  it("IH-034 mounts disposition history on triage panel and honest empty inspect copy", () => {
    const triagePanel = readFileSync(
      join(SRC_ROOT, "components/governance/findings/GovernanceFindingTriagePanel.tsx"),
      "utf8",
    );
    const waiverPanel = readFileSync(
      join(
        SRC_ROOT,
        "app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/FindingInspectWaiverPanel.tsx",
      ),
      "utf8",
    );

    expect(triagePanel).toContain("FindingDispositionHistorySection");
    expect(waiverPanel).toContain("INHABIT_DISPOSITION_HISTORY_SECTION_TITLE");
    expect(waiverPanel).toContain("INHABIT_DISPOSITION_HISTORY_EMPTY_BODY");
  });

  it("IH-037 mounts Keep mine on inhabited keyboard triage conflict panel", () => {
    const triageHost = readFileSync(
      join(SRC_ROOT, "components/governance/findings/FindingKeyboardTriageHost.tsx"),
      "utf8",
    );
    const conflictPanel = readFileSync(
      join(SRC_ROOT, "components/governance/findings/FindingDispositionConflictPanel.tsx"),
      "utf8",
    );

    expect(triageHost).toContain("FindingDispositionConflictPanel");
    expect(triageHost).toContain("onKeepMine");
    expect(conflictPanel).toContain("Keep mine");
    expect(conflictPanel).toContain("Load theirs");
  });

  it("IH-039 inventories amend-mounted controls on disposition success surfaces", () => {
    expect(INHABIT_DISPOSITION_AMEND_MOUNTED_CONTROL_SURFACES.length).toBeGreaterThanOrEqual(4);
  });
});

describe("inhabit amend unseal guard (IH-038)", () => {
  it("record correction dialog does not offer unseal and finalize copy stays permanent", () => {
    const correctionDialog = readFileSync(
      join(SRC_ROOT, "components/governance/GovernanceRecordCorrectionDialog.tsx"),
      "utf8",
    );
    const registry = readFileSync(join(SRC_ROOT, "lib/mutation-reversibility-registry.ts"), "utf8");

    expect(correctionDialog.toLowerCase()).not.toContain("unseal");
    expect(registry).toMatch(/cannot be unsealed/i);
    expect(registry).toMatch(/append-only/i);
  });
});

describe("inhabit completeness guard (IH-041–046)", () => {
  it("IH-041/045/046 mount measurement floor, infeasible package, and density generation honesty on inhabited chrome", () => {
    const chrome = readFileSync(
      join(SRC_ROOT, "components/governance/InhabitedFindingsDocumentChrome.tsx"),
      "utf8",
    );

    expect(chrome).toContain("RunDetailInsightDensityMeasurementDenominatorStrip");
    expect(chrome).toContain("RunDetailInfeasibleDecisionLead");
    expect(chrome).toContain("INHABIT_FINDINGS_DENSITY_IS_GENERATION_SENTENCE");
  });

  it("IH-042/043 mount semantic support band chip on inhabited finding rows", () => {
    const row = readFileSync(
      join(SRC_ROOT, "components/governance/findings/GovernanceFindingRow.tsx"),
      "utf8",
    );

    expect(row).toContain("FindingSemanticSupportBandChip");
    expect(row).toContain("inhabitedFindingsDocument");
    expect(row).toContain("structuralExecutionMode");
  });

  it("IH-036 documents in-tab draft undo honesty in architecture draft editing help", () => {
    const help = readFileSync(
      join(SRC_ROOT, "lib/architecture/architecture-draft-editing-help-guide-content.ts"),
      "utf8",
    );

    expect(help).toContain("ARCHITECTURE_DRAFT_EDITING_HELP_UNDO_COPY");
    expect(help).toContain("in-tab-undo");
  });
});
