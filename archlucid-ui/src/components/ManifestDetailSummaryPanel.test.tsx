import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ManifestSummary } from "@/types/authority";

import { ManifestDetailSummaryPanel } from "./ManifestDetailSummaryPanel";

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/sealed-records/m1",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const summary: ManifestSummary = {
  manifestId: "m1",
  runId: "r1",
  createdUtc: "2026-01-01T00:00:00Z",
  manifestHash: "hash",
  ruleSetId: "pack",
  ruleSetVersion: "1",
  status: "Committed",
  decisionCount: 0,
  warningCount: 0,
  unresolvedIssueCount: 0,
};

describe("ManifestDetailSummaryPanel operator summary", () => {
  it("labels a missing summary and omits a stored empty summary", () => {
    const { unmount } = render(<ManifestDetailSummaryPanel summary={summary} />);

    expect(screen.getByText("Operator summary was not stored.")).toBeInTheDocument();
    unmount();

    render(<ManifestDetailSummaryPanel summary={{ ...summary, operatorSummary: "" }} />);

    expect(screen.queryByText("Operator summary was not stored.")).not.toBeInTheDocument();
  });
});
