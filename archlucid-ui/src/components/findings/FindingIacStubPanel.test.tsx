import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FindingIacStubPanel } from "@/components/findings/FindingIacStubPanel";

const getRunDetailMock = vi.fn();

vi.mock("@/lib/api", () => ({
  getRunDetail: (...args: unknown[]) => getRunDetailMock(...args),
}));

vi.mock("@/lib/operator/operator-response-guards", () => ({
  coerceRunDetail: (data: unknown) => ({ ok: true, value: data }),
}));

vi.mock("@/lib/quick-decision-summary-derive", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/quick-decision-summary-derive")>();

  return {
    ...actual,
    extractIacStubForFinding: (detail: { iacStub?: string | null }) => detail.iacStub ?? null,
  };
});

describe("FindingIacStubPanel (P-13)", () => {
  beforeEach(() => {
    getRunDetailMock.mockReset();
  });

  it("labels a missing stub without claiming generation did not run", async () => {
    getRunDetailMock.mockResolvedValue({ data: { iacStub: null } });

    render(<FindingIacStubPanel runId="run-1" findingId="finding-1" />);
    fireEvent.click(screen.getByRole("button", { name: /Bicep stub/i }));

    await waitFor(() => {
      expect(screen.getByText("IaC stub was not stored.")).toBeInTheDocument();
    });
    expect(screen.queryByText(/No IaC stub was generated/)).toBeNull();
  });

  it("preserves a stored empty stub without the missing-stub message", async () => {
    getRunDetailMock.mockResolvedValue({ data: { iacStub: "" } });

    render(<FindingIacStubPanel runId="run-1" findingId="finding-1" />);
    fireEvent.click(screen.getByRole("button", { name: /Bicep stub/i }));

    await waitFor(() => {
      expect(getRunDetailMock).toHaveBeenCalled();
    });
    expect(screen.queryByText("IaC stub was not stored.")).toBeNull();
    expect(screen.queryByText(/No IaC stub was generated/)).toBeNull();
  });
});
