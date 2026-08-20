import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StructuredBriefCapabilitiesQualityVocabularyRail } from "@/components/StructuredBriefCapabilitiesQualityVocabularyRail";

describe("StructuredBriefCapabilitiesQualityVocabularyRail", () => {
  it("links to structured brief help", () => {
    render(<StructuredBriefCapabilitiesQualityVocabularyRail currentSurfaceId="architecture-draft-structured-brief" />);

    expect(screen.getByTestId("structured-brief-capabilities-quality-vocabulary")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read structured brief help" })).toHaveAttribute(
      "href",
      "/help/structured-brief",
    );
  });
});
