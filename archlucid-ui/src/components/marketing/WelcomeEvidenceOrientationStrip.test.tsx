import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WelcomeEvidenceOrientationStrip } from "@/components/marketing/WelcomeEvidenceOrientationStrip";
import { WELCOME_CANONICAL_PATH, WELCOME_SOURCES } from "@/lib/welcome-evidence-copy";

describe("WelcomeEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking welcome", () => {
    render(<WelcomeEvidenceOrientationStrip />);

    expect(screen.getByTestId("welcome-sources")).toBeInTheDocument();
    expectClaimDisciplineBand(screen, "welcome-claim-discipline".slice(0, -"-claim-discipline".length), "welcome-claim-discipline");

    for (const link of WELCOME_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(WELCOME_SOURCES.some((link) => link.href === WELCOME_CANONICAL_PATH)).toBe(false);
  });
});
