import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureStructuredSectionView } from "@/components/architecture/ArchitectureStructuredSectionView";
import {
  ARCHITECTURE_STRUCTURED_ASSERTED_LABEL,
  ARCHITECTURE_STRUCTURED_INFERRED_LABEL,
  ARCHITECTURE_STRUCTURED_SECTION_ENTITIES_NOT_STORED,
  ARCHITECTURE_STRUCTURED_SECTION_ENTITIES_STORED_EMPTY,
} from "@/lib/architecture/architecture-structured-content-copy";
import type { ArchitectureStructuredSection } from "@/lib/architecture/architecture-structured-content-types";

const assertedSection: ArchitectureStructuredSection = {
  key: "sponsor-report",
  title: "Sponsor report",
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

  it("distinguishes missing entity detail from stored empty detail", () => {
    render(
      <ArchitectureStructuredSectionView
        section={{
          ...assertedSection,
          entities: [
            { label: "Missing", detail: null, provenance: "asserted" },
            { label: "Empty", detail: "", provenance: "asserted" },
          ],
        }}
        defaultOpen
        correctionHref={null}
      />,
    );

    expect(screen.getByText("Detail was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Detail was stored empty.")).toBeInTheDocument();
    expect(screen.getByText("Empty")).toBeInTheDocument();
  });

  it("labels omitted entity lists separately from stored-empty lists (P-12)", () => {
    const { rerender } = render(
      <ArchitectureStructuredSectionView
        section={{
          key: "scope",
          title: "Scope",
          provenance: "asserted",
          narrativeMarkdown: null,
        }}
        defaultOpen
        correctionHref={null}
      />,
    );

    expect(screen.getByText(ARCHITECTURE_STRUCTURED_SECTION_ENTITIES_NOT_STORED)).toBeInTheDocument();

    rerender(
      <ArchitectureStructuredSectionView
        section={{
          key: "scope",
          title: "Scope",
          provenance: "asserted",
          narrativeMarkdown: null,
          entities: [],
        }}
        defaultOpen
        correctionHref={null}
      />,
    );

    expect(screen.getByText(ARCHITECTURE_STRUCTURED_SECTION_ENTITIES_STORED_EMPTY)).toBeInTheDocument();
  });

  it("shows working-document honesty on open-questions sections", () => {
    render(
      <ArchitectureStructuredSectionView
        section={{
          key: "open-questions",
          title: "Open questions",
          provenance: "inferred",
          narrativeMarkdown: "Who owns DNS cutover?",
          entities: [],
        }}
        defaultOpen
        correctionHref="/architecture/reviews/new?path=guided-intake"
      />,
    );

    expect(screen.getByTestId("architecture-open-questions-working-document-honesty")).toHaveTextContent(
      "Working document",
    );
  });

  it("labels a stored empty entity heading", () => {
    render(
      <ArchitectureStructuredSectionView
        section={{
          ...assertedSection,
          entities: [{ label: "", detail: "Still described.", provenance: "asserted" }],
        }}
        defaultOpen
        correctionHref={null}
      />,
    );

    expect(screen.getByText("Item label was stored empty.")).toBeInTheDocument();
  });
});
