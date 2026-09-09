import { describe, expect, it } from "vitest";

import {
  matchesOperatorHomeHeroResumeTarget,
  resolveOperatorHomeHeroResumeTarget,
} from "@/lib/operator/operator-home-hero-resume-target";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";

const draftEntry: ArchitectureDraftRegistryEntry = {
  draftId: "draft-hero",
  displayName: "Payments edge",
  customerStatus: "draft",
  ownerLabel: "You",
  lastUpdatedUtc: "2026-08-10T12:00:00Z",
  linkedReviewId: null,
  serverUpdatedUtc: "2026-08-10T12:00:00Z",
};

describe("operator-home-hero-resume-target", () => {
  it("resolves the latest draft primary action as the hero resume target", () => {
    const target = resolveOperatorHomeHeroResumeTarget({
      drafts: [draftEntry],
      runs: [],
      incompleteWizards: [],
    });

    expect(target).toEqual({
      href: "/architecture/architectures/draft-hero",
      draftId: "draft-hero",
    });
  });

  it("matches draft and review rows that share the hero href", () => {
    const target = {
      href: "/architecture/reviews/run-hero",
      runId: "run-hero",
    };

    expect(
      matchesOperatorHomeHeroResumeTarget(target, {
        href: "/architecture/reviews/run-hero",
        runId: "run-hero",
      }),
    ).toBe(true);

    expect(
      matchesOperatorHomeHeroResumeTarget(target, {
        href: "/architecture/reviews/other-run",
        runId: "other-run",
      }),
    ).toBe(false);
  });
});
