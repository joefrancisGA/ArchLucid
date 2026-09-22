import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import type { TrackedInFlightOperation } from "@/lib/operations/in-flight-operations-store";
import {
  buildSystemNotJobDeskInFlightReviewRunIds,
  findSystemNotJobDeskInFlightOperationForReview,
  resolveSystemNotJobDeskChildReviewHref,
  resolveSystemNotJobDeskChildReviewStatusLabel,
  sortSystemNotJobDeskChildReviews,
  SYSTEM_NOT_JOB_DESK_IN_FLIGHT_BACKGROUND_WAIT_HELPER,
  SYSTEM_NOT_JOB_IN_FLIGHT_REVIEW_ON_DESK_DOC_ANCHOR,
  SYSTEM_NOT_JOB_IN_FLIGHT_REVIEW_ON_DESK_OWNER,
} from "@/lib/system-not-job-in-flight-review-on-desk";

const REPO_ROOT = join(process.cwd(), "..");
const architectureId = "architecture-identity-001";

const inFlightOperation: TrackedInFlightOperation = {
  operationId: "run:review-2",
  title: "Architecture review analysis",
  href: "/architecture/architectures/architecture-identity-001/reviews/review-2?reviewTab=activity",
  startedAtMs: 1_700_000_000_000,
  stepLabel: "Agents running",
  state: "Running",
  runId: "review-2",
  architectureId,
  retainUntilConsumed: false,
  terminalToastShown: false,
};

describe("SN-030 in-flight review on architecture desk", () => {
  it("links in-flight child reviews to Activity on the nested desk job", () => {
    expect(
      resolveSystemNotJobDeskChildReviewHref({
        runId: "review-2",
        architectureId,
        inFlightOperation,
      }),
    ).toBe("/architecture/architectures/architecture-identity-001/reviews/review-2?reviewTab=activity");
  });

  it("keeps sealed child review links on the nested desk when not in-flight", () => {
    expect(
      resolveSystemNotJobDeskChildReviewHref({
        runId: "review-1",
        architectureId,
        inFlightOperation: null,
      }),
    ).toBe("/architecture/architectures/architecture-identity-001/reviews/review-1");
  });

  it("collects in-flight run ids scoped to one architecture desk", () => {
    const runIds = buildSystemNotJobDeskInFlightReviewRunIds(
      [
        inFlightOperation,
        {
          ...inFlightOperation,
          operationId: "run:other-arch",
          runId: "review-other",
          architectureId: "architecture-other",
        },
      ],
      architectureId,
    );

    expect(runIds.has("review-2")).toBe(true);
    expect(runIds.has("review-other")).toBe(false);
  });

  it("finds the in-flight operation for a child review row", () => {
    expect(
      findSystemNotJobDeskInFlightOperationForReview([inFlightOperation], architectureId, "review-2"),
    ).toEqual(inFlightOperation);
    expect(
      findSystemNotJobDeskInFlightOperationForReview([inFlightOperation], architectureId, "review-1"),
    ).toBeNull();
  });

  it("uses step labels on in-flight child rows without inventing percent complete", () => {
    expect(resolveSystemNotJobDeskChildReviewStatusLabel(inFlightOperation)).toBe("Agents running");
    expect(resolveSystemNotJobDeskChildReviewStatusLabel(null)).toBeNull();
  });

  it("sorts in-flight child reviews ahead of sealed siblings", () => {
    const sorted = sortSystemNotJobDeskChildReviews({
      reviews: [
        { runId: "review-1", description: "Sealed", createdUtc: "2026-01-03T00:00:00Z" },
        { runId: "review-2", description: "In flight", createdUtc: "2026-01-02T00:00:00Z" },
      ],
      inFlightRunIds: new Set(["review-2"]),
    });

    expect(sorted.map((review) => review.runId)).toEqual(["review-2", "review-1"]);
  });

  it("background-wait helper does not tell the architect to stay on this page", () => {
    expect(SYSTEM_NOT_JOB_DESK_IN_FLIGHT_BACKGROUND_WAIT_HELPER).toContain("background");
    expect(SYSTEM_NOT_JOB_DESK_IN_FLIGHT_BACKGROUND_WAIT_HELPER).not.toMatch(/stay on this page/i);
    expect(SYSTEM_NOT_JOB_DESK_IN_FLIGHT_BACKGROUND_WAIT_HELPER).toContain("cancel still asks for confirmation");
  });

  it("ratchet module documents SN-030 anchor and desk surfaces", () => {
    const modulePath = join(REPO_ROOT, "archlucid-ui", "src", "lib", "system-not-job-in-flight-review-on-desk.ts");

    expect(existsSync(modulePath)).toBe(true);

    const source = readFileSync(modulePath, "utf8");

    expect(source).toContain(SYSTEM_NOT_JOB_IN_FLIGHT_REVIEW_ON_DESK_OWNER);
    expect(source).toContain(SYSTEM_NOT_JOB_IN_FLIGHT_REVIEW_ON_DESK_DOC_ANCHOR);
    expect(source).toContain("ArchitectureIdentityDeskReviewsTable");
  });
});
