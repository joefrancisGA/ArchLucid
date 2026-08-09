import { describe, expect, it } from "vitest";

import {
  SESSION_EXPIRED_SECONDARY_EXIT_LABEL,
  SESSION_EXPIRED_SECONDARY_EXIT_PATH,
} from "@/lib/auth/session-expired-page-copy";

describe("session-expired-page-copy (TB-1315)", () => {
  it("routes secondary exit to a public-safe path, not operator root", () => {
    expect(SESSION_EXPIRED_SECONDARY_EXIT_PATH).not.toBe("/");
    expect(SESSION_EXPIRED_SECONDARY_EXIT_PATH.startsWith("/")).toBe(true);
    expect(SESSION_EXPIRED_SECONDARY_EXIT_PATH).toBe("/welcome");
  });

  it("labels secondary exit honestly for signed-out users", () => {
    expect(SESSION_EXPIRED_SECONDARY_EXIT_LABEL).toBe("Back to ArchLucid");
    expect(SESSION_EXPIRED_SECONDARY_EXIT_LABEL.toLowerCase()).not.toContain("return to home");
  });
});
