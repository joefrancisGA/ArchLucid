import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureIntelligenceClaimOrientationStrip } from "./ArchitectureIntelligenceClaimOrientationStrip";
import { ARCHITECTURE_INTELLIGENCE_CLAIM_HEADING } from "@/lib/architecture/architecture-intelligence-page-copy";
import {
  ARCHITECTURE_INTELLIGENCE_CLAIM_DISCIPLINE,
  ARCHITECTURE_INTELLIGENCE_SOURCES_INTRO,
} from "@/lib/architecture/architecture-intelligence-evidence-copy";

describe("ArchitectureIntelligenceClaimOrientationStrip", () => {
  it("mounts claim discipline and sources for architecture intelligence", () => {
    render(<ArchitectureIntelligenceClaimOrientationStrip />);

    expect(screen.getByTestId("architecture-intelligence-orientation")).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURE_INTELLIGENCE_CLAIM_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURE_INTELLIGENCE_CLAIM_DISCIPLINE)).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURE_INTELLIGENCE_SOURCES_INTRO)).toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-sources")).toBeInTheDocument();
  });
});
