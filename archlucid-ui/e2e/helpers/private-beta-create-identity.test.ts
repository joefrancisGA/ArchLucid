import { describe, expect, it } from "vitest";

import {
  isPrivateBetaCreateIdentityConflict,
  refreshPrivateBetaArchitectureCreateBody,
} from "./private-beta-create-identity";

describe("private-beta create identity", () => {
  it("treats name collisions and partial-findings halts as retryable identity conflicts", () => {
    expect(
      isPrivateBetaCreateIdentityConflict(
        409,
        "A review named 'PrivateBetaAccessSmoke' already exists in this workspace.",
      ),
    ).toBe(true);
    expect(
      isPrivateBetaCreateIdentityConflict(
        400,
        "Findings snapshot is only partially complete; AuthorityPipeline:HaltOnPartialFindings is true.",
      ),
    ).toBe(true);
    expect(isPrivateBetaCreateIdentityConflict(401, "unauthorized")).toBe(false);
    expect(isPrivateBetaCreateIdentityConflict(409, "manifest could not be loaded yet")).toBe(false);
  });

  it("replaces request id and system name without stacking suffixes", () => {
    const refreshed = refreshPrivateBetaArchitectureCreateBody(
      {
        requestId: "E2E-BETA-ACCESS-1700000000000-abc123",
        systemName: "PrivateBetaAccessSmoke-1700000000000-abc123",
        description: "keep",
      },
      1700000000001,
      "zz99",
    );

    expect(refreshed.requestId).toBe("E2E-BETA-ACCESS-1700000000001-zz99");
    expect(refreshed.systemName).toBe("PrivateBetaAccessSmoke-1700000000001-zz99");
    expect(refreshed.description).toBe("keep");
  });
});
