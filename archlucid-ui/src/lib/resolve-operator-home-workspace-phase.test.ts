import { describe, expect, it } from "vitest";

import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import {
  resolveLatestArchitectureDraftHref,
  resolveOperatorHomeLifecycleEmphasizedPath,
  resolveOperatorHomePhaseHeroCopy,
  resolveOperatorHomeRequiresAttention,
  deriveOperatorHomeWorkspacePhaseSignalsFromOverviewRuns,
  resolveOperatorHomeWorkspacePhase,
} from "@/lib/resolve-operator-home-workspace-phase";
import type { RunSummary } from "@/types/authority";
import { buildDemoSeededOverviewRunSummary } from "@/lib/demo-seeded-overview";

const baseSignals = {
  hasWorkspaceReviews: false,
  hasOverviewReviewRows: false,
  draftCount: 0,
  hasCommittedManifest: false,
  openFindingsCount: 0,
  governanceWarningsCount: 0,
} as const;

describe("resolveOperatorHomeWorkspacePhase", () => {
  it("returns eval-empty when no reviews or drafts exist", () => {
    expect(resolveOperatorHomeWorkspacePhase(baseSignals)).toBe("eval-empty");
  });

  it("returns eval-with-drafts when drafts exist but no reviews", () => {
    expect(
      resolveOperatorHomeWorkspacePhase({
        ...baseSignals,
        draftCount: 2,
      }),
    ).toBe("eval-with-drafts");
  });

  it("keeps eval-empty when only overview showcase rows exist without tenant reviews (TB-1039)", () => {
    expect(
      resolveOperatorHomeWorkspacePhase({
        ...baseSignals,
        hasOverviewReviewRows: true,
      }),
    ).toBe("eval-empty");
  });

  it("keeps eval-with-drafts when drafts and showcase rows coexist without tenant reviews", () => {
    expect(
      resolveOperatorHomeWorkspacePhase({
        ...baseSignals,
        draftCount: 1,
        hasOverviewReviewRows: true,
      }),
    ).toBe("eval-with-drafts");
  });

  it("returns active-reviews when reviews exist without a committed manifest", () => {
    expect(
      resolveOperatorHomeWorkspacePhase({
        ...baseSignals,
        hasWorkspaceReviews: true,
        hasOverviewReviewRows: true,
      }),
    ).toBe("active-reviews");
  });

  it("returns operational only when committed manifest and workspace reviews both exist", () => {
    expect(
      resolveOperatorHomeWorkspacePhase({
        ...baseSignals,
        hasCommittedManifest: true,
      }),
    ).toBe("eval-empty");

    expect(
      resolveOperatorHomeWorkspacePhase({
        ...baseSignals,
        hasWorkspaceReviews: true,
        hasOverviewReviewRows: true,
        hasCommittedManifest: true,
      }),
    ).toBe("operational");
  });

  it("prefers operational over active-reviews when committed and occupied", () => {
    expect(
      resolveOperatorHomeWorkspacePhase({
        ...baseSignals,
        draftCount: 1,
        hasWorkspaceReviews: true,
        hasOverviewReviewRows: true,
        hasCommittedManifest: true,
      }),
    ).toBe("operational");
  });
});

describe("deriveOperatorHomeWorkspacePhaseSignalsFromOverviewRuns", () => {
  it("counts showcase rows toward overview occupancy while excluding them from tenant metrics", () => {
    const signals = deriveOperatorHomeWorkspacePhaseSignalsFromOverviewRuns(
      [buildDemoSeededOverviewRunSummary("default", null)],
      1,
    );

    expect(signals.hasOverviewReviewRows).toBe(true);
    expect(signals.openFindingsCount).toBe(0);
  });
});

