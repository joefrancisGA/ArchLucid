import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SignupEvidenceOrientationStrip } from "@/components/marketing/SignupEvidenceOrientationStrip";
import { SIGNUP_CANONICAL_PATH, SIGNUP_SOURCES } from "@/lib/signup-evidence-copy";

describe("SignupEvidenceOrientationStrip", () => {
  it("lists a lean Related set without duplicating sample/security or self-linking signup", () => {
    render(<SignupEvidenceOrientationStrip />);

    expect(screen.getByTestId("signup-claim-discipline")).toHaveTextContent(
      /What this page covers|CPA SOC 2|third-party pen|Trust Center/i,
    );

    const sources = screen.getByTestId("signup-sources");

    expect(sources).toHaveTextContent(/Related/i);
    expect(SIGNUP_SOURCES).toHaveLength(3);
    expect(within(sources).queryByRole("link", { name: /See a sample review/i })).not.toBeInTheDocument();
    expect(within(sources).queryByRole("link", { name: /Security/i })).not.toBeInTheDocument();

    for (const link of SIGNUP_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(SIGNUP_SOURCES.some((link) => link.href === SIGNUP_CANONICAL_PATH)).toBe(false);
  });
});
