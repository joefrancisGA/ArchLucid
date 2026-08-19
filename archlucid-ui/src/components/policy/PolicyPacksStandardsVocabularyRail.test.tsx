import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PolicyPacksStandardsVocabularyRail } from "@/components/policy/PolicyPacksStandardsVocabularyRail";
import {
  POLICY_PACKS_STANDARDS_COMPACT_LINE,
  POLICY_PACKS_STANDARDS_HEADING,
  POLICY_PACKS_STANDARDS_POLICY_PACKS_LINK,
  POLICY_PACKS_STANDARDS_STANDARDS_LINK,
  POLICY_PACKS_STANDARDS_WHY_TWO,
} from "@/lib/vocabulary/policy-packs-standards-vocabulary";

describe("PolicyPacksStandardsVocabularyRail (TB-2239)", () => {
  it("renders compact strip on policy packs with peer link to standards", () => {
    render(<PolicyPacksStandardsVocabularyRail currentSurfaceId="policy-packs" />);

    const strip = screen.getByTestId("policy-packs-standards-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "policy-packs");
    expect(strip.textContent ?? "").toContain(POLICY_PACKS_STANDARDS_COMPACT_LINE);

    const peer = screen.getByTestId("policy-packs-standards-vocabulary-peer-link");
    expect(peer).toHaveTextContent(POLICY_PACKS_STANDARDS_STANDARDS_LINK.label);
    expect(peer).toHaveAttribute("href", POLICY_PACKS_STANDARDS_STANDARDS_LINK.href);
  });

  it("renders compact strip on standards with peer link to policy packs", () => {
    render(<PolicyPacksStandardsVocabularyRail currentSurfaceId="standards-and-rules" />);

    expect(screen.getByTestId("policy-packs-standards-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "standards-and-rules",
    );

    const peer = screen.getByTestId("policy-packs-standards-vocabulary-peer-link");
    expect(peer).toHaveTextContent(POLICY_PACKS_STANDARDS_POLICY_PACKS_LINK.label);
    expect(peer).toHaveAttribute("href", POLICY_PACKS_STANDARDS_POLICY_PACKS_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <PolicyPacksStandardsVocabularyRail currentSurfaceId="policy-packs" variant="full" />,
    );

    const strip = screen.getByTestId("policy-packs-standards-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(POLICY_PACKS_STANDARDS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(POLICY_PACKS_STANDARDS_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("policy-packs-standards-vocabulary-current")).toHaveTextContent(
      POLICY_PACKS_STANDARDS_POLICY_PACKS_LINK.label,
    );
  });
});
