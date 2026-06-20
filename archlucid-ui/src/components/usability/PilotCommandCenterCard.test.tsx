import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PilotCommandCenterCard } from "@/components/usability/PilotCommandCenterCard";
import {
  PILOT_COMMAND_CENTER_OUTCOMES,
  PILOT_COMMAND_CENTER_OUTCOMES_HEADING,
} from "@/lib/buyer-polish-copy";

describe("PilotCommandCenterCard", () => {
  it("uses discovery-value outcomes instead of artifact receipt framing", () => {
    render(<PilotCommandCenterCard />);

    expect(screen.getByText(PILOT_COMMAND_CENTER_OUTCOMES_HEADING)).toBeInTheDocument();
    expect(screen.getByTestId("pilot-command-center-outcomes")).toBeInTheDocument();
    expect(screen.getByTestId("pilot-command-center-cta-row")).toBeInTheDocument();

    for (const outcome of PILOT_COMMAND_CENTER_OUTCOMES) {
      expect(screen.getByText(outcome)).toBeInTheDocument();
    }

    expect(screen.queryByText("What you'll get")).not.toBeInTheDocument();
    expect(screen.queryByText("Governed decision record")).not.toBeInTheDocument();
    expect(screen.queryByText("Review trail")).not.toBeInTheDocument();
  });

  it("keeps Start review as the primary action above the compact action row", () => {
    render(<PilotCommandCenterCard />);

    expect(screen.getByTestId("pilot-command-center-primary")).toHaveTextContent("Start review");
    expect(screen.getByTestId("pilot-path-preview-stepper")).toBeInTheDocument();
    expect(screen.getByTestId("pilot-command-center-first-run-steps")).toBeInTheDocument();
    expect(screen.getByTestId("pilot-command-center-cta-row")).toBeInTheDocument();
  });
});
