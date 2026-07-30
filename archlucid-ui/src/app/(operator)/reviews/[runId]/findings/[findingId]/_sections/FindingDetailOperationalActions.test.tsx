import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { FindingInspectPayload } from "@/types/finding-inspect";

import { FindingDetailOperationalActions } from "./FindingDetailOperationalActions";

vi.mock("@/components/CopyFindingAsWorkItemButton", () => ({
  CopyFindingAsWorkItemButton: () => <button type="button">Copy as work item</button>,
}));

const payload: FindingInspectPayload = {
  findingId: "finding-1",
  typedPayload: null,
  decisionRuleId: null,
  decisionRuleName: null,
  evidence: [],
  recommendedActions: [],
  auditRowId: null,
  runId: "run-1",
  manifestVersion: null,
};

describe("FindingDetailOperationalActions", () => {
  it("renders navigation as links with signed review record vocabulary", () => {
    render(
      <FindingDetailOperationalActions
        runId="run-1"
        findingId="finding-1"
        payload={payload}
        graphEvidenceHref="/graph?runId=run-1"
        linkedManifestHref="/signed-records/m1"
        inspectHref="/reviews/run-1/findings/finding-1/evidence-trace"
      />,
    );

    expect(screen.getByRole("link", { name: "Evidence graph" })).toHaveAttribute("href", "/graph?runId=run-1");
    expect(screen.getByRole("link", { name: /Open signed review record/i })).toHaveAttribute(
      "href",
      "/signed-records/m1",
    );
    expect(screen.getByRole("link", { name: "Open evidence trace" })).toHaveAttribute(
      "href",
      "/reviews/run-1/findings/finding-1/evidence-trace",
    );
  });
});
