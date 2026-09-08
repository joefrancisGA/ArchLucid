import { describe, expect, it } from "vitest";

import { auditEvidenceSealedManifestConflictMessage } from "./audit-evidence-sealed-manifest-conflict";

describe("auditEvidenceSealedManifestConflictMessage", () => {
  it("returns problem detail for HTTP 409 failures", () => {
    const message = auditEvidenceSealedManifestConflictMessage({
      message: "Conflict",
      problem: { detail: "Sealed manifest hash verification failed." },
      correlationId: null,
      httpStatus: 409,
      retryAfterSeconds: null,
    });

    expect(message).toBe("Sealed manifest hash verification failed.");
  });

  it("returns null for non-409 failures", () => {
    const message = auditEvidenceSealedManifestConflictMessage({
      message: "Not found",
      problem: null,
      correlationId: null,
      httpStatus: 404,
      retryAfterSeconds: null,
    });

    expect(message).toBeNull();
  });
});
