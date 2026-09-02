import { readFileSync } from "node:fs";
import { join } from "node:path";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GovernanceFindingsQueueActiveFilterChips } from "@/components/governance/findings/GovernanceFindingsQueueActiveFilterChips";
import { EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS } from "@/lib/findings/findings-natural-language-filter";

describe("GovernanceFindingsQueueActiveFilterChips", () => {
  it("renders a search chip from findingsSearchQuery and clears on outline button", () => {
    const onClearAll = vi.fn();

    render(
      <GovernanceFindingsQueueActiveFilterChips
        registerFilter="all"
        jobView="all"
        nlFacets={EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS}
        jobViewFilterActive={false}
        findingsSearchQuery="payments"
        onClearAll={onClearAll}
      />,
    );

    expect(screen.getByTestId("governance-findings-active-filter-chip-search-query")).toHaveTextContent(
      'Search "payments"',
    );

    const clear = screen.getByRole("button", { name: "Clear all filters" });

    expect(clear).toHaveClass("border-neutral-300");
    fireEvent.click(clear);
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });
});

describe("GovernanceFindingsQueueToolbarSection wiring", () => {
  it("passes findingsSearchQuery into active-filter chips (not searchQuery)", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/(operator)/governance/findings/_sections/GovernanceFindingsQueueToolbarSection.tsx"),
      "utf8",
    );

    expect(source).toContain("findingsSearchQuery={props.findingsSearchQuery}");
    expect(source).not.toContain("searchQuery={props.findingsSearchQuery}");
  });
});
