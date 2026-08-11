import { describe, expect, it } from "vitest";

import {
  DIGEST_SUBSCRIPTION_PAUSE_DIALOG_DESCRIPTION,
  resolveDigestSubscriptionPauseDialogTitle,
} from "@/lib/digest-subscription-pause-copy";

describe("digest-subscription-pause-copy", () => {
  it("names the destination in the pause title", () => {
    expect(resolveDigestSubscriptionPauseDialogTitle("Ops email")).toBe(
      "Pause digest delivery for Ops email?",
    );
  });

  it("falls back when the destination name is blank", () => {
    expect(resolveDigestSubscriptionPauseDialogTitle("   ")).toBe(
      "Pause digest delivery for this destination?",
    );
  });

  it("explains that delivery stops until resume", () => {
    expect(DIGEST_SUBSCRIPTION_PAUSE_DIALOG_DESCRIPTION).toMatch(/stop going/i);
    expect(DIGEST_SUBSCRIPTION_PAUSE_DIALOG_DESCRIPTION).toMatch(/resume/i);
  });
});
