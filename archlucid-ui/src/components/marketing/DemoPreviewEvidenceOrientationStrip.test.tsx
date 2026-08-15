import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DemoPreviewEvidenceOrientationStrip } from "@/components/marketing/DemoPreviewEvidenceOrientationStrip";
import {
  DEMO_PREVIEW_CANONICAL_PATH,
  DEMO_PREVIEW_SOURCES,
} from "@/lib/demo-preview-evidence-copy";

describe("DemoPreviewEvidenceOrientationStrip", () => {
  it("lists evaluation Sources without self-linking demo preview", () => {
    render(<DemoPreviewEvidenceOrientationStrip />);

    expect(screen.getByTestId("demo-preview-sources")).toBeInTheDocument();
    expect(screen.getByTestId("demo-preview-claim-discipline")).toHaveTextContent(
      /Sample demo|CPA SOC 2|third-party pen/i,
    );

    const sources = screen.getByTestId("demo-preview-sources");

    for (const link of DEMO_PREVIEW_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(DEMO_PREVIEW_SOURCES.some((link) => link.href === DEMO_PREVIEW_CANONICAL_PATH)).toBe(false);
  });
});
