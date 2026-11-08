import { describe, expect, it } from "vitest";

import {
  collectResumeRunIdsForMatch,
  matchesOperatorHomeHeroResumeTarget,
  resolveOperatorHomeHeroResumeTarget,
  resumeHrefsEquivalentForDedupe,
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

  it("does not throw when matching malformed encoded draft hrefs", () => {
    expect(
      matchesOperatorHomeHeroResumeTarget(
        { href: "/architecture/architectures/%E0%A4%A" },
        { href: "/architecture/architectures/other" },
      ),
    ).toBe(false);
  });

  it("resumeHrefsEquivalentForDedupe treats desk highlight URLs as equivalent aside from trailing slash", () => {
    expect(
      resumeHrefsEquivalentForDedupe(
        "/architecture/architectures/architecture-identity-001?highlightReviewId=run-a",
        "/architecture/architectures/architecture-identity-001/?highlightReviewId=run-a",
      ),
    ).toBe(true);
  });

  it("collectResumeRunIdsForMatch ignores whitespace-only explicit run ids", () => {
    expect(collectResumeRunIdsForMatch("/architecture/reviews/run-hero", "   ")).toEqual(["run-hero"]);
    expect(collectResumeRunIdsForMatch("/architecture/first-review-guide", "   ")).toEqual([]);
  });

  it("collectResumeRunIdsForMatch dedupes when href and explicit encode the same run", () => {
    expect(collectResumeRunIdsForMatch("/architecture/reviews/run-hero", "run-hero")).toEqual(["run-hero"]);
  });

  it("matches when hero runId is whitespace-only but href encodes the rail run id", () => {
    expect(
      matchesOperatorHomeHeroResumeTarget(
        { href: "/architecture/reviews/run-hero", runId: "   " },
        { href: "/architecture/reviews/run-hero" },
      ),
    ).toBe(true);
  });

  it("does not match when desk highlightReviewId differs even if explicit runId matches hero", () => {
    expect(
      matchesOperatorHomeHeroResumeTarget(
        { href: "/architecture/architectures/architecture-identity-001?highlightReviewId=run-a" },
        {
          href: "/architecture/architectures/architecture-identity-001?highlightReviewId=run-b",
          runId: "run-a",
        },
      ),
    ).toBe(false);
  });

  it("does not treat same architecture desk with different highlightReviewId as equivalent", () => {
    expect(
      matchesOperatorHomeHeroResumeTarget(
        { href: "/architecture/architectures/architecture-identity-001?highlightReviewId=run-a" },
        { href: "/architecture/architectures/architecture-identity-001?highlightReviewId=run-b" },
      ),
    ).toBe(false);
  });

  it("matches Working desk highlightReviewId hrefs to peer review rail rows", () => {
    expect(
      matchesOperatorHomeHeroResumeTarget(
        { href: "/architecture/architectures/architecture-identity-001?highlightReviewId=run-hero" },
        { href: "/architecture/reviews/run-hero", runId: "run-hero" },
      ),
    ).toBe(true);
  });

  it("matches when the hero draft id equals the rail href draft id even if paths differ", () => {
    expect(
      matchesOperatorHomeHeroResumeTarget(
        { href: "/architecture/architectures/stale-path", draftId: "draft-hero" },
        { href: "/architecture/architectures/draft-hero" },
      ),
    ).toBe(true);
  });

  it("matches when the hero run id equals the rail href run id even if paths differ", () => {
    expect(
      matchesOperatorHomeHeroResumeTarget(
        { href: "/architecture/reviews/stale-path", runId: "run-hero" },
        { href: "/architecture/reviews/run-hero" },
      ),
    ).toBe(true);
  });

  it("matches resume targets when hrefs differ only by a trailing slash", () => {
    const target = {
      href: "/architecture/reviews/run-hero",
      runId: "run-hero",
    };

    expect(
      matchesOperatorHomeHeroResumeTarget(target, {
        href: "/architecture/reviews/run-hero/",
        runId: "run-hero",
      }),
    ).toBe(true);
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
