import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AskCitedFindingsSemanticSupportBandFootnote } from "@/components/ask/AskCitedFindingsSemanticSupportBandFootnote";

describe("AskCitedFindingsSemanticSupportBandFootnote", () => {
  it("renders weakest-band footnote for cited findings", () => {
    render(
      <AskCitedFindingsSemanticSupportBandFootnote
        referencedFindingIds={["f-1", "f-2"]}
        findingBandIndex={[
          { findingId: "f-1", band: "Supported" },
          { findingId: "f-2", band: "Unsupported" },
        ]}
      />,
    );

    expect(screen.getByTestId("ask-cited-findings-semantic-support-band-footnote")).toBeInTheDocument();
    expect(screen.getByText("Unsupported")).toBeInTheDocument();
    expect(screen.getByText(/TB-1003/i)).toBeInTheDocument();
  });

  it("renders nothing when no cited findings match the index", () => {
    const { container } = render(
      <AskCitedFindingsSemanticSupportBandFootnote
        referencedFindingIds={["missing-id"]}
        findingBandIndex={[{ findingId: "f-1", band: "Unsupported" }]}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
