import { describe, expect, it } from "vitest";

import {
  AUTH_BOOTSTRAP_FIRST_VIEWPORT_ID,
  AUTH_BOOTSTRAP_PRIMARY_CONTENT_ID,
  AUTH_BOOTSTRAP_SKIP_TARGET_ID,
} from "@/lib/auth/auth-bootstrap-page-copy";

describe("auth-bootstrap-page-copy", () => {
  it("keeps skip target aligned with the first-viewport band", () => {
    expect(AUTH_BOOTSTRAP_PRIMARY_CONTENT_ID).toBe("post-auth-bootstrap-primary-content");
    expect(AUTH_BOOTSTRAP_FIRST_VIEWPORT_ID).toBe("post-auth-bootstrap-first-viewport");
    expect(AUTH_BOOTSTRAP_SKIP_TARGET_ID).toBe(AUTH_BOOTSTRAP_FIRST_VIEWPORT_ID);
  });
});
