import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorHomeGuidanceLink } from "@/components/operator-home/OperatorHomeGuidanceLink";
import { PilotStartHereStrip } from "@/components/operator-home/PilotStartHereStrip";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator-home-disclosure-storage";

describe("OperatorHomeGuidanceLink", () => {
  it("renders visible text guidance instead of an icon-only control", () => {
    render(<OperatorHomeGuidanceLink helpSlug="core-pilot" label="Open Core Pilot guide" />);

    const link = screen.getByRole("link", { name: "Open Core Pilot guide" });

    expect(link).toHaveTextContent("Open Core Pilot guide");
    expect(link).toHaveAttribute("href", "/help/core-pilot");
  });
});

describe("operator Home help affordances", () => {
  it("keeps fast-path guidance as text links inside the expanded section body", async () => {
    localStorage.setItem(OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.pilotStartHere, "0");

    render(<PilotStartHereStrip />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Open the canonical operator checklist" })).toHaveTextContent(
        "Open the canonical operator checklist",
      );
    });

    expect(screen.getByRole("link", { name: "Open the 20-minute time-boxed runbook" })).toHaveTextContent(
      "Open the 20-minute time-boxed runbook",
    );
  });
});
