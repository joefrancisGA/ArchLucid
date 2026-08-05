import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SessionExpiredEvidenceOrientationStrip } from "@/app/(operator)/auth/session-expired/SessionExpiredEvidenceOrientationStrip";
import {
  SESSION_EXPIRED_CANONICAL_PATH,
  SESSION_EXPIRED_SOURCES,
} from "@/lib/session-expired-evidence-copy";

describe("SessionExpiredEvidenceOrientationStrip", () => {
  it("lists public follow-up Sources without self-linking session-expired", () => {
    render(<SessionExpiredEvidenceOrientationStrip />);

    expect(screen.getByTestId("session-expired-sources")).toBeInTheDocument();
    expect(screen.getByTestId("session-expired-claim-discipline")).toBeInTheDocument();

    for (const link of SESSION_EXPIRED_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(SESSION_EXPIRED_SOURCES.some((link) => link.href === SESSION_EXPIRED_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
