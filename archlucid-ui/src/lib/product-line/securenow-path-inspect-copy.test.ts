import { describe, expect, it } from "vitest";

import {
  SECURENOW_PATH_INSPECT_ADVISORY_INSTANCE_LINK,
  SECURENOW_PATH_INSPECT_EMPTY_NO_PATH,
  SECURENOW_PATH_INSPECT_PANEL_LEAD,
  SECURENOW_PATH_INSPECT_PANEL_TITLE,
  SECURENOW_PATH_INSPECT_SELECT_FINDING_HINT,
  SECURENOW_PATH_INSPECT_EXPLANATION_MODEL_LEAD,
  SECURENOW_PATH_INSPECT_EXPLANATION_SIMULATOR_LEAD,
  SECURENOW_PATH_RANKED_PATHS_EMPTY,
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

  it("keeps the no-path finding sentence exact", () => {
    expect(SECURENOW_PATH_INSPECT_EMPTY_NO_PATH).toBe("This finding does not cite a path.");
  });

  it("keeps explanations and empty ranked paths honest about the rank", () => {
    expect(SECURENOW_PATH_INSPECT_EXPLANATION_MODEL_LEAD).toContain(
      "This does not change the rank.",
    );
    expect(SECURENOW_PATH_INSPECT_EXPLANATION_SIMULATOR_LEAD).toContain(
      "This does not change the rank.",
    );
    expect(SECURENOW_PATH_RANKED_PATHS_EMPTY).toBe(
      "No ranked path for this scope. Open collection, then select a row.",
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
