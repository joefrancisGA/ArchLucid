import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SignupEvidenceOrientationStrip } from "@/components/marketing/SignupEvidenceOrientationStrip";
import { SIGNUP_CANONICAL_PATH, SIGNUP_SOURCES } from "@/lib/signup-evidence-copy";

describe("SignupEvidenceOrientationStrip", () => {
  it("lists evaluation Sources without self-linking signup", () => {
    render(<SignupEvidenceOrientationStrip />);

    expect(screen.getByTestId("signup-sources")).toBeInTheDocument();
    expect(screen.getByTestId("signup-claim-discipline")).toHaveTextContent(
      /Evaluation access|CPA SOC 2|third-party pen/i,
    );

    const sources = screen.getByTestId("signup-sources");

    for (const link of SIGNUP_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(SIGNUP_SOURCES.some((link) => link.href === SIGNUP_CANONICAL_PATH)).toBe(false);
  });
});
