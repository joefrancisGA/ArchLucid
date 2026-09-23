import { describe, expect, it } from "vitest";

import {
  isPrivateBetaCreateIdentityConflict,
  parsePrivateBetaCommittedRunId,
  refreshPrivateBetaArchitectureCreateBody,
} from "./private-beta-create-identity";

describe("private-beta create identity", () => {
  it("treats workspace name collisions as retryable identity conflicts", () => {
    expect(
      isPrivateBetaCreateIdentityConflict(
        409,
        "A review named 'PrivateBetaAccessSmoke' already exists in this workspace.",
      ),
    ).toBe(true);
    expect(
      isPrivateBetaCreateIdentityConflict(
        400,
        "Run '5f181855-bd57-42cc-b700-d0871ec5f664' is committed; evidence-anchor header columns are immutable.",
      ),
    ).toBe(true);
    expect(
      isPrivateBetaCreateIdentityConflict(
        400,
        "Findings snapshot is only partially complete; AuthorityPipeline:HaltOnPartialFindings is true.",
      ),
    ).toBe(false);
    expect(isPrivateBetaCreateIdentityConflict(401, "unauthorized")).toBe(false);
    expect(isPrivateBetaCreateIdentityConflict(409, "manifest could not be loaded yet")).toBe(false);
  });

  it("reconciles a run persisted before the immutable-header guard returned", () => {
    expect(
      parsePrivateBetaCommittedRunId(
        400,
        "Run '5f181855-bd57-42cc-b700-d0871ec5f664' is committed; evidence-anchor header columns are immutable.",
      ),
    ).toBe("5f181855-bd57-42cc-b700-d0871ec5f664");
    expect(parsePrivateBetaCommittedRunId(400, "request rejected")).toBeNull();
    expect(
      parsePrivateBetaCommittedRunId(
        409,
        "Run '5f181855-bd57-42cc-b700-d0871ec5f664' is committed; evidence-anchor header columns are immutable.",
      ),
    ).toBeNull();
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
