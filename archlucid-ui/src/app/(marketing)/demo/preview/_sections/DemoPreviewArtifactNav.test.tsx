import { act, fireEvent, render, screen } from "@testing-library/react";
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

  it("does not throw when artifact section is removed before nav click", () => {
    class IntersectionObserverMock {
      public constructor(_callback: IntersectionObserverCallback) {}

      public observe(): void {}

      public disconnect(): void {}
    }

    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);

    const section = document.createElement("div");
    section.id = "artifact-sponsor-report";
    document.body.appendChild(section);

    render(<DemoPreviewArtifactNav />);

    const scrollIntoView = vi.fn();
    section.scrollIntoView = scrollIntoView;
    document.body.removeChild(section);

    fireEvent.click(screen.getByTestId("demo-preview-artifact-nav-artifact-sponsor-report"));

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("keeps aria-current on the prior section when a nav click targets a removed section", () => {
    class IntersectionObserverMock {
      public constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }

      public observe(): void {}

      public disconnect(): void {}
    }

    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);

    const activeSection = document.createElement("div");
    activeSection.id = "artifact-evidence-graph";
    document.body.appendChild(activeSection);

    render(<DemoPreviewArtifactNav />);

    act(() => {
      observerCallback?.(
        [
          {
            target: activeSection,
            isIntersecting: true,
            intersectionRatio: 0.9,
          },
        ] as unknown as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      );
    });

    expect(screen.getByTestId("demo-preview-artifact-nav-artifact-evidence-graph")).toHaveAttribute(
      "aria-current",
      "true",
    );

    document.body.removeChild(activeSection);

    fireEvent.click(screen.getByTestId("demo-preview-artifact-nav-artifact-evidence-graph"));

    expect(screen.getByTestId("demo-preview-artifact-nav-artifact-evidence-graph")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("moves aria-current when the observer reports the prior active section left the viewport", () => {
    class IntersectionObserverMock {
      public constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }

      public observe(): void {}

      public disconnect(): void {}
    }

    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);

    const formerActive = document.createElement("div");
    formerActive.id = "artifact-evidence-graph";
    const nextActive = document.createElement("div");
    nextActive.id = "artifact-governance-approval";
    document.body.append(formerActive, nextActive);

    render(<DemoPreviewArtifactNav />);

    const emit = (entries: Array<{ id: string; ratio: number; intersecting: boolean }>): void => {
      act(() => {
        observerCallback?.(
          entries.map(({ id, ratio, intersecting }) => ({
            target: document.getElementById(id),
            isIntersecting: intersecting,
            intersectionRatio: ratio,
          })) as unknown as IntersectionObserverEntry[],
          {} as IntersectionObserver,
        );
      });
    };

    emit([{ id: "artifact-evidence-graph", ratio: 0.9, intersecting: true }]);
    expect(screen.getByTestId("demo-preview-artifact-nav-artifact-evidence-graph")).toHaveAttribute(
      "aria-current",
      "true",
    );

    emit([
      { id: "artifact-evidence-graph", ratio: 0, intersecting: false },
      { id: "artifact-governance-approval", ratio: 0.7, intersecting: true },
    ]);

    expect(screen.getByTestId("demo-preview-artifact-nav-artifact-governance-approval")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("marks the clicked artifact nav button active when scrollIntoView runs", () => {
    class IntersectionObserverMock {
      public constructor(_callback: IntersectionObserverCallback) {}

      public observe(): void {}

      public disconnect(): void {}
    }

    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);

    const target = document.createElement("div");
    target.id = "artifact-governance-approval";
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);

    render(<DemoPreviewArtifactNav />);

    fireEvent.click(screen.getByTestId("demo-preview-artifact-nav-artifact-governance-approval"));

    expect(screen.getByTestId("demo-preview-artifact-nav-artifact-governance-approval")).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(target.scrollIntoView).toHaveBeenCalled();
  });
});
