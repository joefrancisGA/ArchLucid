import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertsInboxPanelSkeleton } from "./AlertsInboxPanelSkeleton";

describe("AlertsInboxPanelSkeleton — aria", () => {
  it("marks busy state and inbox label", () => {
    render(<AlertsInboxPanelSkeleton />);
    const root = screen.getByLabelText("Loading alert inbox");

    expect(root).toHaveAttribute("aria-busy", "true");
  });
});
