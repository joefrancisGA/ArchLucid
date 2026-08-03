import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertRulesEvidenceOrientationStrip } from "@/app/(operator)/governance/alert-rules/_sections/AlertRulesEvidenceOrientationStrip";
import {
  ALERT_RULES_CANONICAL_PATH,
  ALERT_RULES_SOURCES,
} from "@/lib/alert-rules-evidence-copy";

describe("AlertRulesEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking the default hub path", () => {
    render(<AlertRulesEvidenceOrientationStrip />);

    expect(screen.getByTestId("alert-rules-sources")).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-claim-discipline")).toBeInTheDocument();

    for (const link of ALERT_RULES_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(ALERT_RULES_SOURCES.some((link) => link.href === ALERT_RULES_CANONICAL_PATH)).toBe(false);
  });
});
