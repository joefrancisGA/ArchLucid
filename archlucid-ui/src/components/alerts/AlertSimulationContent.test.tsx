import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AlertSimulationContent } from "@/components/alerts/AlertSimulationContent";
import {
  ALERT_SIMULATION_PROJECT_SLUG_PLACEHOLDER,
  ALERT_SIMULATION_REVIEW_ID_HELPER,
} from "@/lib/alert-simulation-form";
import {
  clearOperatorScopeStorage,
  writeOperatorScopeToStorage,
} from "@/lib/operator/operator-scope-storage";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

const apiHoisted = vi.hoisted(() => ({
  simulateAlertRule: vi.fn(),
  compareAlertRuleCandidates: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  simulateAlertRule: apiHoisted.simulateAlertRule,
  compareAlertRuleCandidates: apiHoisted.compareAlertRuleCandidates,
}));

describe("AlertSimulationContent TB-1592", () => {
  beforeEach(() => {
    clearOperatorScopeStorage();
    apiHoisted.simulateAlertRule.mockReset();
    apiHoisted.compareAlertRuleCandidates.mockReset();
    apiHoisted.simulateAlertRule.mockResolvedValue({
      evaluatedRunCount: 0,
      matchedCount: 0,
      wouldCreateCount: 0,
      wouldSuppressCount: 0,
      summaryNotes: [],
      outcomes: [],
    });
  });

  it("does not use a zero-GUID placeholder on the review-id input", () => {
    render(<AlertSimulationContent />);

    const reviewId = screen.getByTestId("alert-simulation-simple-review-id");
    expect(reviewId).toHaveAttribute("placeholder", "");
    expect(reviewId.getAttribute("placeholder") ?? "").not.toContain("00000000");
    expect(screen.getByText(ALERT_SIMULATION_REVIEW_ID_HELPER)).toBeInTheDocument();
  });

  it("starts project slug empty with Current project placeholder instead of default", () => {
    render(<AlertSimulationContent />);

    const slug = screen.getByTestId("alert-simulation-simple-project-slug");
    expect(slug).toHaveValue("");
    expect(slug).toHaveAttribute("placeholder", ALERT_SIMULATION_PROJECT_SLUG_PLACEHOLDER);
    expect((slug as HTMLInputElement).value.toLowerCase()).not.toBe("default");
  });

  it("resolves blank project slug from session on simulate", async () => {
    writeOperatorScopeToStorage({
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      projectId: "claims-intake",
      workspaceLabel: "Claims Intake Workspace",
      projectLabel: "Claims intake",
    });

    render(<AlertSimulationContent />);

    fireEvent.click(screen.getByRole("button", { name: "Simulate" }));

    await waitFor(() => {
      expect(apiHoisted.simulateAlertRule).toHaveBeenCalledWith(
        expect.objectContaining({
          runProjectSlug: "claims-intake",
        }),
      );
    });
  });
});

describe("AlertSimulationContent TB-1590", () => {
  it("uses design-system Input fields and a primary submit Button on the simple simulation form", () => {
    render(<AlertSimulationContent />);

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByTestId("alert-simulation-simple-submit")).toHaveTextContent("Simulate");
  });

  it("simulation form source avoids raw html input and button elements", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "components", "alerts", "AlertSimulationContent.tsx"),
      "utf8",
    );

    expect(source).not.toMatch(/<input\b/);
    expect(source).not.toMatch(/<button\b/);
    expect(source).toContain('data-testid="alert-simulation-simple-submit"');
    expect(source).toContain('data-testid="alert-simulation-composite-submit"');
    expect(source).toContain('data-testid="alert-simulation-compare-submit"');
    expect(source).toContain('variant="primary"');
  });
});

describe("AlertSimulationContent TB-1591", () => {
  it("renders human nested mode tab labels instead of API keys", () => {
    render(<AlertSimulationContent />);

    expect(screen.getByRole("button", { name: "Simple rule" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Advanced rule" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compare thresholds" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "simple" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "composite" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "compare" })).not.toBeInTheDocument();
  });

  it("simulation mode tab source avoids capitalize API-key pill labels", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "components", "alerts", "AlertSimulationContent.tsx"),
      "utf8",
    );

    expect(source).toContain("ALERT_SIMULATION_MODE_TABS");
    expect(source).not.toMatch(/capitalize/);
    expect(source).not.toMatch(/\{t\}/);
  });
});
