import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FirstPilotOperatingRail } from "@/components/FirstPilotOperatingRail";

const buyerPolishedMock = vi.hoisted(() => ({ value: false }));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => buyerPolishedMock.value,
  };
});

vi.mock("@/lib/fetch-health-ready", () => ({
  fetchHealthReadySummary: vi.fn(async () => ({ status: "Healthy", entries: [] })),
}));

vi.mock("@/lib/operator-run-picker-client", () => ({
  loadProjectRunsMergedWithDemoFallback: vi.fn(async () => ({ items: [] })),
}));

vi.mock("@/lib/core-pilot-commit-context", async (importOriginal) => {
  const { createCorePilotCommitContextModuleMock } = await import("@/testing/core-pilot-commit-context.mock");

  return createCorePilotCommitContextModuleMock(importOriginal);
});

describe("FirstPilotOperatingRail", () => {
  beforeEach(() => {
    buyerPolishedMock.value = false;

    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });

  it("shows operator rollout copy in full operator shell", async () => {
    render(<FirstPilotOperatingRail />);

    await waitFor(() => {
      expect(screen.getByTestId("first-pilot-operating-rail")).toHaveAttribute("data-disclosure-expanded", "false");
    });

    fireEvent.click(screen.getByRole("button", { name: "Expand Full operating path" }));

    await waitFor(() => {
      expect(screen.getByTestId("first-pilot-operating-rail")).toHaveAttribute("data-rail-variant", "operator");
    });

    expect(screen.getByRole("heading", { name: "Full operating path" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Architecture review walkthrough" })).toBeInTheDocument();
    expect(screen.getByText(/V1\.1 connectors/i)).toBeInTheDocument();
    expect(screen.getByText(/Execute the review pipeline/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add evidence" })).toBeInTheDocument();
  });

  it("shows buyer-safe copy and hides github troubleshoot links in buyer-polished shell", async () => {
    buyerPolishedMock.value = true;

    render(<FirstPilotOperatingRail />);

    await waitFor(() => {
      expect(screen.getByTestId("first-pilot-operating-rail")).toHaveAttribute("data-rail-variant", "buyer");
    });

    fireEvent.click(screen.getByRole("button", { name: "Expand Guided review workflow" }));

    await waitFor(() => {
      expect(screen.getByText(/Complete the guided assessment/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: "Guided review workflow" })).toBeInTheDocument();
    expect(screen.queryByText(/V1\.1 connectors/i)).toBeNull();
    expect(screen.getByText(/Complete the guided assessment/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Upload evidence" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Troubleshoot/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /GitHub/i })).toBeNull();
  });
});
