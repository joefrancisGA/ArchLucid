import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeferredChunkLoading } from "./deferred-chunk-loading";

describe("DeferredChunkLoading", () => {
  it("renders an accessible status placeholder with the canonical surface", () => {
    render(<DeferredChunkLoading label="Loading sample section" testId="sample-deferred-loading" />);

    const placeholder = screen.getByTestId("sample-deferred-loading");

    expect(placeholder).toHaveAttribute("role", "status");
    expect(placeholder).toHaveAttribute("aria-label", "Loading sample section");
    expect(placeholder.className).toContain("min-h-24");
    expect(placeholder.className).toContain("animate-pulse");
  });

  it("applies compact and panel variants", () => {
    const { rerender } = render(
      <DeferredChunkLoading label="Loading compact" variant="compact" testId="compact-deferred-loading" />,
    );

    expect(screen.getByTestId("compact-deferred-loading").className).toContain("min-h-16");

    rerender(<DeferredChunkLoading label="Loading panel" variant="panel" testId="panel-deferred-loading" />);

    expect(screen.getByTestId("panel-deferred-loading").className).toContain("h-32");
  });
});
