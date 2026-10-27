import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureDiagramProvenanceSourceFollowUp } from "@/components/architecture/ArchitectureDiagramProvenanceSourceFollowUp";

describe("ArchitectureDiagramProvenanceSourceFollowUp", () => {
  it("renders a source link with item-id honesty", () => {
    render(
      <ArchitectureDiagramProvenanceSourceFollowUp
        followUp={{
          kind: "source-link",
          href: "/reviews/r1/evidence",
          linkLabel: "Open submitted evidence for this review.",
          itemIdHonesty: "No evidence item id was stored on this component.",
        }}
      />,
    );

    expect(screen.getByTestId("architecture-diagram-evidence-item-id-not-stored")).toHaveTextContent(
      "No evidence item id was stored on this component.",
    );
    expect(screen.getByTestId("architecture-diagram-provenance-source-link")).toHaveAttribute(
      "href",
      "/reviews/r1/evidence",
    );
  });

  it("renders a source link without item-id honesty", () => {
    render(
      <ArchitectureDiagramProvenanceSourceFollowUp
        followUp={{
          kind: "source-link",
          href: "/reviews/r1/evidence",
          linkLabel: "Open source evidence",
          itemIdHonesty: null,
        }}
      />,
    );

    expect(screen.queryByTestId("architecture-diagram-evidence-item-id-not-stored")).not.toBeInTheDocument();
    expect(screen.getByTestId("architecture-diagram-provenance-source-link")).toHaveTextContent("Open source evidence");
  });

  it("renders nothing for none", () => {
    const { container } = render(<ArchitectureDiagramProvenanceSourceFollowUp followUp={{ kind: "none" }} />);

    expect(container).toBeEmptyDOMElement();
  });
});
