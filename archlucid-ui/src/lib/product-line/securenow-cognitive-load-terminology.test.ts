import { describe, expect, it } from "vitest";

import {
  SECURENOW_FIRST_HOUR_STEPS,
  SECURENOW_FIRST_HOUR_TERMS,
} from "@/lib/product-line/securenow-first-hour-copy";
import { SECURENOW_PATH_INSPECT_SELECT_FINDING_HINT } from "@/lib/product-line/securenow-path-inspect-copy";

describe("SecureNow first-review terminology", () => {
  it("keeps the canonical first-review nouns in the operator copy", () => {
    const copy = [
      ...SECURENOW_FIRST_HOUR_STEPS.flatMap((step) => [step.title, step.body]),
      ...SECURENOW_FIRST_HOUR_TERMS,
      SECURENOW_PATH_INSPECT_SELECT_FINDING_HINT,
    ].join(" ");

    expect(copy).toMatch(/capture/i);
    expect(copy).toMatch(/ranked path/i);
    expect(copy).toMatch(/Path inspect/);
    expect(copy).toMatch(/cut point/i);
    expect(copy).toMatch(/verification/i);
    expect(copy).toMatch(/sponsor packaging/i);
    expect(copy).toMatch(/NOT VERIFIED/);
  });
});
