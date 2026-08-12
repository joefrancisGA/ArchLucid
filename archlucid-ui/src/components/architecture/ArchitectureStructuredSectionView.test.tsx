import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureStructuredSectionView } from "@/components/architecture/ArchitectureStructuredSectionView";
import {
  ARCHITECTURE_STRUCTURED_ASSERTED_LABEL,
  ARCHITECTURE_STRUCTURED_INFERRED_LABEL,
} from "@/lib/architecture/architecture-structured-content-copy";
import type { ArchitectureStructuredSection } from "@/lib/architecture/architecture-structured-content-types";

const assertedSection: ArchitectureStructuredSection = {
  key: "executive-summary",
  title: "Executive summary",
  provenance: "asserted",
  narrativeMarkdown: "Governed claims intake.",
  entities: [],
};

const inferredSection: ArchitectureStructuredSection = {
  key: "risks",
  title: "Risks",
  provenance: "inferred",
  narrativeMarkdown: "Vendor dependency risk.",
  entities: [],
};

describe("ArchitectureStructuredSectionView", () => {
  it("renders provenance with StatusTag instead of pastel pill styling", () => {
    const { container: assertedContainer } = render(
      <ArchitectureStructuredSectionView
        section={assertedSection}
        defaultOpen
        correctionHref={null}
      />,
    );
    const { container: inferredContainer } = render(
      <ArchitectureStructuredSectionView
        section={inferredSection}
        defaultOpen
        correctionHref="/architecture/reviews/new?path=guided-intake"
      />,
    );

    expect(screen.getByTestId("architecture-section-provenance-asserted")).toHaveTextContent(
      ARCHITECTURE_STRUCTURED_ASSERTED_LABEL,
    );
    expect(screen.getByTestId("architecture-section-provenance-inferred")).toHaveTextContent(
      ARCHITECTURE_STRUCTURED_INFERRED_LABEL,
    );

    const combinedHtml = `${assertedContainer.innerHTML}${inferredContainer.innerHTML}`;

    expect(combinedHtml).not.toContain("text-[0.7rem]");
    expect(combinedHtml).not.toContain("bg-teal-50");
  });
});
