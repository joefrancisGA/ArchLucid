import { describe, expect, it } from "vitest";

import {
  architectureNestedReviewPath,
  ARCHITECTURES_LIST_PATH,
  ARCHITECTURES_NEW_PATH,
  REVIEWS_LIST_PATH,
} from "@/lib/architecture/architecture-routes";
import { resolveReviewArchiveRedirectHref } from "@/lib/resolve-review-archive-redirect-href";
import { resolveSignedRecordsListReviewHref } from "@/lib/resolve-signed-records-list-review-href";
import {
  resolveSignedRecordsListEmptyPrimaryHref,
  resolveSignedRecordsListEmptySecondaryHref,
} from "@/app/(operator)/governance/sealed-records/_sections/signed-records-list-copy";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { resolveWorkingStartHref } from "@/lib/working-start-route";

describe("signed records Working desk guard (SY-92)", () => {
  it("never targets the sealed-records list from Working Start", () => {
    const cases = [
      resolveWorkingStartHref({ lastOpenArchitectureId: "arch-identity-1" }),
      resolveWorkingStartHref({ inFlightParentArchitectureId: "arch-in-flight" }),
      resolveWorkingStartHref({}),
    ];

    for (const result of cases) {
      expect(result.href).not.toBe(SIGNED_RECORDS_LIST_PATH);
      expect(result.href).not.toMatch(/^\/governance\/sealed-records/);
    }
  });

  it("nests review hrefs when requestId maps to a parent architecture", () => {
    const href = resolveSignedRecordsListReviewHref({
      runId: "run-001",
      requestId: "architecture-identity-001",
    });

    expect(href).toBe(architectureNestedReviewPath("architecture-identity-001", "run-001"));
    expect(href).not.toMatch(/^\/architecture\/reviews\/[^/]+$/);
  });

  it("routes Working empty states to the architecture portfolio and inbox, not reviews/new as Home", () => {
    expect(resolveSignedRecordsListEmptyPrimaryHref(true)).toBe(ARCHITECTURES_NEW_PATH);
    expect(resolveSignedRecordsListEmptySecondaryHref(true)).toBe(ARCHITECTURES_LIST_PATH);
    expect(resolveSignedRecordsListEmptySecondaryHref(false)).toBe(REVIEWS_LIST_PATH);
  });

  it("returns architects portfolio after archive on Working", () => {
    expect(resolveReviewArchiveRedirectHref(true)).toBe(ARCHITECTURES_LIST_PATH);
    expect(resolveReviewArchiveRedirectHref(false)).toBe(REVIEWS_LIST_PATH);
  });
});
