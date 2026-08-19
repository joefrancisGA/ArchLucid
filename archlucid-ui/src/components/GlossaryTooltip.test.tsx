import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";

import { TooltipProvider } from "@/components/ui/tooltip";
import { GLOSSARY_TERMS } from "@/lib/glossary-terms";

import { GlossaryTooltip } from "./GlossaryTooltip";

expect.extend(toHaveNoViolations);

function renderWithProvider(ui: ReactElement) {
  return render(
    <TooltipProvider delayDuration={0}>
      {ui}
    </TooltipProvider>,
  );
}

describe("GlossaryTooltip", () => {
  beforeEach(() => {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.clear();
    }
  });

  it("renders the visible child label", () => {
    renderWithProvider(
      <GlossaryTooltip termKey="golden_manifest">
        <span>reviewed manifest</span>
      </GlossaryTooltip>,
    );
    expect(screen.getByText("reviewed manifest")).toBeInTheDocument();
  });

  it("shows definition and learn-more link on hover for entries with a doc link", async () => {
    renderWithProvider(
      <GlossaryTooltip termKey="golden_manifest">reviewed manifest</GlossaryTooltip>,
    );

    fireEvent.pointerMove(screen.getByText("reviewed manifest"));
    const termMatches = await screen.findAllByText(GLOSSARY_TERMS.golden_manifest.term, { exact: true });
    expect(termMatches.length).toBeGreaterThan(0);
    const defMatches = await screen.findAllByText(GLOSSARY_TERMS.golden_manifest.definition, { exact: true });
    expect(defMatches.length).toBeGreaterThan(0);
    const links = screen.getAllByRole("link", { name: /learn more in glossary/i });
    expect(links[0]).toHaveAttribute("href", GLOSSARY_TERMS.golden_manifest.docLink);
    expect(links[0]?.className).toContain("text-[var(--al-tooltip-link)]");
  });

  it("uses effective governance copy with tooltip foreground tokens", async () => {
    renderWithProvider(
      <GlossaryTooltip termKey="effective_governance">Effective policy</GlossaryTooltip>,
    );

    fireEvent.pointerMove(screen.getByText("Effective policy"));

    const definitions = await screen.findAllByText(GLOSSARY_TERMS.effective_governance.definition, { exact: true });

    expect(definitions[0]?.className).toContain("text-[var(--al-tooltip-fg)]");
    expect(definitions[0]?.className).not.toContain("text-al-text-secondary");
  });

  it("has no serious axe violations on the trigger and tooltip region", async () => {
    const { baseElement } = renderWithProvider(
      <GlossaryTooltip termKey="audit_event">audit event</GlossaryTooltip>,
    );
    fireEvent.pointerMove(screen.getByText("audit event"));
    await screen.findAllByText(GLOSSARY_TERMS.audit_event.definition, { exact: true });
    const results = await axe(baseElement, {
      rules: {
        /* Radix duplicates off-screen tooltip text for a11y; the duplicate copy is inert. */
        region: { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });
});
