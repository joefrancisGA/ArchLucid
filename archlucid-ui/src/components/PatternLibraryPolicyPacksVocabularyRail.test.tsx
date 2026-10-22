import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PatternLibraryPolicyPacksVocabularyRail } from "@/components/PatternLibraryPolicyPacksVocabularyRail";
import {
  PATTERN_LIBRARY_POLICY_PACKS_COMPACT_LINE,
  PATTERN_LIBRARY_POLICY_PACKS_HEADING,
  PATTERN_LIBRARY_POLICY_PACKS_LIBRARY_LINK,
  PATTERN_LIBRARY_POLICY_PACKS_PACKS_LINK,
  PATTERN_LIBRARY_POLICY_PACKS_WHY_TWO,
} from "@/lib/vocabulary/pattern-library-policy-packs-vocabulary";

describe("PatternLibraryPolicyPacksVocabularyRail (TB-2292)", () => {
  it("renders pattern-library strip with peer link to policy packs", () => {
    render(<PatternLibraryPolicyPacksVocabularyRail currentSurfaceId="pattern-library" />);

    const strip = screen.getByTestId("pattern-library-policy-packs-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "pattern-library");
    expect(strip.textContent ?? "").toContain(PATTERN_LIBRARY_POLICY_PACKS_COMPACT_LINE);

    const peer = screen.getByTestId("pattern-library-policy-packs-vocabulary-peer-link");
    expect(peer).toHaveTextContent(PATTERN_LIBRARY_POLICY_PACKS_PACKS_LINK.label);
    expect(peer).toHaveAttribute("href", PATTERN_LIBRARY_POLICY_PACKS_PACKS_LINK.href);
  });

  it("renders policy-packs strip with peer link to pattern library", () => {
    render(<PatternLibraryPolicyPacksVocabularyRail currentSurfaceId="policy-packs" />);

    const peer = screen.getByTestId("pattern-library-policy-packs-vocabulary-peer-link");
    expect(peer).toHaveTextContent(PATTERN_LIBRARY_POLICY_PACKS_LIBRARY_LINK.label);
    expect(peer).toHaveAttribute("href", PATTERN_LIBRARY_POLICY_PACKS_LIBRARY_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <PatternLibraryPolicyPacksVocabularyRail currentSurfaceId="pattern-library" variant="full" />,
    );

    expect(screen.getByText(PATTERN_LIBRARY_POLICY_PACKS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(PATTERN_LIBRARY_POLICY_PACKS_WHY_TWO)).toBeInTheDocument();
  });
});
