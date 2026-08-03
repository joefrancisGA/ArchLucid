import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DecisionRegisterSourcesStrip } from "@/app/(operator)/governance/decision-register/DecisionRegisterSourcesStrip";
import {
  DECISION_REGISTER_CANONICAL_PATH,
  DECISION_REGISTER_SOURCES,
} from "@/lib/decision-register-evidence-copy";

describe("DecisionRegisterSourcesStrip", () => {
  it("lists follow-up Sources without self-linking decision-register", () => {
    render(<DecisionRegisterSourcesStrip />);

    expect(screen.getByTestId("decision-register-sources")).toBeInTheDocument();
    expect(screen.getByTestId("decision-register-claim-discipline")).toHaveTextContent(
      /signed reviews|diligence Sources/i,
    );

    const sources = screen.getByTestId("decision-register-sources");

    for (const link of DECISION_REGISTER_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(DECISION_REGISTER_SOURCES.some((link) => link.href === DECISION_REGISTER_CANONICAL_PATH)).toBe(false);
  });
});
