import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ValidateCompareVocabularyRail } from "@/components/ValidateCompareVocabularyRail";
import {
  VALIDATE_COMPARE_COMPARE_LINK,
  VALIDATE_COMPARE_COMPACT_LINE,
  VALIDATE_COMPARE_HEADING,
  VALIDATE_COMPARE_VALIDATE_LINK,
  VALIDATE_COMPARE_WHY_TWO,
} from "@/lib/validate-compare-vocabulary";

describe("ValidateCompareVocabularyRail (TB-2240)", () => {
  it("renders compact strip on validate with peer link to compare", () => {
    render(<ValidateCompareVocabularyRail currentSurfaceId="validate-replay" />);

    const strip = screen.getByTestId("validate-compare-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "validate-replay");
    expect(strip.textContent ?? "").toContain(VALIDATE_COMPARE_COMPACT_LINE);

    const peer = screen.getByTestId("validate-compare-vocabulary-peer-link");
    expect(peer).toHaveTextContent(VALIDATE_COMPARE_COMPARE_LINK.label);
    expect(peer).toHaveAttribute("href", VALIDATE_COMPARE_COMPARE_LINK.href);
  });

  it("renders compact strip on compare with peer link to validate", () => {
    render(<ValidateCompareVocabularyRail currentSurfaceId="compare" />);

    expect(screen.getByTestId("validate-compare-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "compare",
    );

    const peer = screen.getByTestId("validate-compare-vocabulary-peer-link");
    expect(peer).toHaveTextContent(VALIDATE_COMPARE_VALIDATE_LINK.label);
    expect(peer).toHaveAttribute("href", VALIDATE_COMPARE_VALIDATE_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(<ValidateCompareVocabularyRail currentSurfaceId="validate-replay" variant="full" />);

    const strip = screen.getByTestId("validate-compare-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(VALIDATE_COMPARE_HEADING)).toBeInTheDocument();
    expect(screen.getByText(VALIDATE_COMPARE_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("validate-compare-vocabulary-current")).toHaveTextContent(
      VALIDATE_COMPARE_VALIDATE_LINK.label,
    );
  });
});
