import { describe, expect, it, vi } from "vitest";

import { resolveOperatorHomeResumeAffordancePlan } from "@/lib/operator/operator-home-resume-affordance";
import * as continueLastArchitectureIdentity from "@/lib/resolve-continue-last-architecture-identity";
import * as continueLastReviewPackage from "@/lib/resolve-continue-last-review-package";
import * as unfinishedWorkRail from "@/lib/unfinished-work-rail";
import { OPERATOR_RECENT_VIEWS_STORAGE_KEY } from "@/lib/operator/operator-recent-views";
import type { RunSummary } from "@/types/authority";

describe("resolveOperatorHomeResumeAffordancePlan", () => {
  it("suppresses continue-last when rail row id encodes the run id but href does not parse a run", () => {
    vi.spyOn(continueLastReviewPackage, "resolveContinueLastReviewPackageTarget").mockReturnValue({
      runId: "review-42",
      label: "Payments platform",
      href: "/architecture/reviews/review-42",
      visitedAtUtc: "2026-01-15T12:00:00.000Z",
    });

    vi.spyOn(unfinishedWorkRail, "summarizeUnfinishedWorkRailItems").mockReturnValue({
      items: [
        {
          id: "review-in-progress:review-42",
          kind: "review-in-progress",
          title: "Payments platform",
          href: "/architecture/reviews/new",
          statusLabel: "In progress",
          updatedUtc: null,
          workTypeLabel: "Architecture review",
          activityLabel: null,
          actionLabel: "Continue",
        },
      ],
      totalCount: 1,
      truncated: false,
    });

    const plan = resolveOperatorHomeResumeAffordancePlan({
      runs: [],
      drafts: [],
      incompleteWizards: [],
    });

    expect(plan.showContinueLast).toBe(false);
    vi.restoreAllMocks();
  });

  it("suppresses continue-last when target href encodes the rail run id but runId field is stale", () => {
    vi.spyOn(continueLastReviewPackage, "resolveContinueLastReviewPackageTarget").mockReturnValue({
      runId: "stale-run-id",
      label: "Payments platform",
      href: "/architecture/architectures/architecture-identity-001?highlightReviewId=review-42",
      visitedAtUtc: "2026-01-15T12:00:00.000Z",
    });

    vi.spyOn(unfinishedWorkRail, "summarizeUnfinishedWorkRailItems").mockReturnValue({
      items: [
        {
          id: "review-in-progress:review-42",
          kind: "review-in-progress",
          title: "Payments platform",
          href: "/architecture/reviews/review-42",
          statusLabel: "In progress",
          updatedUtc: null,
          workTypeLabel: "Architecture review",
          activityLabel: null,
          actionLabel: "Continue",
        },
      ],
      totalCount: 1,
      truncated: false,
    });

    const plan = resolveOperatorHomeResumeAffordancePlan({
      runs: [],
      drafts: [],
      incompleteWizards: [],
      workingMode: true,
    });

    expect(plan.showContinueLast).toBe(false);
    vi.restoreAllMocks();
  });

  it("keeps continue-last when rail desk highlightReviewId differs from continue target", () => {
    vi.spyOn(continueLastReviewPackage, "resolveContinueLastReviewPackageTarget").mockReturnValue({
      runId: "review-a",
      label: "Payments platform",
      href: "/architecture/architectures/architecture-identity-001?highlightReviewId=review-a",
      visitedAtUtc: "2026-01-15T12:00:00.000Z",
    });

    vi.spyOn(unfinishedWorkRail, "summarizeUnfinishedWorkRailItems").mockReturnValue({
      items: [
        {
          id: "review-in-progress:review-b",
          kind: "review-in-progress",
          title: "Other review",
          href: "/architecture/architectures/architecture-identity-001?highlightReviewId=review-b",
          statusLabel: "In progress",
          updatedUtc: null,
          workTypeLabel: "Architecture review",
          activityLabel: null,
          actionLabel: "Continue",
        },
      ],
      totalCount: 1,
      truncated: false,
    });

    const plan = resolveOperatorHomeResumeAffordancePlan({
      runs: [],
      drafts: [],
      incompleteWizards: [],
      workingMode: true,
    });

    expect(plan.showContinueLast).toBe(true);
    vi.restoreAllMocks();
  });

  it("suppresses continue-last when rail href matches target href aside from trailing slash", () => {
    vi.spyOn(continueLastReviewPackage, "resolveContinueLastReviewPackageTarget").mockReturnValue({
      runId: "review-42-mismatch",
      label: "Payments platform",
      href: "/architecture/reviews/review-42",
      visitedAtUtc: "2026-01-15T12:00:00.000Z",
    });

    vi.spyOn(unfinishedWorkRail, "summarizeUnfinishedWorkRailItems").mockReturnValue({
      items: [
        {
          id: "review-in-progress:review-42",
          kind: "review-in-progress",
          title: "Payments platform",
          href: "/architecture/reviews/review-42/",
          statusLabel: "In progress",
          updatedUtc: null,
          workTypeLabel: "Architecture review",
          activityLabel: null,
          actionLabel: "Continue",
        },
      ],
      totalCount: 1,
      truncated: false,
    });

    const plan = resolveOperatorHomeResumeAffordancePlan({
      runs: [],
      drafts: [],
      incompleteWizards: [],
    });

    expect(plan.showContinueLast).toBe(false);
    vi.restoreAllMocks();
  });

  it("suppresses continue-last when target run id matches rail run id aside from surrounding whitespace", () => {
    const runs: RunSummary[] = [
      {
        runId: "review-42",
        projectId: "default",
        description: "Payments platform",
        hasFindingsSnapshot: true,
      },
    ];

    vi.spyOn(continueLastReviewPackage, "resolveContinueLastReviewPackageTarget").mockReturnValue({
      runId: " review-42 ",
      label: "Payments platform",
      href: "/architecture/reviews/review-42",
      visitedAtUtc: "2026-01-15T12:00:00.000Z",
    });

    const plan = resolveOperatorHomeResumeAffordancePlan({
      runs,
      drafts: [],
      incompleteWizards: [],
    });

    expect(plan.showContinueLast).toBe(false);
    vi.restoreAllMocks();
  });

  it("suppresses continue-last when unfinished work already surfaces the same review", () => {
    const runs: RunSummary[] = [
      {
        runId: "review-42",
        projectId: "default",
        description: "Payments platform",
        hasFindingsSnapshot: true,
      },
    ];

    window.localStorage.setItem(
      OPERATOR_RECENT_VIEWS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        entries: [
          {
            kind: "review",
            href: "/architecture/reviews/review-42",
            label: "Payments platform",
            visitedAtUtc: "2026-01-15T12:00:00.000Z",
          },
        ],
      }),
    );

    const plan = resolveOperatorHomeResumeAffordancePlan({
      runs,
      drafts: [],
      incompleteWizards: [],
    });

    expect(plan.showContinueLast).toBe(false);
    expect(plan.continueLastVariant).toBe("outline");
    expect(plan.continueLastKind).toBeNull();
  });

  it("demotes continue-last to outline when unfinished work rail has items (LS-08)", () => {
    const runs: RunSummary[] = [
      {
        runId: "review-42",
        projectId: "default",
        description: "Payments platform",
        hasFindingsSnapshot: true,
        hasGoldenManifest: true,
      },
    ];

    window.localStorage.setItem(
      OPERATOR_RECENT_VIEWS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        entries: [
          {
            kind: "review",
            href: "/architecture/reviews/review-42",
            label: "Payments platform",
            visitedAtUtc: "2026-01-15T12:00:00.000Z",
          },
        ],
      }),
    );

    const plan = resolveOperatorHomeResumeAffordancePlan({
      runs,
      drafts: [],
      incompleteWizards: [
        {
          wizardId: "reviews-new-guided-questions",
          stepIndex: 1,
          savedAtUtc: "2026-01-15T12:00:00.000Z",
        },
      ],
    });

    expect(plan.showContinueLast).toBe(true);
    expect(plan.continueLastVariant).toBe("outline");
    expect(plan.continueLastKind).toBe("review");
  });

  it("keeps continue-last as the sole primary when no competing unfinished work exists (LS-08)", () => {
    const runs: RunSummary[] = [
      {
        runId: "review-42",
        projectId: "default",
        description: "Payments platform",
        hasFindingsSnapshot: true,
        hasGoldenManifest: true,
      },
    ];

    window.localStorage.setItem(
      OPERATOR_RECENT_VIEWS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        entries: [
          {
            kind: "review",
            href: "/architecture/reviews/review-42",
            label: "Payments platform",
            visitedAtUtc: "2026-01-15T12:00:00.000Z",
          },
        ],
      }),
    );

    const plan = resolveOperatorHomeResumeAffordancePlan({
      runs,
      drafts: [],
      incompleteWizards: [],
    });

    expect(plan.showContinueLast).toBe(true);
    expect(plan.continueLastVariant).toBe("primary");
    expect(plan.continueLastKind).toBe("review");
  });

  it("suppresses architecture continue-last when rail href carries the target architecture id", () => {
    vi.spyOn(continueLastArchitectureIdentity, "resolveContinueLastArchitectureIdentityTarget").mockReturnValue({
      architectureId: "architecture-identity-001",
      label: "Payments platform",
      href: "/architecture/architectures/stale-path",
      visitedAtUtc: "2026-01-15T12:00:00.000Z",
    });

    vi.spyOn(continueLastReviewPackage, "resolveContinueLastReviewPackageTarget").mockReturnValue(null);

    vi.spyOn(unfinishedWorkRail, "summarizeUnfinishedWorkRailItems").mockReturnValue({
      items: [
        {
          id: "architecture-draft:draft-001",
          kind: "architecture-draft",
          title: "Payments platform",
          href: "/architecture/architectures/architecture-identity-001",
          statusLabel: "Draft",
          updatedUtc: null,
          workTypeLabel: "Architecture draft",
          activityLabel: null,
          actionLabel: "Continue",
        },
      ],
      totalCount: 1,
      truncated: false,
    });

    const plan = resolveOperatorHomeResumeAffordancePlan({
      runs: [],
      drafts: [],
      incompleteWizards: [],
      workingMode: true,
    });

    expect(plan.showContinueLast).toBe(false);
    vi.restoreAllMocks();
  });

  it("suppresses architecture continue-last when rail href matches target aside from trailing slash", () => {
    vi.spyOn(continueLastArchitectureIdentity, "resolveContinueLastArchitectureIdentityTarget").mockReturnValue({
      architectureId: "architecture-identity-001",
      label: "Payments platform",
      href: "/architecture/architectures/architecture-identity-001",
      visitedAtUtc: "2026-01-15T12:00:00.000Z",
    });

    vi.spyOn(continueLastReviewPackage, "resolveContinueLastReviewPackageTarget").mockReturnValue(null);

    vi.spyOn(unfinishedWorkRail, "summarizeUnfinishedWorkRailItems").mockReturnValue({
      items: [
        {
          id: "architecture-draft:architecture-identity-001",
          kind: "architecture-draft",
          title: "Payments platform",
          href: "/architecture/architectures/architecture-identity-001/",
          statusLabel: "Draft",
          updatedUtc: null,
          workTypeLabel: "Architecture draft",
          activityLabel: null,
          actionLabel: "Continue",
        },
      ],
      totalCount: 1,
      truncated: false,
    });

    const plan = resolveOperatorHomeResumeAffordancePlan({
      runs: [],
      drafts: [],
      incompleteWizards: [],
      workingMode: true,
    });

    expect(plan.showContinueLast).toBe(false);
    vi.restoreAllMocks();
  });

  it("CA-37: prefers architecture identity continue-last in Working mode", () => {
    window.localStorage.setItem("archlucid.lastOpenArchitectureId.v1", "architecture-identity-001");
    window.localStorage.setItem(
      OPERATOR_RECENT_VIEWS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        entries: [
          {
            kind: "architecture",
            href: "/architecture/architectures/architecture-identity-001",
            label: "Payments platform",
            architectureId: "architecture-identity-001",
            visitedAtUtc: "2026-01-15T12:00:00.000Z",
          },
          {
            kind: "review",
            href: "/architecture/reviews/review-42",
            label: "Payments review",
            visitedAtUtc: "2026-01-14T12:00:00.000Z",
          },
        ],
      }),
    );

    const plan = resolveOperatorHomeResumeAffordancePlan({
      runs: [
        {
          runId: "review-42",
          projectId: "default",
          description: "Payments review",
          hasFindingsSnapshot: true,
        },
      ],
      drafts: [],
      incompleteWizards: [],
      workingMode: true,
    });

    expect(plan.showContinueLast).toBe(true);
    expect(plan.continueLastKind).toBe("architecture");
  });
});
