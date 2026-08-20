import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SignupEvidenceOrientationStrip } from "@/components/marketing/SignupEvidenceOrientationStrip";
import { EVALUATION_SOURCES_TITLE } from "@/lib/evaluation-sources-title";
import { SIGNUP_CANONICAL_PATH, SIGNUP_SOURCES } from "@/lib/signup-evidence-copy";
import { shouldOmitClaimDisciplineBand } from "@/lib/claim-discipline-policy";

describe("SignupEvidenceOrientationStrip", () => {
  it("renders claim and sources bands separately without a Related heading", () => {
    render(
      <>
        <SignupEvidenceOrientationStrip part="claim" />
        <SignupEvidenceOrientationStrip part="sources" />
      </>,
    );

    if (!shouldOmitClaimDisciplineBand("signup")) {
      expect(screen.getByTestId("signup-claim-discipline")).toHaveTextContent(
        /What this page covers|CPA SOC 2|third-party pen|Trust Center/i,
      );
    }

    const sources = screen.getByTestId("signup-sources");

    expect(sources).toHaveTextContent(EVALUATION_SOURCES_TITLE);
    expect(sources).not.toHaveTextContent(/^Related$/);
    expect(SIGNUP_SOURCES).toHaveLength(2);
    expect(within(sources).queryByRole("link", { name: /See a sample review/i })).not.toBeInTheDocument();
    expect(within(sources).queryByRole("link", { name: /Product FAQ/i })).not.toBeInTheDocument();

    for (const link of SIGNUP_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(SIGNUP_SOURCES.some((link) => link.href === SIGNUP_CANONICAL_PATH)).toBe(false);
  });
});
