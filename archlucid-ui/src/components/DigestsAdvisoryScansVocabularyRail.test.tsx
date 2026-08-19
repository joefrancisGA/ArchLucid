import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DigestsAdvisoryScansVocabularyRail } from "@/components/DigestsAdvisoryScansVocabularyRail";
import {
  DIGESTS_ADVISORY_SCANS_ADVISORY_LINK,
  DIGESTS_ADVISORY_SCANS_COMPACT_LINE,
  DIGESTS_ADVISORY_SCANS_DIGESTS_LINK,
  DIGESTS_ADVISORY_SCANS_HEADING,
  DIGESTS_ADVISORY_SCANS_WHY_TWO,
} from "@/lib/vocabulary/digests-advisory-scans-vocabulary";

describe("DigestsAdvisoryScansVocabularyRail (TB-2314)", () => {
  it("renders digests strip with peer link to advisory scans", () => {
    render(<DigestsAdvisoryScansVocabularyRail currentSurfaceId="digests" />);

    const strip = screen.getByTestId("digests-advisory-scans-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "digests");
    expect(strip.textContent ?? "").toContain(DIGESTS_ADVISORY_SCANS_COMPACT_LINE);

    const peer = screen.getByTestId("digests-advisory-scans-vocabulary-peer-link");
    expect(peer).toHaveTextContent(DIGESTS_ADVISORY_SCANS_ADVISORY_LINK.label);
    expect(peer).toHaveAttribute("href", DIGESTS_ADVISORY_SCANS_ADVISORY_LINK.href);
  });

  it("renders advisory-scans strip with peer link to digests", () => {
    render(<DigestsAdvisoryScansVocabularyRail currentSurfaceId="advisory-scans" />);

    const peer = screen.getByTestId("digests-advisory-scans-vocabulary-peer-link");
    expect(peer).toHaveTextContent(DIGESTS_ADVISORY_SCANS_DIGESTS_LINK.label);
    expect(peer).toHaveAttribute("href", DIGESTS_ADVISORY_SCANS_DIGESTS_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <DigestsAdvisoryScansVocabularyRail currentSurfaceId="digests" variant="full" />,
    );

    expect(screen.getByText(DIGESTS_ADVISORY_SCANS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(DIGESTS_ADVISORY_SCANS_WHY_TWO)).toBeInTheDocument();
  });
});
