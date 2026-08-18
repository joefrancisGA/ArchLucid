import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  SESSION_EXPIRED_CLAIM_DISCIPLINE,
  SESSION_EXPIRED_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/session-expired-evidence-copy";

import { SessionExpiredClaimOrientationStrip } from "./SessionExpiredClaimOrientationStrip";

describe("SessionExpiredClaimOrientationStrip", () => {
  it("renders claim discipline heading and body", () => {
    render(<SessionExpiredClaimOrientationStrip />);

    expect(
      screen.getByRole("heading", { level: 2, name: SESSION_EXPIRED_CLAIM_DISCIPLINE_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("session-expired-claim-discipline").textContent).toContain(
      SESSION_EXPIRED_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("session-expired-sources")).toBeInTheDocument();
  });
});
