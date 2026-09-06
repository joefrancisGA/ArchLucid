import { describe, expect, it } from "vitest";

import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import {
  buildUnfinishedWorkRailItems,
  UNFINISHED_WORK_RAIL_STATUS_LABELS,
  type IncompleteWizardSignal,
} from "@/lib/unfinished-work-rail";
import { WIZARD_SESSION_IDS } from "@/lib/wizard-session-persistence";
import type { RunSummary } from "@/types/authority";

function draft(
  overrides: Partial<ArchitectureDraftRegistryEntry> & Pick<ArchitectureDraftRegistryEntry, "draftId">,
): ArchitectureDraftRegistryEntry {
  return {
    draftId: overrides.draftId,
    displayName: overrides.displayName ?? "Payments edge",
    customerStatus: overrides.customerStatus ?? "draft",
    ownerLabel: overrides.ownerLabel ?? "You",
    lastUpdatedUtc: overrides.lastUpdatedUtc ?? "2026-08-10T12:00:00Z",
    linkedReviewId: overrides.linkedReviewId ?? null,
    serverUpdatedUtc: overrides.serverUpdatedUtc ?? "2026-08-10T12:00:00Z",
  };
}

function run(
  overrides: Partial<RunSummary> & Pick<RunSummary, "runId">,
): RunSummary {
  return {
    runId: overrides.runId,
    projectId: overrides.projectId ?? "default",
    createdUtc: overrides.createdUtc ?? "2026-08-10T11:00:00Z",
    description: overrides.description ?? "Claims modernization",
    hasFindingsSnapshot: overrides.hasFindingsSnapshot,
    hasGoldenManifest: overrides.hasGoldenManifest,
    hasGovernanceWarnings: overrides.hasGovernanceWarnings,
    demoSeededOverviewInject: overrides.demoSeededOverviewInject,
    isArchived: overrides.isArchived,
  } as RunSummary;
}

