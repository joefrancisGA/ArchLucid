import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AlertSimulationContent } from "@/components/alerts/AlertSimulationContent";
import {
  ALERT_SIMULATION_COMPARED_REVIEW_DISABLED_HELPER,
  ALERT_SIMULATION_PROJECT_SLUG_PLACEHOLDER,
  ALERT_SIMULATION_READINESS_RECENT_COUNT,
  ALERT_SIMULATION_READINESS_REVIEW_SCOPE,
  ALERT_SIMULATION_READINESS_THRESHOLD,
  ALERT_SIMULATION_RECENT_COUNT_LABEL,
  ALERT_SIMULATION_REVIEW_ID_HELPER,
  ALERT_SIMULATION_SPECIFIC_REVIEW_REPLACES_WINDOW_NOTE,
} from "@/lib/alert-simulation-form";
import { alertSimulationBehaviorEmptyLead } from "@/lib/enterprise-controls-context-copy";
import {
  clearOperatorScopeStorage,
  writeOperatorScopeToStorage,
} from "@/lib/operator/operator-scope-storage";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: () => <div data-testid="ask-run-id-picker" />,
}));

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => null,
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
    expect(screen.getByTestId("alert-simulation-pick-review-before-simulating-strip")).toBeInTheDocument();
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
    expect(source).toContain('testId="alert-simulation-simple-submit"');
    expect(source).toContain('testId="alert-simulation-composite-submit"');
    expect(source).toContain('testId="alert-simulation-compare-submit"');
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

