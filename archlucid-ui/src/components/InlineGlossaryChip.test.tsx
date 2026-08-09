import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InlineGlossaryChip } from "@/components/InlineGlossaryChip";
import {
  getGoldenPathGlossaryNoun,
  goldenPathGlossarySeenStorageKey,
} from "@/lib/golden-path-glossary-nouns";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

describe("InlineGlossaryChip", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("opens the customer-glossary definition in a popover", async () => {
    const entry = getGoldenPathGlossaryNoun("signed-review-record");

    render(
      <InlineGlossaryChip nounId="signed-review-record" pulseOnFirstEncounter={false}>
        signed review record
      </InlineGlossaryChip>,
    );

    fireEvent.click(screen.getByRole("button", { name: `What is ${entry.label}?` }));

    expect(await screen.findByText(entry.definition)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open glossary →" })).toHaveAttribute(
      "href",
      "/help/glossary#term-signed-review-record",
    );
  });

  it("persists seen state in localStorage when the popover opens", async () => {
    render(
      <InlineGlossaryChip nounId="evidence-trail" pulseOnFirstEncounter={false}>
        evidence trail
      </InlineGlossaryChip>,
    );

    fireEvent.click(screen.getByRole("button", { name: /What is Evidence trail/i }));

    await waitFor(() => {
      expect(localStorage.getItem(goldenPathGlossarySeenStorageKey("evidence-trail"))).toBe("1");
    });
  });
});
