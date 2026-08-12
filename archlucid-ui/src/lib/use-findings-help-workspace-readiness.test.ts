import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getArchitectureDecisionRegister,
  getArchitectureRiskRegister,
} from "@/lib/api/governance-stickiness-api";
import { FINDINGS_HELP_READINESS_LABELS } from "@/lib/findings/findings-help-guide-content";
import { useFindingsHelpWorkspaceReadiness } from "@/lib/use-findings-help-workspace-readiness";

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  getArchitectureRiskRegister: vi.fn(),
  getArchitectureDecisionRegister: vi.fn(),
}));

const mockedRiskRegister = vi.mocked(getArchitectureRiskRegister);
const mockedDecisionRegister = vi.mocked(getArchitectureDecisionRegister);

describe("useFindingsHelpWorkspaceReadiness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("summarizes open, critical/error, awaiting decision, and recent remediations", async () => {
    const recentUtc = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    mockedRiskRegister.mockResolvedValue({
      entries: [
        {
          findingId: "f-open-critical",
          title: "Open critical",
          severity: "Critical",
          category: "Security",
          statusLabel: "Open",
          agingDays: 1,
          isStale: false,
          evidenceHref: "/evidence/1",
          latestDisposition: null,
          humanReviewStatus: 1,
        },
        {
          findingId: "f-resolved",
          title: "Resolved",
          severity: "Warning",
          category: "Ops",
          statusLabel: "Closed",
          agingDays: 3,
          isStale: false,
          evidenceHref: "/evidence/2",
          latestDisposition: "Remediated",
          lastReviewedUtc: recentUtc,
        },
      ],
    });
    mockedDecisionRegister.mockResolvedValue({ decisions: [] });

    const { result } = renderHook(() => useFindingsHelpWorkspaceReadiness());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.openFindings.valueLabel).toBe("1");
    expect(result.current.criticalAndError.valueLabel).toBe("1");
    expect(result.current.awaitingDecision.valueLabel).toBe("1");
    expect(result.current.recentlyResolved.valueLabel).toBe("1");
    expect(result.current.openFindings.href).toBe("/governance/findings?filter=open");
    expect(result.current.criticalAndError.href).toBe("/governance/findings?filter=critical-error");
    expect(result.current.awaitingDecision.href).toBe("/governance/findings?filter=needs-decision");
    expect(result.current.recentlyResolved.href).toBe(
      "/governance/findings?filter=remediated-recent",
    );
    expect(result.current.criticalAndError.label).toBe(FINDINGS_HELP_READINESS_LABELS.criticalAndError);
    expect(result.current.recentlyResolved.label).toBe(FINDINGS_HELP_READINESS_LABELS.recentlyResolved);
  });

  it("does not count warning severity in the critical and error tile", async () => {
    mockedRiskRegister.mockResolvedValue({
      entries: [
        {
          findingId: "f-open-warning",
          title: "Open warning",
          severity: "Warning",
          category: "Security",
          statusLabel: "Open",
          agingDays: 1,
          isStale: false,
          evidenceHref: "/evidence/1",
          latestDisposition: null,
          humanReviewStatus: 1,
        },
      ],
    });
    mockedDecisionRegister.mockResolvedValue({ decisions: [] });

    const { result } = renderHook(() => useFindingsHelpWorkspaceReadiness());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.openFindings.valueLabel).toBe("1");
    expect(result.current.criticalAndError.valueLabel).toBe("0");
  });

  it("uses zero counts when no findings match", async () => {
    mockedRiskRegister.mockResolvedValue({ entries: [] });
    mockedDecisionRegister.mockResolvedValue({ decisions: [] });

    const { result } = renderHook(() => useFindingsHelpWorkspaceReadiness());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.openFindings.valueLabel).toBe("0");
    expect(result.current.criticalAndError.valueLabel).toBe("0");
    expect(result.current.awaitingDecision.valueLabel).toBe("0");
    expect(result.current.recentlyResolved.valueLabel).toBe("0");
  });
});
