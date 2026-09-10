import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SHOWCASE_STATIC_DEMO_MANIFEST_ID } from "@/lib/showcase-static-demo";
import {
  buyerPolishedShellVitestOverride,
  extendBuyerPolishedShellVitestMock,
} from "@/testing/buyer-polished-shell-vitest-override";

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

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const buyerChromeForced = vi.hoisted(() => ({ on: false as boolean }));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const extended = await extendBuyerPolishedShellVitestMock(importOriginal);
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...extended,
    isBuyerSafeDemoMarketingChromeEnv: () =>
      buyerChromeForced.on ? true : actual.isBuyerSafeDemoMarketingChromeEnv(),
  };
});

import { RunInspectorPreview } from "@/components/runs/RunInspectorPreview";

import type { RunSummary } from "@/types/authority";

function showcaseRun(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    runId: "customer-intake-modernization",
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
    buyerPolishedShellVitestOverride.value = false;
    buyerChromeForced.on = false;
  });

  afterEach(() => {
    buyerPolishedShellVitestOverride.value = null;
    buyerChromeForced.on = false;
  });

  it("buyer-polished showcase: primary manifest, workspace findings quick link, and no duplicate full-review CTA", () => {
    buyerPolishedShellVitestOverride.value = true;
    buyerChromeForced.on = true;

    render(<RunInspectorPreview run={showcaseRun()} />);

    expect(screen.getByText("Decision: Package finalized")).toBeInTheDocument();
    expect(screen.getByText("Risks reviewed")).toBeInTheDocument();

    const proofSummary = screen.getByTestId("run-inspector-showcase-proof-summary");
    const emphasizedLabels = proofSummary.querySelectorAll(".font-medium");

    expect(Array.from(emphasizedLabels).map((node) => node.textContent)).toEqual(
      expect.arrayContaining([
        "Approval:",
        "Remaining monitored risk:",
        "Evidence graph:",
        "Audit trail:",
      ]),
    );
    expect(proofSummary.textContent).toMatch(/Audit trail:\s*Complete/);

    expect(screen.queryByRole("link", { name: "Open approved package" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Related actions"));
    expect(screen.getByRole("link", { name: "View finalized record" })).toHaveAttribute(
      "href",
      `/governance/sealed-records/${SHOWCASE_STATIC_DEMO_MANIFEST_ID}`,
    );
    expect(screen.getByRole("link", { name: "View evidence graph" })).toHaveAttribute(
      "href",
      "/insights/evidence-graph?runId=customer-intake-modernization",
    );
    expect(screen.getByRole("link", { name: "View approval" })).toHaveAttribute(
      "href",
      "/governance/approval-queue?runId=customer-intake-modernization",
    );
    expect(screen.getByRole("link", { name: "View audit trail" })).toHaveAttribute(
      "href",
      "/governance/audit?runId=customer-intake-modernization",
    );
    expect(screen.getByRole("link", { name: "Ask about this review" })).toHaveAttribute(
      "href",
      "/insights/ask-review-questions?runId=customer-intake-modernization",
    );
    fireEvent.click(screen.getByText("Open specific artifact"));

    expect(screen.getByRole("link", { name: "Sponsor report" })).toHaveAttribute(
      "href",
      "/architecture/reviews/customer-intake-modernization",
    );
    expect(screen.getByRole("link", { name: "Read-only walkthrough" })).toHaveAttribute(
      "href",
      "/showcase/customer-intake-modernization",
    );
    expect(screen.queryByRole("link", { name: "Full review detail" })).toBeNull();
    expect(screen.getByRole("link", { name: "Findings" })).toHaveAttribute(
      "href",
      "/architecture/reviews/customer-intake-modernization#run-explanation",
    );
    expect(screen.getByRole("link", { name: "Timeline" })).toHaveAttribute(
      "href",
      "/architecture/reviews/customer-intake-modernization#pipeline-timeline",
    );
  });

  it("non-polished showcase with buyer chrome keeps walkthrough targets under more actions", () => {
    buyerChromeForced.on = true;

    render(<RunInspectorPreview run={showcaseRun()} />);

    fireEvent.click(screen.getByText("▸ More actions"));
    expect(screen.getByRole("link", { name: "Primary finding" })).toHaveAttribute(
      "href",
      "/showcase/customer-intake-modernization",
    );
    expect(screen.getByRole("link", { name: "Timeline (walkthrough)" })).toHaveAttribute(
      "href",
      "/showcase/customer-intake-modernization",
    );
  });
});
