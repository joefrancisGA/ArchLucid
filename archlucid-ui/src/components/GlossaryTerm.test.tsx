import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import {
  GLOSSARY_CORE_TERM_IDS,
  GLOSSARY_DEFINITIONS,
  type GlossaryDefinitionId,
} from "@/lib/glossary-definitions";

import { GlossaryTerm } from "./GlossaryTerm";

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

function renderWithTooltip(ui: ReactElement): ReturnType<typeof render> {
  return render(<TooltipProvider delayDuration={0}>{ui}</TooltipProvider>);
}

describe("GlossaryTerm", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("resolves every core glossary id to short and long definitions within word budgets", () => {
    expect(GLOSSARY_CORE_TERM_IDS).toHaveLength(10);

    for (const id of GLOSSARY_CORE_TERM_IDS) {
      const entry = GLOSSARY_DEFINITIONS[id as GlossaryDefinitionId];

      expect(entry.displayLabel.trim().length).toBeGreaterThan(0);
      expect(entry.shortDefinition.trim().length).toBeGreaterThan(0);
      expect(entry.longDefinition.trim().length).toBeGreaterThan(0);
      expect(countWords(entry.shortDefinition)).toBeLessThanOrEqual(20);
      expect(countWords(entry.longDefinition)).toBeLessThanOrEqual(60);
    }
  });

  it("shows short definition in tooltip on hover", async () => {
    renderWithTooltip(
      <GlossaryTerm termId="run" pulseOnFirstSession={false}>
        review run
      </GlossaryTerm>,
    );

    fireEvent.pointerMove(screen.getByText("review run"));

    expect(
      (await screen.findAllByText(GLOSSARY_DEFINITIONS.run.shortDefinition, { exact: true })).length,
    ).toBeGreaterThan(0);
  });

  it("exposes tooltip content to assistive technologies when open", async () => {
    renderWithTooltip(
      <GlossaryTerm termId="policy_pack" pulseOnFirstSession={false}>
        policy pack
      </GlossaryTerm>,
    );

    const trigger = screen.getByText("policy pack");
    fireEvent.pointerMove(trigger);

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent(GLOSSARY_DEFINITIONS.policy_pack.shortDefinition);

    await waitFor(() => {
      expect(trigger).toHaveAttribute("aria-describedby", tooltip.id);
    });
  });

  it("expands long definition when Learn more is activated", async () => {
    renderWithTooltip(
      <GlossaryTerm termId="replay" pulseOnFirstSession={false}>
        replay
      </GlossaryTerm>,
    );

    fireEvent.pointerMove(screen.getByText("replay"));

    const learnMoreButtons = await screen.findAllByRole("button", { name: "Learn more" });
    expect(learnMoreButtons.length).toBeGreaterThan(0);
    const learnMore = learnMoreButtons[0];
    if (learnMore === undefined) {
      throw new Error("expected Learn more control");
    }

    fireEvent.click(learnMore);

    expect(screen.getAllByText(GLOSSARY_DEFINITIONS.replay.longDefinition, { exact: true }).length).toBeGreaterThan(0);
    expect(learnMore).toHaveAttribute("aria-expanded", "true");
  });
});
