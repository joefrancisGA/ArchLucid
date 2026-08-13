import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GraphStaticFallback } from "@/components/GraphStaticFallback";
import {
  SEVERITY_LABELS,
  enterpriseStatusTagClass,
  severityTagClass,
} from "@/lib/design-tokens";

const REPO_UI_ROOT = join(process.cwd());

describe("visual polish audit regressions (TB-535–TB-544)", () => {
  it("TB-535: warning/medium severity badges stay visually distinct from error/high", () => {
    const medium = severityTagClass("medium");
    const high = severityTagClass("high");

    expect(medium).not.toBe(high);
    expect(medium).toContain("amber");
    expect(high).toContain("--al-status-warn-bg");
  });

  it("TB-536: GraphStaticFallback uses evidence-trail copy without Sample language", () => {
    render(<GraphStaticFallback />);

    const fallback = screen.getByTestId("graph-static-fallback");

    expect(fallback).toHaveAttribute(
      "aria-label",
      "Evidence trail: context, primary finding, decisions, and finalized signed package",
    );
    expect(screen.getByText(/Evidence trail — the interactive graph appears once the viewer has loaded\./i)).toBeInTheDocument();
    expect(fallback.textContent?.toLowerCase()).not.toContain("sample");
  });

  it("TB-544: unclassified severity is labeled and styled as a data-gap tier", () => {
    expect(SEVERITY_LABELS.unknown).toBe("Unclassified");

    const unknown = severityTagClass("unknown");
    const low = severityTagClass("low");
    const neutral = enterpriseStatusTagClass("neutral");

    expect(unknown).toContain("border-dashed");
    expect(unknown).not.toBe(low);
    expect(unknown).not.toBe(neutral);
  });

  it("TB-543: FirstWeekRouteGuidance home variant does not use native details/summary", () => {
    const source = readFileSync(join(REPO_UI_ROOT, "src/components/FirstWeekRouteGuidance.tsx"), "utf8");

    expect(source).toContain("OperatorHomeDisclosureSection");
    expect(source).not.toMatch(/<details[\s>]/);
    expect(source).not.toMatch(/<summary[\s>]/);
  });
});
