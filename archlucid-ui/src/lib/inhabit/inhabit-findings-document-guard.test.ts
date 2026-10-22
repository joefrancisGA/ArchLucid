import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

describe("inhabit findings document guard (IH-016–019 / IH-073)", () => {
  it("wires inhabited findings chrome into queue scope section", () => {
    const scopeSection = readFileSync(
      join(SRC_ROOT, "app/(operator)/governance/findings/_sections/GovernanceFindingsQueueScopeSection.tsx"),
      "utf8",
    );

    expect(scopeSection).toContain("InhabitedFindingsDocumentChrome");
    expect(scopeSection).toContain("suppressPipelineChrome");
  });

  it("resolves inhabited page title from architecture display name", () => {
    const presentation = readFileSync(
      join(SRC_ROOT, "app/(operator)/governance/findings/governance-findings-queue-presentation.ts"),
      "utf8",
    );

    expect(presentation).toContain("resolveInhabitedFindingsDocumentPresentation");
  });

  it("maps nested findings contextual help to inhabit-the-architecture", () => {
    const mapSource = readFileSync(join(SRC_ROOT, "lib/usability/page-help-topic-map.ts"), "utf8");

    expect(mapSource).toContain("pathIsWorkingInhabitedFindingsRoute");
    expect(mapSource).toContain("INHABIT_THE_ARCHITECTURE_HELP_SLUG");
  });

  it("mounts quiet-engine honesty on inhabited findings document chrome (IH-040)", () => {
    const chrome = readFileSync(
      join(SRC_ROOT, "components/governance/InhabitedFindingsDocumentChrome.tsx"),
      "utf8",
    );

    expect(chrome).toContain("GovernanceFindingsQueueQuietEnginesHint");
    expect(chrome).toContain("inhabited-findings-quiet-engines");
  });

  it("mounts measurement floor and infeasible package on inhabited chrome (IH-041 / IH-045)", () => {
    const chrome = readFileSync(
      join(SRC_ROOT, "components/governance/InhabitedFindingsDocumentChrome.tsx"),
      "utf8",
    );

    expect(chrome).toContain("RunDetailInsightDensityMeasurementDenominatorStrip");
    expect(chrome).toContain("RunDetailInfeasibleDecisionLead");
  });

  it("names quiet engines on the pre-finalize checklist (IH-041 leftover)", () => {
    const preFinalize = readFileSync(
      join(SRC_ROOT, "components/reviews/PreFinalizeChecklistPanel.tsx"),
      "utf8",
    );

    expect(preFinalize).toContain("GovernanceFindingsQueueQuietEnginesHint");
    expect(preFinalize).toContain("scopedRunId={runId}");
  });

  it("names quiet engines on run progress Ready chrome (IR-001)", () => {
    const tracker = readFileSync(join(SRC_ROOT, "components/runs/RunProgressTracker.tsx"), "utf8");
    const hook = readFileSync(join(SRC_ROOT, "components/runs/use-run-progress-tracker.ts"), "utf8");

    expect(tracker).toContain("GovernanceFindingsQueueQuietEnginesHint");
    expect(tracker).toContain("showQuietEnginesCompletenessHint");
    expect(tracker).toContain('data-testid="run-progress-quiet-engines"');
    expect(hook).toContain("showQuietEnginesCompletenessHint");
  });

  it("IR-005 threads architectureId through quick-decision workspace cards", () => {
    const summary = readFileSync(
      join(SRC_ROOT, "components/quick-decision-summary/QuickDecisionSummary.tsx"),
      "utf8",
    );
    const context = readFileSync(
      join(SRC_ROOT, "components/findings/QuickDecisionWorkspaceFindingSupportingDetails.tsx"),
      "utf8",
    );

    expect(summary).toContain("architectureId: props.architectureId");
    expect(context).toContain("readonly architectureId?: string | null");
  });

  it("uses card disposition layout on inhabited findings list (IH-017)", () => {
    const list = readFileSync(
      join(SRC_ROOT, "components/governance/findings/GovernanceFindingsList.tsx"),
      "utf8",
    );

    expect(list).toContain("inhabitedFindingsDocument");
    expect(list).toContain("useCardDispositionLayout");
  });
});
