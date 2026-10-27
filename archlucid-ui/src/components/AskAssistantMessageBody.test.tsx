import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AskAssistantMessageBody } from "./AskAssistantMessageBody";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    "aria-label": ariaLabel,
  }: {
    href: string;
    children: import("react").ReactNode;
    "aria-label"?: string;
  }) => (
    <a href={href} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

describe("AskAssistantMessageBody", () => {
  const sampleId = "11111111-1111-4111-8111-111111111111";

  it("renders plain text when no UUID-like tokens appear", () => {
    render(<AskAssistantMessageBody content="No identifiers here." />);

    const paragraph = screen.getByText("No identifiers here.", { exact: false });

    expect(paragraph.tagName).toBe("P");
    expect(within(paragraph).queryByRole("link")).toBeNull();
  });

  it("turns run-shaped UUIDs into review links when reviewIdInScope matches", () => {
    render(<AskAssistantMessageBody content={`See run ${sampleId} for detail.`} reviewIdInScope={sampleId} />);

    const link = screen.getByRole("link", { name: sampleId });

    expect(link).toHaveAttribute("href", `/architecture/reviews/${encodeURIComponent(sampleId)}`);
  });

  it("uses buyer-polished link labels while preserving distinct accessible names", () => {
    render(
      <AskAssistantMessageBody
        buyerPolishedLinks
        content={`Reviews ${sampleId} and 22222222-2222-4222-8222-222222222222.`}
        citedReviewIds={
          new Set([sampleId.toLowerCase(), "22222222-2222-4222-8222-222222222222"])
        }
      />,
    );

    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent("Open linked review");
    expect(links[0]).toHaveAttribute("href", `/architecture/reviews/${encodeURIComponent(sampleId)}`);
    expect(links[0]).toHaveAttribute("aria-label", `Open linked review ${sampleId}`);
  });

  it("renders labeled sections when the assistant uses Risk:/Evidence:/Mitigation:/Validation: headers", () => {
    const structured =
      "Risk:\n\nFirst line.\n\nEvidence:\n\nSecond line with " +
      "22222222-2222-4222-8222-222222222222.\n\nMitigation:\n\nThird.\n\nValidation:\n\nFourth.";

    const evidenceId = "22222222-2222-4222-8222-222222222222";
    const { container } = render(
      <AskAssistantMessageBody
        buyerPolishedLinks
        content={structured}
        citedReviewIds={new Set([evidenceId])}
      />,
    );

    expect(screen.queryByText("Based on the evidence indexed for this review:")).not.toBeInTheDocument();

    const execLead = container.querySelector("div.space-y-4 > p.font-semibold");

    expect(execLead).not.toBeNull();
    expect(execLead?.textContent).toBe("First line.");

    expect(screen.getByRole("heading", { name: "Risk" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Evidence" })).toBeInTheDocument();

    const evidenceLink = screen.getByRole("link", {
      name: `Open linked review 22222222-2222-4222-8222-222222222222`,
    });

    expect(evidenceLink).toHaveAttribute("href", "/architecture/reviews/22222222-2222-4222-8222-222222222222");
  });

  it("labels a missing operator structured preamble explicitly", () => {
    render(<AskAssistantMessageBody content={"Risk:\n\nBody.\n\nEvidence:\n\nMore."} />);

    expect(screen.getByText("Answer preamble was not stored.")).toBeInTheDocument();
  });

  it("labels missing structured sections and buyer lead explicitly", () => {
    render(
      <AskAssistantMessageBody
        buyerPolishedLinks
        content={"Risk:\n\n\nEvidence:\n\nStored evidence."}
      />,
    );

    expect(screen.getByText("Answer lead was not stored.")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Risk" })).toHaveTextContent("This section was stored empty.");
    expect(screen.getByRole("region", { name: "Evidence" })).toHaveTextContent("Stored evidence.");
  });

  it("labels an empty answer body explicitly", () => {
    render(<AskAssistantMessageBody content="" />);

    expect(screen.getByText("Answer was not stored")).toBeInTheDocument();
  });

  it("surfaces an sponsor lead for unstructured buyer-polished plain text", () => {
    const { container } = render(
      <AskAssistantMessageBody
        buyerPolishedLinks
        content="Approved with monitoring. Evidence cites manifest section 4 and the PHI minimization control."
      />,
    );

    const execLead = container.querySelector("div.space-y-4 > p.font-semibold");

    expect(execLead?.textContent).toBe("Approved with monitoring.");
    expect(screen.getByText(/Evidence cites manifest section 4/)).toBeInTheDocument();
    expect(screen.queryByText("Based on the evidence indexed for this review:")).not.toBeInTheDocument();
  });

  it("does not link review UUIDs without scope or cited ids", () => {
    render(<AskAssistantMessageBody content={`See run ${sampleId} for detail.`} />);

    expect(screen.queryByRole("link", { name: sampleId })).toBeNull();
    expect(screen.getByText(sampleId, { exact: false })).toBeInTheDocument();
  });

  it("does not link foreign review UUIDs when reviewIdInScope excludes them", () => {
    const foreignId = "22222222-2222-4222-8222-222222222222";

    render(
      <AskAssistantMessageBody
        content={`See run ${foreignId} for detail.`}
        reviewIdInScope={sampleId}
      />,
    );

    expect(screen.queryByRole("link", { name: foreignId })).toBeNull();
    expect(screen.getByText(foreignId, { exact: false })).toBeInTheDocument();
  });

  it("only linkifies UUIDs that match reviewIdInScope when scope is provided (P-15)", () => {
    render(
      <AskAssistantMessageBody
        content={`Related review ${sampleId} and other ${"22222222-2222-4222-8222-222222222222"}.`}
        reviewIdInScope={sampleId}
      />,
    );

    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", `/architecture/reviews/${encodeURIComponent(sampleId)}`);
    expect(links[0]).toHaveTextContent(sampleId);
  });

  it("renders grounding links footer when provided", () => {
    render(
      <AskAssistantMessageBody
        content="Plain reply."
        groundingLinks={[
          { label: "Manifest", href: "/manifests/a1" },
          { label: "Finding", href: "/architecture/reviews/r1/findings/f1" },
        ]}
      />,
    );

    expect(screen.getByText("Sources in this review")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Manifest" })).toHaveAttribute("href", "/manifests/a1");
    expect(screen.getByRole("link", { name: "Finding" })).toHaveAttribute("href", "/architecture/reviews/r1/findings/f1");
  });
});
