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

  it("turns run-shaped UUIDs into review links using the raw id as link text by default", () => {
    render(<AskAssistantMessageBody content={`See run ${sampleId} for detail.`} />);

    const link = screen.getByRole("link", { name: sampleId });

    expect(link).toHaveAttribute("href", `/reviews/${encodeURIComponent(sampleId)}`);
  });

  it("uses buyer-polished link labels while preserving distinct accessible names", () => {
    render(
      <AskAssistantMessageBody buyerPolishedLinks content={`Runs ${sampleId} and 22222222-2222-4222-8222-222222222222.`} />,
    );

    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent("Open linked review");
    expect(links[0]).toHaveAttribute("href", `/reviews/${encodeURIComponent(sampleId)}`);
    expect(links[0]).toHaveAttribute("aria-label", `Open linked review ${sampleId}`);
  });

  it("renders labeled sections when the assistant uses Risk:/Evidence:/Mitigation:/Validation: headers", () => {
    const structured =
      "Risk:\n\nFirst line.\n\nEvidence:\n\nSecond line with " +
      "22222222-2222-4222-8222-222222222222.\n\nMitigation:\n\nThird.\n\nValidation:\n\nFourth.";

    render(<AskAssistantMessageBody buyerPolishedLinks content={structured} />);

    expect(screen.getByRole("heading", { name: "Risk" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Evidence" })).toBeInTheDocument();
    expect(screen.getByText("First line.", { exact: false })).toBeInTheDocument();

    const evidenceLink = screen.getByRole("link", {
      name: `Open linked review 22222222-2222-4222-8222-222222222222`,
    });

    expect(evidenceLink).toHaveAttribute("href", "/reviews/22222222-2222-4222-8222-222222222222");
  });
});
