import { describe, expect, it } from "vitest";

import {
  AUTH_CALLBACK_FIRST_VIEWPORT_ID,
  AUTH_CALLBACK_PRIMARY_CONTENT_ID,
  AUTH_CALLBACK_SKIP_TARGET_ID,
} from "@/lib/auth/auth-callback-page-copy";

describe("auth-callback-page-copy", () => {
  it("keeps skip target aligned with the first-viewport band", () => {
    expect(AUTH_CALLBACK_PRIMARY_CONTENT_ID).toBe("auth-callback-primary-content");
    expect(AUTH_CALLBACK_FIRST_VIEWPORT_ID).toBe("auth-callback-first-viewport");
    expect(AUTH_CALLBACK_SKIP_TARGET_ID).toBe(AUTH_CALLBACK_FIRST_VIEWPORT_ID);
  });
});
