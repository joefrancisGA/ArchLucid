import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: import("react").ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const inspectorUiEnv = vi.hoisted(() => ({
  buyerPolished: false,
  buyerChrome: false,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () =>
      inspectorUiEnv.buyerPolished ? true : actual.isBuyerPolishedOperatorShellEnv(),
    isBuyerSafeDemoMarketingChromeEnv: () =>
      inspectorUiEnv.buyerChrome ? true : actual.isBuyerSafeDemoMarketingChromeEnv(),
  };
});

import { RunInspectorPreview } from "./RunInspectorPreview";

import type { RunSummary } from "@/types/authority";

function showcaseRun(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    runId: "claims-intake-modernization",
    projectId: "default",
    description: "Claims Intake",
    createdUtc: "2026-01-15T12:00:00.000Z",
    hasFindingsSnapshot: true,
    hasGoldenManifest: true,
    hasArtifactBundle: true,
    hasGraphSnapshot: true,
    hasContextSnapshot: true,
    ...overrides,
  };
}

describe("RunInspectorPreview", () => {
  beforeEach(() => {
    inspectorUiEnv.buyerPolished = false;
    inspectorUiEnv.buyerChrome = false;
  });

  afterEach(() => {
    inspectorUiEnv.buyerPolished = false;
    inspectorUiEnv.buyerChrome = false;
  });

  it("buyer-polished showcase: primary manifest, workspace findings quick link, and no duplicate full-review CTA", () => {
    inspectorUiEnv.buyerPolished = true;
    inspectorUiEnv.buyerChrome = true;

    render(<RunInspectorPreview run={showcaseRun()} />);

    expect(screen.getByRole("link", { name: "View manifest summary" })).toHaveAttribute(
      "href",
      "/manifests/a1c2e3f4-a5b6-7890-abcd-ef1234567890",
    );
    fireEvent.click(screen.getByText("Next steps"));

    expect(screen.getByRole("link", { name: "Read-only walkthrough" })).toHaveAttribute(
      "href",
      "/showcase/claims-intake-modernization",
    );
    expect(screen.queryByRole("link", { name: "Full review detail" })).toBeNull();
    expect(screen.getByRole("link", { name: "Findings" })).toHaveAttribute(
      "href",
      "/reviews/claims-intake-modernization#run-explanation",
    );
    expect(screen.getByRole("link", { name: "Timeline" })).toHaveAttribute(
      "href",
      "/reviews/claims-intake-modernization#pipeline-timeline",
    );
  });

  it("non-polished showcase with buyer chrome keeps walkthrough targets under more actions", () => {
    inspectorUiEnv.buyerChrome = true;

    render(<RunInspectorPreview run={showcaseRun()} />);

    fireEvent.click(screen.getByText("▸ More actions"));
    expect(screen.getByRole("link", { name: "Primary finding" })).toHaveAttribute(
      "href",
      "/showcase/claims-intake-modernization",
    );
    expect(screen.getByRole("link", { name: "Timeline (walkthrough)" })).toHaveAttribute(
      "href",
      "/showcase/claims-intake-modernization",
    );
  });
});
