import { describe, expect, it } from "vitest";

import {
  SECURENOW_SELF_SERVICE_LEAD,
  SECURENOW_SELF_SERVICE_STEPS,
} from "@/lib/product-line/securenow-self-service-copy";

describe("SecureNow self-service copy", () => {
  it("defines the four stuck-state checks and existing support mailbox", () => {
    expect(SECURENOW_SELF_SERVICE_STEPS.map((step) => step.title)).toEqual([
      "Collection missing or stale",
      "Connector will not finish",
      "No ranked path, or not verified",
      "Still stuck",
    ]);

    const copy = [SECURENOW_SELF_SERVICE_LEAD, ...SECURENOW_SELF_SERVICE_STEPS.flatMap((step) => [
      step.title,
      step.body,
      step.href ?? "",
      step.mailto ?? "",
    ])].join(" ");

    expect(copy).toContain("mailto:support@archlucid.net?subject=SecureNow");
    expect(copy).toMatch(/NO_GO/);
    expect(copy).not.toMatch(/\$/);
    expect(copy).not.toMatch(/Start trial/i);
  });
});
