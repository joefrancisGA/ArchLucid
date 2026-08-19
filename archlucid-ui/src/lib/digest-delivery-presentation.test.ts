import { describe, expect, it } from "vitest";

import {
  DIGEST_DELIVERY_DELIVERED,
  DIGEST_DELIVERY_DIAGNOSTIC_NOTE,
  DIGEST_DELIVERY_FAILED,
  DIGEST_DELIVERY_IN_PROGRESS,
  DIGEST_DELIVERY_NOT_DELIVERED,
  DIGEST_DELIVERY_PARTIAL,
  DIGEST_EXPORT_ACTION_LABEL,
  DIGEST_EXPORT_MIME_TYPE,
  buildDigestExportFile,
  digestDeliveryAttemptHasDiagnostic,
  digestDeliveryDiagnostics,
  resolveDigestDeliveryAttemptStatus,
  resolveDigestDeliveryStatus,
} from "@/lib/digest-delivery-presentation";
import type { ArchitectureDigest } from "@/types/advisory-scheduling";
import type { DigestDeliveryAttempt } from "@/types/digest-subscriptions";

function attempt(overrides: Partial<DigestDeliveryAttempt> = {}): DigestDeliveryAttempt {
  return {
    attemptId: "a1",
    digestId: "d1",
    subscriptionId: "s1",
    attemptedUtc: "2026-07-08T12:05:00Z",
    status: "Succeeded",
    channelType: "Email",
    destination: "ops@example.com",
    ...overrides,
  };
}

function digest(overrides: Partial<ArchitectureDigest> = {}): ArchitectureDigest {
  return {
    digestId: "d1",
    tenantId: "t",
    workspaceId: "w",
    projectId: "p",
    generatedUtc: "2026-07-08T12:00:00Z",
    title: "Weekly architecture digest",
    summary: "Summary line",
    contentMarkdown: "# Body",
    metadataJson: "{}",
    ...overrides,
  };
}

describe("resolveDigestDeliveryAttemptStatus (TB-1504)", () => {
  it("maps the three backend statuses to canonical vocabulary", () => {
    expect(resolveDigestDeliveryAttemptStatus(attempt({ status: "Succeeded" }))).toBe(
      DIGEST_DELIVERY_DELIVERED,
    );
    expect(resolveDigestDeliveryAttemptStatus(attempt({ status: "Failed" }))).toBe(
      DIGEST_DELIVERY_FAILED,
    );
    expect(resolveDigestDeliveryAttemptStatus(attempt({ status: "Started" }))).toBe(
      DIGEST_DELIVERY_IN_PROGRESS,
    );
  });

  it("treats unrecognised statuses as not delivered rather than echoing them", () => {
    const view = resolveDigestDeliveryAttemptStatus(attempt({ status: "Weird.Backend.Value" }));

    expect(view).toBe(DIGEST_DELIVERY_NOT_DELIVERED);
    expect(view.label).not.toContain("Weird");
  });

  it("prefers the failure reading when a status mentions both", () => {
    expect(resolveDigestDeliveryAttemptStatus(attempt({ status: "sent-with-error" }))).toBe(
      DIGEST_DELIVERY_FAILED,
    );
  });
});

describe("resolveDigestDeliveryStatus", () => {
  it("reports not delivered when there are no attempts", () => {
    expect(resolveDigestDeliveryStatus([])).toBe(DIGEST_DELIVERY_NOT_DELIVERED);
  });

  it("reports partial delivery when channels disagree", () => {
    expect(
      resolveDigestDeliveryStatus([
        attempt({ attemptId: "a1", status: "Succeeded" }),
        attempt({ attemptId: "a2", status: "Failed" }),
      ]),
    ).toBe(DIGEST_DELIVERY_PARTIAL);
  });

  it("reports failure when every attempt failed", () => {
    expect(resolveDigestDeliveryStatus([attempt({ status: "Failed" })])).toBe(DIGEST_DELIVERY_FAILED);
  });

  it("reports delivered when every attempt succeeded", () => {
    expect(resolveDigestDeliveryStatus([attempt({ status: "Succeeded" })])).toBe(
      DIGEST_DELIVERY_DELIVERED,
    );
  });

  it("reports in progress while attempts are still started", () => {
    expect(resolveDigestDeliveryStatus([attempt({ status: "Started" })])).toBe(
      DIGEST_DELIVERY_IN_PROGRESS,
    );
  });
});

describe("delivery diagnostics", () => {
  it("detects a recorded diagnostic and ignores blank ones", () => {
    expect(digestDeliveryAttemptHasDiagnostic(attempt({ errorMessage: "smtp timeout" }))).toBe(true);
    expect(digestDeliveryAttemptHasDiagnostic(attempt({ errorMessage: "  " }))).toBe(false);
    expect(digestDeliveryAttemptHasDiagnostic(attempt())).toBe(false);
  });

  it("keeps raw exception text out of the buyer-facing note", () => {
    expect(DIGEST_DELIVERY_DIAGNOSTIC_NOTE).not.toMatch(/exception|stack|smtp/i);
  });

  it("collects raw diagnostics for the technical-details disclosure only", () => {
    const lines = digestDeliveryDiagnostics([
      attempt({ attemptId: "a1", status: "Failed", errorMessage: "smtp timeout" }),
      attempt({ attemptId: "a2", status: "Succeeded" }),
    ]);

    expect(lines).toEqual(["a1: smtp timeout"]);
  });
});

describe("buildDigestExportFile (TB-1504)", () => {
  it("uses a .md extension and a matching Markdown MIME type", () => {
    const file = buildDigestExportFile(digest());

    expect(file.fileName).toBe("Weekly_architecture_digest.md");
    expect(file.mimeType).toBe(DIGEST_EXPORT_MIME_TYPE);
    expect(file.mimeType).toContain("text/markdown");
    expect(file.contents).toBe("# Body");
  });

  it("labels the control by the format it actually produces", () => {
    expect(DIGEST_EXPORT_ACTION_LABEL).toBe("Download Markdown");
  });

  it("falls back to a safe stem when the title has no word characters", () => {
    expect(buildDigestExportFile(digest({ title: "///" })).fileName).toBe("digest.md");
  });

  it("tolerates a missing markdown body", () => {
    const file = buildDigestExportFile(digest({ contentMarkdown: undefined as unknown as string }));

    expect(file.contents).toBe("");
  });
});
