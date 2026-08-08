import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StandardsRulesEvidenceOrientationStrip } from "@/app/(operator)/governance/standards-and-rules/_sections/StandardsRulesEvidenceOrientationStrip";
import { STANDARDS_RULES_SOURCES } from "@/lib/standards-rules-evidence-copy";
import { GOVERNANCE_STANDARDS_AND_RULES_PATH } from "@/lib/governance-route-paths";

describe("StandardsRulesEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking standards-and-rules", () => {
    render(<StandardsRulesEvidenceOrientationStrip />);

    expect(screen.getByTestId("standards-rules-sources")).toBeInTheDocument();
    expect(screen.getByTestId("standards-rules-claim-discipline")).toBeInTheDocument();

    for (const link of STANDARDS_RULES_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(STANDARDS_RULES_SOURCES.some((link) => link.href === GOVERNANCE_STANDARDS_AND_RULES_PATH)).toBe(
      false,
    );
  });
});
