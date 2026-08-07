import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DemoReadinessEvidenceOrientationStrip } from "@/app/(operator)/admin/demo-readiness/_sections/DemoReadinessEvidenceOrientationStrip";
import {
  DEMO_READINESS_CANONICAL_PATH,
  DEMO_READINESS_SOURCES,
} from "@/lib/demo-readiness-evidence-copy";

describe("DemoReadinessEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking demo readiness", () => {
    render(<DemoReadinessEvidenceOrientationStrip />);

    expect(screen.getByTestId("demo-readiness-sources")).toBeInTheDocument();
    expect(screen.getByTestId("demo-readiness-claim-discipline")).toBeInTheDocument();

    for (const link of DEMO_READINESS_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(DEMO_READINESS_SOURCES.some((link) => link.href === DEMO_READINESS_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
