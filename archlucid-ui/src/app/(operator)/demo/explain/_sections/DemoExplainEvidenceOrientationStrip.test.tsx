import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DemoExplainEvidenceOrientationStrip } from "@/app/(operator)/demo/explain/_sections/DemoExplainEvidenceOrientationStrip";
import {
  DEMO_EXPLAIN_CANONICAL_PATH,
  DEMO_EXPLAIN_SOURCES,
} from "@/lib/demo-explain-evidence-copy";

describe("DemoExplainEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking demo explain", () => {
    render(<DemoExplainEvidenceOrientationStrip />);

    expect(screen.getByTestId("demo-explain-sources")).toBeInTheDocument();
    expect(screen.getByTestId("demo-explain-claim-discipline")).toBeInTheDocument();

    for (const link of DEMO_EXPLAIN_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(DEMO_EXPLAIN_SOURCES.some((link) => link.href === DEMO_EXPLAIN_CANONICAL_PATH)).toBe(false);
  });
});
