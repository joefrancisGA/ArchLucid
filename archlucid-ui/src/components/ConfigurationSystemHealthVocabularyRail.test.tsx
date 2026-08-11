import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConfigurationSystemHealthVocabularyRail } from "@/components/ConfigurationSystemHealthVocabularyRail";
import {
  CONFIGURATION_SYSTEM_HEALTH_COMPACT_LINE,
  CONFIGURATION_SYSTEM_HEALTH_CONFIGURATION_LINK,
  CONFIGURATION_SYSTEM_HEALTH_HEADING,
  CONFIGURATION_SYSTEM_HEALTH_SYSTEM_HEALTH_LINK,
  CONFIGURATION_SYSTEM_HEALTH_WHY_TWO,
} from "@/lib/configuration-system-health-vocabulary";

describe("ConfigurationSystemHealthVocabularyRail (TB-2279)", () => {
  it("renders configuration strip with peer link to system health", () => {
    render(
      <ConfigurationSystemHealthVocabularyRail currentSurfaceId="configuration-summary" />,
    );

    const strip = screen.getByTestId("configuration-system-health-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "configuration-summary");
    expect(strip.textContent ?? "").toContain(CONFIGURATION_SYSTEM_HEALTH_COMPACT_LINE);

    const peer = screen.getByTestId("configuration-system-health-vocabulary-peer-link");
    expect(peer).toHaveTextContent(CONFIGURATION_SYSTEM_HEALTH_SYSTEM_HEALTH_LINK.label);
    expect(peer).toHaveAttribute("href", CONFIGURATION_SYSTEM_HEALTH_SYSTEM_HEALTH_LINK.href);
  });

  it("renders system health strip with peer link to configuration summary", () => {
    render(<ConfigurationSystemHealthVocabularyRail currentSurfaceId="system-health" />);

    expect(screen.getByTestId("configuration-system-health-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "system-health",
    );

    const peer = screen.getByTestId("configuration-system-health-vocabulary-peer-link");
    expect(peer).toHaveTextContent(CONFIGURATION_SYSTEM_HEALTH_CONFIGURATION_LINK.label);
    expect(peer).toHaveAttribute("href", CONFIGURATION_SYSTEM_HEALTH_CONFIGURATION_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <ConfigurationSystemHealthVocabularyRail
        currentSurfaceId="configuration-summary"
        variant="full"
      />,
    );

    const strip = screen.getByTestId("configuration-system-health-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(CONFIGURATION_SYSTEM_HEALTH_HEADING)).toBeInTheDocument();
    expect(screen.getByText(CONFIGURATION_SYSTEM_HEALTH_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("configuration-system-health-vocabulary-current")).toHaveTextContent(
      CONFIGURATION_SYSTEM_HEALTH_CONFIGURATION_LINK.label,
    );
  });
});
