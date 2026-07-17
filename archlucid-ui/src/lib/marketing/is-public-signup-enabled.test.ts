import { describe, expect, it } from "vitest";

import { isPublicSelfServiceSignupEnabled, resolvePublicSignupMode } from "./is-public-signup-enabled";

describe("is-public-signup-enabled", () => {
  it("defaults to invite-only when env unset", () => {
    delete process.env.NEXT_PUBLIC_PUBLIC_SIGNUP_MODE;

    expect(resolvePublicSignupMode()).toBe("invite-only");
    expect(isPublicSelfServiceSignupEnabled()).toBe(false);
  });

  it("enables public self-service only for explicit mode", () => {
    process.env.NEXT_PUBLIC_PUBLIC_SIGNUP_MODE = "public-self-service";

    expect(isPublicSelfServiceSignupEnabled()).toBe(true);
  });
});