describe("AlertSimulationContent P0-1 review scope precedence", () => {
  beforeEach(() => {
    clearOperatorScopeStorage();
    apiHoisted.simulateAlertRule.mockReset();
    apiHoisted.simulateAlertRule.mockResolvedValue({
      evaluatedRunCount: 1,
      matchedCount: 0,
      wouldCreateCount: 0,
      wouldSuppressCount: 0,
      summaryNotes: [],
      outcomes: [],
    });
  });

  it("disables compared-to review ID when specific review ID is empty", () => {
    render(<AlertSimulationContent />);

    const comparedTo = screen.getByTestId("alert-simulation-simple-compared-review-id");

    expect(comparedTo).toBeDisabled();
    expect(screen.getByText(ALERT_SIMULATION_COMPARED_REVIEW_DISABLED_HELPER)).toBeInTheDocument();
  });

  it("enables compared-to when specific review ID is set and disables recent window controls", () => {
    render(<AlertSimulationContent />);

    fireEvent.change(screen.getByTestId("alert-simulation-simple-review-id"), {
      target: { value: "review-abc" },
    });

    expect(screen.getByTestId("alert-simulation-simple-compared-review-id")).toBeEnabled();
    expect(screen.getByLabelText(ALERT_SIMULATION_RECENT_COUNT_LABEL)).toBeDisabled();
    expect(screen.getByLabelText("Use historical window (recent reviews)")).toBeDisabled();
    expect(screen.getByText(ALERT_SIMULATION_SPECIFIC_REVIEW_REPLACES_WINDOW_NOTE)).toBeInTheDocument();
  });

  it("does not send compared-to review ID when specific review ID is empty", async () => {
    render(<AlertSimulationContent />);

    fireEvent.change(screen.getByTestId("alert-simulation-simple-review-id"), {
      target: { value: "review-abc" },
    });
    fireEvent.change(screen.getByTestId("alert-simulation-simple-compared-review-id"), {
      target: { value: "baseline-review" },
    });
    fireEvent.change(screen.getByTestId("alert-simulation-simple-review-id"), {
      target: { value: "" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Simulate" }));

    await waitFor(() => {
      expect(apiHoisted.simulateAlertRule).toHaveBeenCalledWith(
        expect.objectContaining({
          runId: null,
          comparedToRunId: null,
        }),
      );
    });
  });

  it("sends compared-to only when specific review ID is set", async () => {
    render(<AlertSimulationContent />);

    fireEvent.change(screen.getByTestId("alert-simulation-simple-review-id"), {
      target: { value: "review-abc" },
    });
    fireEvent.change(screen.getByTestId("alert-simulation-simple-compared-review-id"), {
      target: { value: "baseline-review" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Simulate" }));

    await waitFor(() => {
      expect(apiHoisted.simulateAlertRule).toHaveBeenCalledWith(
        expect.objectContaining({
          runId: "review-abc",
          comparedToRunId: "baseline-review",
        }),
      );
    });
  });
});

describe("AlertSimulationContent P0-2 canSimulate gate", () => {
  beforeEach(() => {
    clearOperatorScopeStorage();
    apiHoisted.simulateAlertRule.mockReset();
    apiHoisted.simulateAlertRule.mockResolvedValue({
      evaluatedRunCount: 0,
      matchedCount: 0,
      wouldCreateCount: 0,
      wouldSuppressCount: 0,
      summaryNotes: [],
      outcomes: [],
    });
  });

  it("disables Simulate and shows readiness when recent review count is cleared", () => {
    render(<AlertSimulationContent />);

    fireEvent.change(screen.getByLabelText(ALERT_SIMULATION_RECENT_COUNT_LABEL), {
      target: { value: "" },
    });

    expect(screen.getByTestId("alert-simulation-simple-submit")).toBeDisabled();
    expect(screen.getByTestId("alert-simulation-simple-readiness")).toHaveTextContent(
      ALERT_SIMULATION_READINESS_RECENT_COUNT,
    );
  });

  it("disables Simulate when recent review count is outside 1–50", () => {
    render(<AlertSimulationContent />);

    fireEvent.change(screen.getByLabelText(ALERT_SIMULATION_RECENT_COUNT_LABEL), {
      target: { value: "51" },
    });

    expect(screen.getByTestId("alert-simulation-simple-submit")).toBeDisabled();
    expect(screen.getByTestId("alert-simulation-simple-readiness")).toHaveTextContent(
      ALERT_SIMULATION_READINESS_RECENT_COUNT,
    );
  });

  it("disables Simulate when historical window is unchecked without a specific review ID", () => {
    render(<AlertSimulationContent />);

    fireEvent.click(screen.getByLabelText("Use historical window (recent reviews)"));

    expect(screen.getByTestId("alert-simulation-simple-submit")).toBeDisabled();
    expect(screen.getByTestId("alert-simulation-simple-readiness")).toHaveTextContent(
      ALERT_SIMULATION_READINESS_REVIEW_SCOPE,
    );
  });

  it("disables Simulate when threshold is cleared", () => {
    render(<AlertSimulationContent />);

    fireEvent.change(screen.getByLabelText("Threshold"), { target: { value: "" } });

    expect(screen.getByTestId("alert-simulation-simple-submit")).toBeDisabled();
    expect(screen.getByTestId("alert-simulation-simple-readiness")).toHaveTextContent(
      ALERT_SIMULATION_READINESS_THRESHOLD,
    );
  });
});

describe("AlertSimulationContent P0-3 simulated outcome empty state", () => {
  it("shows simulated-outcome empty guidance before any simulation", () => {
    render(<AlertSimulationContent />);

    expect(screen.getByText(alertSimulationBehaviorEmptyLead)).toBeInTheDocument();
    expect(screen.queryByText("Current behavior")).not.toBeInTheDocument();
  });
});

describe("AlertSimulationContent P0-5 submit button width", () => {
  it("submit buttons use content width instead of stretching the grid column", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "components", "alerts", "AlertSimulationContent.tsx"),
      "utf8",
    );

    expect(source).toContain('testId="alert-simulation-simple-submit"');
    expect(source).toContain('testId="alert-simulation-composite-submit"');
    expect(source).toContain('testId="alert-simulation-compare-submit"');
    expect(source.match(/justify-self-start/g)?.length).toBe(1);
  });
});
