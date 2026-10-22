import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ARCHITECTURES_NEW_PATH,
  startReviewFromArchitectureNestedHref,
} from "@/lib/architecture/architecture-routes";
import {
  resolveWorkingCreateStartHref,
  SYSTEM_NOT_JOB_START_REVIEW_FROM_DESK_ONLY_WORKING_DOC_ANCHOR,
  SYSTEM_NOT_JOB_START_REVIEW_FROM_DESK_ONLY_WORKING_OWNER,
} from "@/lib/system-not-job-start-review-from-desk-only-working";

const REPO_ROOT = join(process.cwd(), "..");

describe("SN-019 Working create starts under open architecture", () => {
  it("opens nested start-review when last-open architecture is known", () => {
    const result = resolveWorkingCreateStartHref({
      lastOpenArchitectureId: "architecture-identity-001",
      inFlightParentArchitectureId: "architecture-in-flight",
    });

    expect(result).toEqual({
      href: startReviewFromArchitectureNestedHref("architecture-identity-001"),
      reason: "nested-under-open-architecture",
    });
    expect(result.href).not.toBe("/architecture/reviews/new");
  });

  it("falls back to in-flight parent architecture when last-open is empty", () => {
    const result = resolveWorkingCreateStartHref({
      inFlightParentArchitectureId: "architecture-in-flight",
    });

    expect(result.href).toBe(startReviewFromArchitectureNestedHref("architecture-in-flight"));
    expect(result.reason).toBe("nested-under-open-architecture");
  });

  it("falls back to portfolio new when no architecture context exists", () => {
    const result = resolveWorkingCreateStartHref({});

    expect(result).toEqual({
      href: ARCHITECTURES_NEW_PATH,
      reason: "portfolio-new",
    });
  });

  it("never returns a floating peer reviews/new mint", () => {
    const cases = [
      resolveWorkingCreateStartHref({ lastOpenArchitectureId: "architecture-identity-001" }),
      resolveWorkingCreateStartHref({ inFlightParentArchitectureId: "architecture-in-flight" }),
      resolveWorkingCreateStartHref({}),
    ];

    for (const result of cases) {
      expect(result.href).not.toBe("/architecture/reviews/new");
      expect(result.href).not.toMatch(/^\/architecture\/reviews\/[^/]+$/);
    }
  });

  it("wires create hook and keeps desk redirect on ReviewsNewRouteBody", () => {
    const hookSource = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/hooks/use-working-start-href.ts"),
      "utf8",
    );
    const shortcutSource = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/hooks/useShortcutNavigation.ts"),
      "utf8",
    );
    const routeBodySource = readFileSync(
      join(
        REPO_ROOT,
        "archlucid-ui/src/app/(operator)/architecture/reviews/new/ReviewsNewRouteBody.tsx",
      ),
      "utf8",
    );

    expect(hookSource).toContain("useWorkingCreateStartHref");
    expect(hookSource).toContain("resolveWorkingCreateStartHref");
    expect(shortcutSource).toContain("useWorkingCreateStartHref");
    expect(routeBodySource).toContain("useWorkingStartHref");
    expect(existsSync(join(REPO_ROOT, SYSTEM_NOT_JOB_START_REVIEW_FROM_DESK_ONLY_WORKING_DOC_ANCHOR))).toBe(
      true,
    );
    expect(SYSTEM_NOT_JOB_START_REVIEW_FROM_DESK_ONLY_WORKING_OWNER).toBe("SN-019");
    expect(SYSTEM_NOT_JOB_START_REVIEW_FROM_DESK_ONLY_WORKING_DOC_ANCHOR).toContain("0077");
  });
});
