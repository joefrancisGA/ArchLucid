import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const recordShowcaseViewedMock = vi.fn();

vi.mock("@/lib/marketing/showcase-telemetry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/marketing/showcase-telemetry")>();

  return {
    ...actual,
    recordShowcaseViewed: (...args: unknown[]) => recordShowcaseViewedMock(...args),
  };
});

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

  it("records showcase_viewed with unknown scenario for whitespace run ids", () => {
    render(
      <ShowcasePageTelemetry runId="   " renderMode="static">
        <div>child</div>
      </ShowcasePageTelemetry>,
    );

    expect(recordShowcaseViewedMock).toHaveBeenCalledTimes(1);
    expect(recordShowcaseViewedMock).toHaveBeenCalledWith({
      scenario: "unknown",
      renderMode: "static",
    });
  });

  it("records showcase_viewed with the trimmed slug when percent-encoding in the run id is invalid", () => {
    render(
      <ShowcasePageTelemetry runId="claims%" renderMode="api">
        <div>child</div>
      </ShowcasePageTelemetry>,
    );

    expect(recordShowcaseViewedMock).toHaveBeenCalledTimes(1);
    expect(recordShowcaseViewedMock).toHaveBeenCalledWith({
      scenario: "claims%",
      renderMode: "api",
    });
  });
});
