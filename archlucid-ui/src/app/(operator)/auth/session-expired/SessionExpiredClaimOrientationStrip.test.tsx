import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SESSION_EXPIRED_FOLLOW_UPS_TITLE } from "@/lib/session-expired-evidence-copy";

import { SessionExpiredClaimOrientationStrip } from "./SessionExpiredClaimOrientationStrip";

describe("SessionExpiredClaimOrientationStrip", () => {
  it("renders a sources-only strip without claim discipline", () => {
    render(<SessionExpiredClaimOrientationStrip />);

    expect(screen.queryByTestId("session-expired-claim-discipline")).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: SESSION_EXPIRED_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("session-expired-sources")).toHaveAttribute("data-layout", "stacked");
  });
});
