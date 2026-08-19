import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingEvidenceRefSnippets } from "./FindingEvidenceRefSnippets";

describe("FindingEvidenceRefSnippets", () => {
  it("renders evidence excerpts", () => {
    render(<FindingEvidenceRefSnippets snippets={["member ID field unredacted", "subnet peering missing"]} />);

    expect(screen.getByTestId("finding-evidence-ref-snippets")).toBeInTheDocument();
    expect(screen.getByText("member ID field unredacted")).toBeInTheDocument();
  });
});