describe("buildUnfinishedWorkRailItems (TB-2209)", () => {
  it("returns empty when nothing unfinished", () => {
    expect(
      buildUnfinishedWorkRailItems({
        drafts: [],
        runs: [run({ runId: "done-1", hasGoldenManifest: true, hasFindingsSnapshot: true })],
        incompleteWizards: [],
      }),
    ).toEqual([]);
  });

  it("maps architecture drafts with draft status", () => {
    const items = buildUnfinishedWorkRailItems({
      drafts: [draft({ draftId: "arch-1", displayName: "Retail API" })],
      runs: [],
      incompleteWizards: [],
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      kind: "architecture-draft",
      title: "Retail API",
      href: "/architecture/architectures/arch-1",
      statusLabel: UNFINISHED_WORK_RAIL_STATUS_LABELS["architecture-draft"],
    });
  });

  it("skips archived drafts", () => {
    const items = buildUnfinishedWorkRailItems({
      drafts: [draft({ draftId: "arch-archived", customerStatus: "archived" })],
      runs: [],
      incompleteWizards: [],
    });

    expect(items).toEqual([]);
  });

  it("uses a short normalized title for architecture review packet descriptions", () => {
    const architectureReviewPacketDescription = [
      "> **Reviewed:** 2026-07-26",
      "# Architecture Review Packet: B2B SaaS Tenant Migration Platform",
      "**Classification:** Synthetic sanitized packet.",
      "Domain: Multi-tenant SaaS / tenant migration / audit exports.",
    ].join("\n\n");

    const items = buildUnfinishedWorkRailItems({
      drafts: [],
      runs: [
        run({
          runId: "tenant-migration-run",
          description: architectureReviewPacketDescription,
          hasFindingsSnapshot: false,
          hasGoldenManifest: false,
        }),
      ],
      incompleteWizards: [],
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe("Architecture Review Packet: B2B SaaS Tenant Migration Platform");
  });

  it("classifies mid-execute vs awaiting disposition", () => {
    const items = buildUnfinishedWorkRailItems({
      drafts: [],
      runs: [
        run({
          runId: "mid-1",
          description: "Mid execute review",
          hasFindingsSnapshot: false,
          hasGoldenManifest: false,
          createdUtc: "2026-08-10T10:00:00Z",
        }),
        run({
          runId: "await-1",
          description: "Needs disposition",
          hasFindingsSnapshot: true,
          hasGoldenManifest: false,
          createdUtc: "2026-08-10T12:00:00Z",
        }),
      ],
      incompleteWizards: [],
    });

    expect(items.map((item) => item.kind)).toEqual(["awaiting-disposition", "review-in-progress"]);
    expect(items[0]?.href).toBe("/architecture/reviews/await-1");
    expect(items[0]?.statusLabel).toBe(UNFINISHED_WORK_RAIL_STATUS_LABELS["awaiting-disposition"]);
    expect(items[1]?.statusLabel).toBe(UNFINISHED_WORK_RAIL_STATUS_LABELS["review-in-progress"]);
  });

  it("excludes showcase and demo-seeded runs", () => {
    const items = buildUnfinishedWorkRailItems({
      drafts: [],
      runs: [
        run({
          runId: "customer-intake-modernization",
          hasFindingsSnapshot: false,
          hasGoldenManifest: false,
        }),
        run({
          runId: "seeded-1",
          hasFindingsSnapshot: false,
          hasGoldenManifest: false,
          demoSeededOverviewInject: true,
        }),
      ],
      incompleteWizards: [],
    });

    expect(items).toEqual([]);
  });

  it("includes incomplete wizard sessions with resume hrefs", () => {
    const wizards: IncompleteWizardSignal[] = [
      {
        wizardId: WIZARD_SESSION_IDS.reviewsNewGuidedQuestions,
        stepIndex: 1,
        savedAtUtc: "2026-08-10T09:00:00Z",
      },
    ];

    const items = buildUnfinishedWorkRailItems({
      drafts: [],
      runs: [],
      incompleteWizards: wizards,
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      kind: "incomplete-wizard",
      href: "/architecture/reviews/new?path=guided-intake",
      statusLabel: UNFINISHED_WORK_RAIL_STATUS_LABELS["incomplete-wizard"],
    });
  });

  it("excludes spawned drafts that already have a linked review", () => {
    const items = buildUnfinishedWorkRailItems({
      drafts: [
        draft({
          draftId: "arch-spawned",
          displayName: "Vertex 2",
          linkedReviewId: "run-mid",
          customerStatus: "ready-for-review",
        }),
      ],
      runs: [
        run({
          runId: "run-mid",
          description: "Vertex 2 review",
          hasFindingsSnapshot: false,
          hasGoldenManifest: false,
        }),
      ],
      incompleteWizards: [],
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      kind: "review-in-progress",
      title: "Vertex 2 review",
    });
  });

  it("collapses draft rows that duplicate an active review title", () => {
    const items = buildUnfinishedWorkRailItems({
      drafts: [
        draft({
          draftId: "arch-1",
          displayName: "ArchLucid",
          customerStatus: "ready-for-review",
        }),
      ],
      runs: [
        run({
          runId: "run-mid",
          description: "ArchLucid",
          hasFindingsSnapshot: false,
          hasGoldenManifest: false,
        }),
      ],
      incompleteWizards: [],
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      kind: "review-in-progress",
      title: "ArchLucid",
    });
  });

  it("orders by urgency then recency and respects maxItems", () => {
    const items = buildUnfinishedWorkRailItems({
      drafts: [
        draft({ draftId: "arch-old", lastUpdatedUtc: "2026-08-01T00:00:00Z", displayName: "Old draft" }),
        draft({ draftId: "arch-new", lastUpdatedUtc: "2026-08-10T00:00:00Z", displayName: "New draft" }),
      ],
      runs: [
        run({
          runId: "await-new",
          description: "Await new",
          hasFindingsSnapshot: true,
          hasGoldenManifest: false,
          createdUtc: "2026-08-09T00:00:00Z",
        }),
      ],
      incompleteWizards: [
        {
          wizardId: WIZARD_SESSION_IDS.adminSsoWizard,
          stepIndex: 0,
          savedAtUtc: "2026-08-08T00:00:00Z",
        },
      ],
      maxItems: 3,
    });

    expect(items).toHaveLength(3);
    expect(items.map((item) => item.kind)).toEqual([
      "awaiting-disposition",
      "architecture-draft",
      "architecture-draft",
    ]);
    expect(items[1]?.title).toBe("New draft");
    expect(items[2]?.title).toBe("Old draft");
  });
});
