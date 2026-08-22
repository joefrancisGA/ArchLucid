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

    const examplesNote = screen.getByTestId("structured-brief-capabilities-quality-vocabulary-examples");
    expect(examplesNote).toHaveTextContent(
      "Examples: HTTPS ingress and managed database are capabilities; RTO 4h and p95 latency 200ms are quality attributes.",
    );
    expect(examplesNote.querySelector("span.font-semibold")).toHaveTextContent("Examples:");
  });
});
