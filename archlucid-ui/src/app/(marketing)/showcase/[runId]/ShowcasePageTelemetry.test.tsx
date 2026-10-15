import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const recordShowcaseViewedMock = vi.fn();

vi.mock("@/lib/marketing/showcase-telemetry", () => ({
  recordShowcaseViewed: (...args: unknown[]) => recordShowcaseViewedMock(...args),
  resolveShowcaseScenarioSlug: (runId: string) => runId,
}));

import { ShowcasePageTelemetry } from "@/app/(marketing)/showcase/[runId]/ShowcasePageTelemetry";

describe("ShowcasePageTelemetry", () => {
  beforeEach(() => {
    recordShowcaseViewedMock.mockClear();
  });

  it("records showcase_viewed once per run even when renderMode changes", () => {
    const { rerender } = render(
      <ShowcasePageTelemetry runId="claims-intake-modernization" renderMode="api">
        <div>child</div>
      </ShowcasePageTelemetry>,
    );

    rerender(
      <ShowcasePageTelemetry runId="claims-intake-modernization" renderMode="api_fallback">
        <div>child</div>
      </ShowcasePageTelemetry>,
    );

    expect(recordShowcaseViewedMock).toHaveBeenCalledTimes(1);
    expect(recordShowcaseViewedMock).toHaveBeenCalledWith({
      scenario: "claims-intake-modernization",
      renderMode: "api",
    });
  });
});
