import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import { InlineGlossaryChip } from "@/components/InlineGlossaryChip";
import {
  getGoldenPathGlossaryNoun,
  goldenPathGlossarySeenStorageKey,
} from "@/lib/golden-path-glossary-nouns";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

function renderWithTooltip(ui: ReactElement): ReturnType<typeof render> {
  return render(<TooltipProvider delayDuration={0}>{ui}</TooltipProvider>);
}

describe("InlineGlossaryChip", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the customer-glossary definition in a tooltip on hover", async () => {
    const entry = getGoldenPathGlossaryNoun("signed-review-record");

    renderWithTooltip(
      <InlineGlossaryChip nounId="signed-review-record" pulseOnFirstEncounter={false}>
        sealed review record
      </InlineGlossaryChip>,
    );

    fireEvent.pointerMove(screen.getByText("sealed review record"));

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent(entry.definition);
    expect(tooltip).toHaveTextContent("Open glossary →");
    expect(tooltip.querySelector('a[href="/help/glossary#term-sealed-review-record"]')).not.toBeNull();
  });

  it("persists seen state in localStorage when the tooltip opens", async () => {
    renderWithTooltip(
      <InlineGlossaryChip nounId="evidence-trail" pulseOnFirstEncounter={false}>
        evidence trail
      </InlineGlossaryChip>,
    );

    fireEvent.pointerMove(screen.getByText("evidence trail"));

    await waitFor(() => {
      expect(localStorage.getItem(goldenPathGlossarySeenStorageKey("evidence-trail"))).toBe("1");
    });
  });
});
