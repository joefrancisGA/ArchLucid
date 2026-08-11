import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeploymentStatusSystemHealthVocabularyRail } from "@/components/DeploymentStatusSystemHealthVocabularyRail";
import {
  DEPLOYMENT_STATUS_SYSTEM_HEALTH_COMPACT_LINE,
  DEPLOYMENT_STATUS_SYSTEM_HEALTH_DEPLOYMENT_LINK,
  DEPLOYMENT_STATUS_SYSTEM_HEALTH_HEADING,
  DEPLOYMENT_STATUS_SYSTEM_HEALTH_SYSTEM_LINK,
  DEPLOYMENT_STATUS_SYSTEM_HEALTH_WHY_TWO,
} from "@/lib/deployment-status-system-health-vocabulary";

describe("DeploymentStatusSystemHealthVocabularyRail (TB-2287)", () => {
  it("renders compact strip on deployment status with peer link to system health", () => {
    render(<DeploymentStatusSystemHealthVocabularyRail currentSurfaceId="deployment-status" />);

    const strip = screen.getByTestId("deployment-status-system-health-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "deployment-status");
    expect(strip.textContent ?? "").toContain(DEPLOYMENT_STATUS_SYSTEM_HEALTH_COMPACT_LINE);

    const peer = screen.getByTestId("deployment-status-system-health-vocabulary-peer-link");
    expect(peer).toHaveTextContent(DEPLOYMENT_STATUS_SYSTEM_HEALTH_SYSTEM_LINK.label);
    expect(peer).toHaveAttribute("href", DEPLOYMENT_STATUS_SYSTEM_HEALTH_SYSTEM_LINK.href);
  });

  it("renders compact strip on system health with peer link to deployment status", () => {
    render(<DeploymentStatusSystemHealthVocabularyRail currentSurfaceId="system-health" />);

    expect(screen.getByTestId("deployment-status-system-health-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "system-health",
    );

    const peer = screen.getByTestId("deployment-status-system-health-vocabulary-peer-link");
    expect(peer).toHaveTextContent(DEPLOYMENT_STATUS_SYSTEM_HEALTH_DEPLOYMENT_LINK.label);
    expect(peer).toHaveAttribute("href", DEPLOYMENT_STATUS_SYSTEM_HEALTH_DEPLOYMENT_LINK.href);
  });

  it("renders full variant with why-two", () => {
    render(
      <DeploymentStatusSystemHealthVocabularyRail
        currentSurfaceId="deployment-status"
        variant="full"
      />,
    );

    const strip = screen.getByTestId("deployment-status-system-health-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(DEPLOYMENT_STATUS_SYSTEM_HEALTH_HEADING)).toBeInTheDocument();
    expect(screen.getByText(DEPLOYMENT_STATUS_SYSTEM_HEALTH_WHY_TWO)).toBeInTheDocument();
    expect(
      screen.getByTestId("deployment-status-system-health-vocabulary-current"),
    ).toHaveTextContent(DEPLOYMENT_STATUS_SYSTEM_HEALTH_DEPLOYMENT_LINK.label);
  });
});
