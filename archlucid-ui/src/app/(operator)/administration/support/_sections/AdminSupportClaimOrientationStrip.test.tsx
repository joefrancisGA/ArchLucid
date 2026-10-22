import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SUPPORT_WORKSPACE_FOLLOW_UPS_TITLE } from "@/lib/support-workspace-evidence-copy";
import { AdminSupportClaimOrientationStrip } from "./AdminSupportClaimOrientationStrip";

describe("AdminSupportClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<AdminSupportClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("support-workspace-sources")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SUPPORT_WORKSPACE_FOLLOW_UPS_TITLE })).toBeInTheDocument();
  });
});
