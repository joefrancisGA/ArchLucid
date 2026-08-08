import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FocusedPilotPolicyPackAppliedCallout } from "@/components/wizard/FocusedPilotPolicyPackAppliedCallout";
import { FOCUSED_PILOT_MODE_PACK_DISPLAY_NAMES } from "@/lib/focused-pilot-mode-policy-packs";

describe("FocusedPilotPolicyPackAppliedCallout", () => {
  it("describes default standards without repeating pack display names", () => {
    render(<FocusedPilotPolicyPackAppliedCallout />);

    expect(screen.getByTestId("focused-pilot-policy-pack-applied-callout")).toBeTruthy();
    expect(screen.getByText(/ArchLucid default standards applied automatically/i)).toBeTruthy();
    expect(
      screen.getByText(
        /For your first review, ArchLucid evaluates against its default architecture-quality standards — Security, Reliability, Cost, Performance, Operational Excellence, and Sustainability/i,
      ),
    ).toBeTruthy();

    for (const packName of FOCUSED_PILOT_MODE_PACK_DISPLAY_NAMES) {
      expect(screen.queryByText(packName)).toBeNull();
    }
  });
});
