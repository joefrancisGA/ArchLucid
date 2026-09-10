import { describe, expect, it } from "vitest";

import {
  SECURENOW_PATH_INSPECT_ADVISORY_INSTANCE_LINK,
  SECURENOW_PATH_INSPECT_EMPTY_NO_PATH,
  SECURENOW_PATH_INSPECT_PANEL_LEAD,
  SECURENOW_PATH_INSPECT_PANEL_TITLE,
  SECURENOW_PATH_INSPECT_SELECT_FINDING_HINT,
} from "@/lib/product-line/securenow-path-inspect-copy";
import {
  SECURENOW_ARCHITECT_HONESTY_COPY_DENY_PATTERNS,
  assertSecureNowArchitectHonestyCopy,
} from "@/lib/product-line/securenow-architect-honesty-copy";

describe("securenow-path-inspect-copy", () => {
  const copyStrings = [
    SECURENOW_PATH_INSPECT_PANEL_TITLE,
    SECURENOW_PATH_INSPECT_PANEL_LEAD,
    SECURENOW_PATH_INSPECT_EMPTY_NO_PATH,
    SECURENOW_PATH_INSPECT_SELECT_FINDING_HINT,
    SECURENOW_PATH_INSPECT_ADVISORY_INSTANCE_LINK,
  ];

  it("uses SecureNow path inspect copy without architecture review onboarding", () => {
    for (const copy of copyStrings) {
      expect(copy.toLowerCase()).not.toContain("first-architecture-review");
      expect(copy.toLowerCase()).not.toContain("architecture review");
    }
  });

  it("keeps the resource-scoped empty state sentence exact", () => {
    expect(SECURENOW_PATH_INSPECT_EMPTY_NO_PATH).toBe(
      "No architect path cited — this finding is resource-scoped.",
    );
  });

  it("rejects deny-list language in SecureNow path inspect copy", () => {
    for (const copy of copyStrings) {
      assertSecureNowArchitectHonestyCopy(copy);
    }

    for (const pattern of SECURENOW_ARCHITECT_HONESTY_COPY_DENY_PATTERNS) {
      expect("sample copy").not.toMatch(pattern);
    }
  });
});
