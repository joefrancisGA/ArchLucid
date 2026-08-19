import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SignupVerifyEvidenceOrientationStrip } from "@/components/marketing/SignupVerifyEvidenceOrientationStrip";
import {
  SIGNUP_VERIFY_CANONICAL_PATH,
  SIGNUP_VERIFY_SOURCES,
} from "@/lib/signup-verify-evidence-copy";

describe("SignupVerifyEvidenceOrientationStrip", () => {
  it("lists evaluation Sources without self-linking signup verify", () => {
    render(<SignupVerifyEvidenceOrientationStrip />);

    expect(screen.getByTestId("signup-verify-sources")).toBeInTheDocument();
    if (!shouldOmitClaimDisciplineBand("signup-verify")) { expect(screen.getByTestId("signup-verify-claim-discipline")).toHaveTextContent(
      /Evaluation access|CPA SOC 2|third-party pen/i,
    );

    const sources = screen.getByTestId("signup-verify-sources");

    for (const link of SIGNUP_VERIFY_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(SIGNUP_VERIFY_SOURCES.some((link) => link.href === SIGNUP_VERIFY_CANONICAL_PATH)).toBe(false);
  });
});
