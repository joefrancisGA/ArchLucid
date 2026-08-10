import { describe, expect, it } from "vitest";

import {
  POST_AUTH_BOOTSTRAP_COPY,
  resolvePostAuthBootstrapDenialMessage,
} from "@/lib/auth/post-auth-bootstrap-denial-copy";

describe("resolvePostAuthBootstrapDenialMessage (TB-1468)", () => {
  it("returns the default when denialReason is missing", () => {
    expect(resolvePostAuthBootstrapDenialMessage(null)).toMatch(/no workspace is available/i);
    expect(resolvePostAuthBootstrapDenialMessage("   ")).toMatch(/no workspace is available/i);
  });

  it("passes through known backend denial messages", () => {
    const duplicateOrgMessage =
      "An organization with this name or email domain may already use ArchLucid. Request access instead of creating a duplicate workspace.";

    expect(resolvePostAuthBootstrapDenialMessage(duplicateOrgMessage)).toBe(duplicateOrgMessage);
  });

  it("replaces raw exception-like denial strings with the default", () => {
    expect(
      resolvePostAuthBootstrapDenialMessage("System.NullReferenceException: Object reference not set"),
    ).toMatch(/no workspace is available/i);
    expect(resolvePostAuthBootstrapDenialMessage("HTTP 500 Internal Server Error at AuthController.cs:42")).toMatch(
      /no workspace is available/i,
    );
  });
});

describe("POST_AUTH_BOOTSTRAP_COPY", () => {
  it("labels a single-workspace continue action clearly", () => {
    expect(POST_AUTH_BOOTSTRAP_COPY.selectWorkspaceContinueLabel("Northwind")).toBe("Continue to Northwind");
  });
});
