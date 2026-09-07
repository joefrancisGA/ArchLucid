import { describe, expect, it } from "vitest";

import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import {
  GUIDED_ARCHITECTURE_REVIEWS_PARENT_LABEL,
  resolveWorkingArchitecturePortfolioParentLink,
  resolveWorkingReviewsInboxParentLink,
} from "@/lib/resolve-working-evidence-parent-link";
import { WORKING_REVIEWS_INBOX_NAV_LABEL } from "@/lib/operator/operator-nav-labels";

describe("resolveWorkingEvidenceParentLink (SY-33)", () => {
  it("SY-33: Working intelligence breadcrumb parent is the architectures portfolio", () => {
    const parent = resolveWorkingArchitecturePortfolioParentLink(true);

    expect(parent.href).toBe("/architecture/architectures");
    expect(parent.href).not.toBe(REVIEWS_LIST_PATH);
  });

  it("SY-33: Working inbox parent is labeled Inbox", () => {
    const parent = resolveWorkingReviewsInboxParentLink(true);

    expect(parent.label).toBe(WORKING_REVIEWS_INBOX_NAV_LABEL);
    expect(parent.href).toBe(REVIEWS_LIST_PATH);
  });

  it("Guided keeps Architecture reviews parent copy", () => {
    expect(resolveWorkingArchitecturePortfolioParentLink(false).label).toBe(
      GUIDED_ARCHITECTURE_REVIEWS_PARENT_LABEL,
    );
    expect(resolveWorkingReviewsInboxParentLink(false).label).toBe(
      GUIDED_ARCHITECTURE_REVIEWS_PARENT_LABEL,
    );
  });
});
