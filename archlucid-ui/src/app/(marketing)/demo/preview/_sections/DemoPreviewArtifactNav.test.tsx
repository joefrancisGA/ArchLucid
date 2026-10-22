import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DemoPreviewArtifactNav } from "./DemoPreviewArtifactNav";

describe("DemoPreviewArtifactNav", () => {
  let observerCallback: IntersectionObserverCallback | null = null;

  afterEach(() => {
    observerCallback = null;
    vi.unstubAllGlobals();
    document.body.replaceChildren();
  });

  it("keeps the most visible section active when a later observer callback reports only another section", () => {
    class IntersectionObserverMock {
      public constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }

      public observe(): void {}

      public disconnect(): void {}
    }

    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);

    for (const id of [
      "artifact-sponsor-report",
      "artifact-signed-review-record",
      "artifact-evidence-graph",
      "artifact-governance-approval",
      "artifact-audit-trail",
    ]) {
      const section = document.createElement("div");
      section.id = id;
      document.body.appendChild(section);
    }

    render(<DemoPreviewArtifactNav />);

    const emit = (entries: Array<{ id: string; ratio: number }>): void => {
      act(() => {
        observerCallback?.(
          entries.map(({ id, ratio }) => ({
            target: document.getElementById(id),
            isIntersecting: ratio > 0,
            intersectionRatio: ratio,
          })) as unknown as IntersectionObserverEntry[],
          {} as IntersectionObserver,
        );
      });
    };

    emit([
      { id: "artifact-evidence-graph", ratio: 0.8 },
      { id: "artifact-governance-approval", ratio: 0.2 },
    ]);
    expect(screen.getByTestId("demo-preview-artifact-nav-artifact-evidence-graph")).toHaveAttribute(
      "aria-current",
      "true",
    );

    emit([{ id: "artifact-governance-approval", ratio: 0.3 }]);

    expect(screen.getByTestId("demo-preview-artifact-nav-artifact-evidence-graph")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });
});
