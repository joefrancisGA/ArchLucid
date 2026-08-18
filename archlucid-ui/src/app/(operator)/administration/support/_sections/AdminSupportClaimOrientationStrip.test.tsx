import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  SUPPORT_WORKSPACE_CLAIM_DISCIPLINE,
  SUPPORT_WORKSPACE_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/support-workspace-evidence-copy";

import { AdminSupportClaimOrientationStrip } from "./AdminSupportClaimOrientationStrip";

describe("AdminSupportClaimOrientationStrip", () => {
  it("renders claim discipline heading and body", () => {
    render(<AdminSupportClaimOrientationStrip />);

    expect(
      screen.getByRole("heading", { level: 2, name: SUPPORT_WORKSPACE_CLAIM_DISCIPLINE_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("support-workspace-claim-discipline").textContent).toContain(
      SUPPORT_WORKSPACE_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("support-workspace-sources")).toBeInTheDocument();
  });
});