describe("resolveOperatorHomeLifecycleEmphasizedPath", () => {
  it("emphasizes explore on eval-empty and review on active-reviews only", () => {
    expect(resolveOperatorHomeLifecycleEmphasizedPath("eval-empty")).toBe("explore-completed-review");
    expect(resolveOperatorHomeLifecycleEmphasizedPath("eval-with-drafts")).toBe("create-architecture");
    expect(resolveOperatorHomeLifecycleEmphasizedPath("active-reviews")).toBe("review-architecture");
    expect(resolveOperatorHomeLifecycleEmphasizedPath("operational")).toBeNull();
  });

  it("emphasizes review when the latest draft is already in intake", () => {
    expect(
      resolveOperatorHomeLifecycleEmphasizedPath("eval-with-drafts", {
        architectureId: "draft-001",
        displayName: "Vertex",
        customerStatus: "draft",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-02T00:00:00.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-01-02T00:00:00.000Z",
        serverDraftStatus: "Submitted",
      }),
    ).toBe("review-architecture");
  });
});

describe("resolveOperatorHomeRequiresAttention", () => {
  it("flags open findings and governance warnings", () => {
    expect(resolveOperatorHomeRequiresAttention(baseSignals)).toBe(false);
    expect(
      resolveOperatorHomeRequiresAttention({
        ...baseSignals,
        openFindingsCount: 1,
      }),
    ).toBe(true);
    expect(
      resolveOperatorHomeRequiresAttention({
        ...baseSignals,
        governanceWarningsCount: 1,
      }),
    ).toBe(true);
  });
});

describe("resolveOperatorHomePhaseHeroCopy", () => {
  it("uses draft-aware copy for eval-with-drafts", () => {
    const copy = resolveOperatorHomePhaseHeroCopy(
      "eval-with-drafts",
      {
        ...baseSignals,
        draftCount: 2,
      },
      "Vertex",
    );

    expect(copy.heading).toBe("Vertex");
    expect(copy.lead).toContain("2");
  });

  it("falls back to continue-architecture heading when the draft has no display name", () => {
    const copy = resolveOperatorHomePhaseHeroCopy("eval-with-drafts", {
      ...baseSignals,
      draftCount: 1,
    });

    expect(copy.heading).toBe("Continue your architecture");
  });

  it("uses past-drafting lead when the latest draft is already in intake", () => {
    const copy = resolveOperatorHomePhaseHeroCopy(
      "eval-with-drafts",
      {
        ...baseSignals,
        draftCount: 1,
      },
      "Vertex",
      {
        architectureId: "draft-001",
        displayName: "Vertex",
        customerStatus: "ready-for-review",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-02T00:00:00.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-01-02T00:00:00.000Z",
        serverDraftStatus: "Submitted",
      },
    );

    expect(copy.lead).toContain("Vertex");
    expect(copy.lead).toContain("review intake");
  });

  it("uses active-review copy when reviews are in flight", () => {
    const copy = resolveOperatorHomePhaseHeroCopy("active-reviews", {
      ...baseSignals,
      hasWorkspaceReviews: true,
      hasOverviewReviewRows: true,
    });

    expect(copy.heading).toBe("Reviews in progress");
    expect(copy.lead.length).toBeGreaterThan(0);
  });
});

describe("resolveLatestArchitectureDraftHref", () => {
  it("returns null for an empty registry", () => {
    expect(resolveLatestArchitectureDraftHref([])).toBeNull();
  });

  it("returns the newest draft workspace href", () => {
    const entries: ArchitectureDraftRegistryEntry[] = [
      {
        architectureId: "draft-001",
        displayName: "Claims intake",
        customerStatus: "draft",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-02T00:00:00.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-01-02T00:00:00.000Z",
      },
    ];

    expect(resolveLatestArchitectureDraftHref(entries)).toBe("/architecture/architectures/draft-001");
  });

  it("routes submitted drafts to scoped review intake", () => {
    const entries: ArchitectureDraftRegistryEntry[] = [
      {
        architectureId: "draft-001",
        displayName: "Vertex",
        customerStatus: "ready-for-review",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-02T00:00:00.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-01-02T00:00:00.000Z",
        serverDraftStatus: "Submitted",
      },
    ];

    expect(resolveLatestArchitectureDraftHref(entries)).toBe(
      "/architecture/reviews/new?path=guided-intake&sourceArchitectureId=draft-001",
    );
  });
});
