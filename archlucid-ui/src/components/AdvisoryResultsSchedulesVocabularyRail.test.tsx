import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvisoryResultsSchedulesVocabularyRail } from "@/components/AdvisoryResultsSchedulesVocabularyRail";
import {
  ADVISORY_RESULTS_SCHEDULES_COMPACT_LINE,
  ADVISORY_RESULTS_SCHEDULES_HEADING,
  ADVISORY_RESULTS_SCHEDULES_RESULTS_LINK,
  ADVISORY_RESULTS_SCHEDULES_SCHEDULES_LINK,
  ADVISORY_RESULTS_SCHEDULES_WHY_TWO,
} from "@/lib/advisory-results-schedules-vocabulary";

describe("AdvisoryResultsSchedulesVocabularyRail (TB-2280)", () => {
  it("renders results strip with peer link to schedules", () => {
    render(<AdvisoryResultsSchedulesVocabularyRail currentSurfaceId="advisory-results" />);

    const strip = screen.getByTestId("advisory-results-schedules-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "advisory-results");
    expect(strip.textContent ?? "").toContain(ADVISORY_RESULTS_SCHEDULES_COMPACT_LINE);

    const peer = screen.getByTestId("advisory-results-schedules-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ADVISORY_RESULTS_SCHEDULES_SCHEDULES_LINK.label);
    expect(peer).toHaveAttribute("href", ADVISORY_RESULTS_SCHEDULES_SCHEDULES_LINK.href);
  });

  it("renders schedules strip with peer link to results", () => {
    render(<AdvisoryResultsSchedulesVocabularyRail currentSurfaceId="advisory-schedules" />);

    expect(screen.getByTestId("advisory-results-schedules-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "advisory-schedules",
    );

    const peer = screen.getByTestId("advisory-results-schedules-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ADVISORY_RESULTS_SCHEDULES_RESULTS_LINK.label);
    expect(peer).toHaveAttribute("href", ADVISORY_RESULTS_SCHEDULES_RESULTS_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <AdvisoryResultsSchedulesVocabularyRail currentSurfaceId="advisory-results" variant="full" />,
    );

    const strip = screen.getByTestId("advisory-results-schedules-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(ADVISORY_RESULTS_SCHEDULES_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ADVISORY_RESULTS_SCHEDULES_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("advisory-results-schedules-vocabulary-current")).toHaveTextContent(
      ADVISORY_RESULTS_SCHEDULES_RESULTS_LINK.label,
    );
  });
});
