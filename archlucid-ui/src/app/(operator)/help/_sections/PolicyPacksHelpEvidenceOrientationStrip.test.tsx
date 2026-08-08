import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PolicyPacksHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/PolicyPacksHelpEvidenceOrientationStrip";
import {
  POLICY_PACKS_HELP_CANONICAL_PATH,
  POLICY_PACKS_HELP_SOURCES,
} from "@/lib/policy-packs-help-evidence-copy";

describe("PolicyPacksHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking policy-packs help", () => {
    render(<PolicyPacksHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("policy-packs-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("policy-packs-help-claim-discipline")).toBeInTheDocument();

    for (const link of POLICY_PACKS_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(POLICY_PACKS_HELP_SOURCES.some((link) => link.href === POLICY_PACKS_HELP_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
