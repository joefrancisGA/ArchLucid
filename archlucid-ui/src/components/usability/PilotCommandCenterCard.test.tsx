import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PilotCommandCenterCard } from "@/components/usability/PilotCommandCenterCard";
import {
  PILOT_COMMAND_CENTER_LEAD,
  PILOT_PATH_PREVIEW_STEPS,
} from "@/lib/buyer-polish-copy";

describe("PilotCommandCenterCard", () => {
  it("leads with design-first body copy and evidence-optional workflow steps", () => {
    render(<PilotCommandCenterCard />);

    expect(screen.getByTestId("pilot-command-center-lead")).toHaveTextContent(PILOT_COMMAND_CENTER_LEAD);
    expect(screen.getByTestId("pilot-command-center-lead").textContent?.toLowerCase()).toContain("design brief");
    expect(screen.getByTestId("pilot-command-center-lead").textContent?.toLowerCase()).toContain("optional azure");

    expect(screen.getByTestId("pilot-path-preview-stepper")).toBeInTheDocument();

    for (const step of PILOT_PATH_PREVIEW_STEPS) {
      expect(screen.getByText(step.label)).toBeInTheDocument();
    }

    expect(screen.queryByText("Open sample finding → Review evidence → See decision impact")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pilot-command-center-outcomes")).toBeNull();
  });

  it("keeps Start review as the primary action above the compact action row", () => {
    render(<PilotCommandCenterCard />);

    expect(screen.getByTestId("pilot-command-center-primary")).toHaveTextContent("Start review");
    expect(screen.getByTestId("pilot-command-center-try-sample")).toHaveTextContent("Try sample review");
    expect(screen.getByTestId("pilot-command-center-cta-row")).toBeInTheDocument();
  });
});
