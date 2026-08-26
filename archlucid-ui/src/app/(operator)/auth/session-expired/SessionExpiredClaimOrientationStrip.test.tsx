import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SESSION_EXPIRED_FOLLOW_UPS_TITLE } from "@/lib/session-expired-evidence-copy";
import { SessionExpiredClaimOrientationStrip } from "./SessionExpiredClaimOrientationStrip";

describe("SessionExpiredClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<SessionExpiredClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("session-expired-sources")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SESSION_EXPIRED_FOLLOW_UPS_TITLE })).toBeInTheDocument();
  });
});
