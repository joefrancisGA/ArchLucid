import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArtifactReviewContent } from "./ArtifactReviewContent";

const basePrepared = {
  viewKind: "plain" as const,
  readableText: "line one\nline two",
  rawText: "line one\nline two",
  jsonPrettyFailed: false,
};

describe("ArtifactReviewContent (55R smoke — artifact detail panel)", () => {
  it("renders preview caption, byte count, and readable body", () => {
    render(
      <ArtifactReviewContent
        prepared={basePrepared}
        contentType="text/plain"
        byteLength={2048}
        truncated={false}
        contentError={null}
      />,
    );

    expect(screen.getByText(/Text content/)).toBeInTheDocument();
    expect(screen.getByText(/text\/plain/)).toBeInTheDocument();
    expect(screen.getByText(/2,048 bytes/)).toBeInTheDocument();
    expect(document.body.textContent).toContain("line one");
    expect(document.body.textContent).toContain("line two");
    expect(screen.getByText(/Raw UTF-8 content/)).toBeInTheDocument();
  });

  it("shows preview-unavailable callout when contentError is set", () => {
    render(
      <ArtifactReviewContent
        prepared={basePrepared}
        contentType=""
        byteLength={0}
        truncated={false}
        contentError="Preview failed"
      />,
    );

    expect(screen.getByText(/In-shell preview unavailable/)).toBeInTheDocument();
    expect(screen.getByText("Preview failed")).toBeInTheDocument();
    expect(screen.queryByText("line one")).not.toBeInTheDocument();
  });

  it("shows truncation notice when truncated", () => {
    render(
      <ArtifactReviewContent
        prepared={basePrepared}
        contentType="application/json"
        byteLength={5000000}
        truncated
        contentError={null}
      />,
    );

    expect(screen.getByText(/Preview truncated/)).toBeInTheDocument();
    expect(screen.getByText(/5,000,000 bytes total/)).toBeInTheDocument();
  });

  it("renders prominent policy citation strip when policyCitation is provided", () => {
    render(
      <ArtifactReviewContent
        prepared={basePrepared}
        contentType="text/plain"
        byteLength={2048}
        truncated={false}
        contentError={null}
        policyCitation={{
          pack: {
            packId: "azure-wa",
            packName: "Azure Well-Architected",
            href: "/governance/policy-packs?packId=azure-wa",
          },
          policy: {
            ruleId: "sec-001",
            ruleLabel: "SEC-001",
            href: "/governance/policy-packs?ruleId=sec-001",
          },
        }}
      />,
    );

    expect(screen.getByTestId("artifact-review-policy-citation")).toBeInTheDocument();
    expect(screen.getByTestId("finding-policy-citation-prominent")).toBeInTheDocument();
    expect(screen.getByText(/Triggered by policy/)).toBeInTheDocument();
    expect(screen.getByTestId("finding-policy-pack-badge")).toHaveTextContent(/Azure Well-Architected/);
    expect(screen.getByTestId("finding-policy-rule-badge")).toHaveTextContent(/SEC-001/);
  });
});
