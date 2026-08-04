import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DemoEntryEvidenceOrientationStrip } from "@/components/cto-demo/DemoEntryEvidenceOrientationStrip";
import {
  DEMO_ENTRY_CANONICAL_PATH,
  DEMO_ENTRY_CLAIM_DISCIPLINE,
  DEMO_ENTRY_SOURCES,
  DEMO_ENTRY_SOURCES_INTRO,
} from "@/lib/demo-entry-evidence-copy";

describe("DemoEntryEvidenceOrientationStrip", () => {
  it("renders Sources and claim-discipline chrome", () => {
    render(<DemoEntryEvidenceOrientationStrip />);

    expect(screen.getByTestId("demo-entry-sources")).toBeInTheDocument();
    expect(screen.getByTestId("demo-entry-claim-discipline")).toBeInTheDocument();
    expect(screen.getByText(DEMO_ENTRY_SOURCES_INTRO)).toBeInTheDocument();
    expect(screen.getByText(DEMO_ENTRY_CLAIM_DISCIPLINE)).toBeInTheDocument();

    for (const link of DEMO_ENTRY_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(DEMO_ENTRY_SOURCES.some((link) => link.href === DEMO_ENTRY_CANONICAL_PATH)).toBe(false);
  });
});
