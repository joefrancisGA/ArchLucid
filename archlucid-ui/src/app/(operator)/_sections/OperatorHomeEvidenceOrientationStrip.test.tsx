import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorHomeEvidenceOrientationStrip } from "@/app/(operator)/_sections/OperatorHomeEvidenceOrientationStrip";
import {
  OPERATOR_HOME_CANONICAL_PATH,
  OPERATOR_HOME_SOURCES,
} from "@/lib/operator-home-evidence-copy";

describe("OperatorHomeEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking Overview home", () => {
    render(<OperatorHomeEvidenceOrientationStrip />);

    expect(screen.getByTestId("operator-home-sources")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-claim-discipline")).toBeInTheDocument();

    for (const link of OPERATOR_HOME_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(OPERATOR_HOME_SOURCES.some((link) => link.href === OPERATOR_HOME_CANONICAL_PATH)).toBe(false);
  });
});
