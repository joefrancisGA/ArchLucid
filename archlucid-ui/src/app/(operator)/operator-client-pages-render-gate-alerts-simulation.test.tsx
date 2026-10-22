import "./operator-client-pages-render-gate.setup.tsx";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertSimulationContent } from "@/components/alerts/AlertSimulationContent";
import { AlertSimulationTuningSection } from "@/components/alerts/AlertSimulationTuningSection";
import { CompositeAlertRulesContent } from "@/components/alerts/CompositeAlertRulesContent";

describe("operator client pages — render gate (alert simulation + composite)", () => {
  it("Alert simulation content demotes duplicate hub page title to h3 (TB-1589)", () => {
    render(<AlertSimulationContent />);
    expect(screen.queryByRole("heading", { level: 2, name: "Simulate alerts" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Simulate alerts" })).toBeInTheDocument();
  });

  it("Alert simulation tuning section demotes dual h2 under hub tab (TB-1589)", () => {
    render(<AlertSimulationTuningSection />);
    expect(screen.queryByRole("heading", { level: 2, name: "Simulate alerts" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Tune alert thresholds" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Simulate alerts" })).toBeInTheDocument();
    expect(screen.getByTestId("alert-test-tune-disclosure")).toBeInTheDocument();
  });

  it("Composite alert rules content does not duplicate hub page title as h2 (TB-1579)", () => {
    render(<CompositeAlertRulesContent />);
    expect(screen.queryByRole("heading", { level: 2, name: "Advanced alert rules" })).not.toBeInTheDocument();
  });
});
