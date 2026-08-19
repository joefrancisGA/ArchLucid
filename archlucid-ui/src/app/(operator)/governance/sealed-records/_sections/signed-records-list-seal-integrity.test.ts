import { describe, expect, it } from "vitest";

import type { ManifestSummary } from "@/types/authority";

import {
  deriveSignedRecordsListSealIntegrity,
  truncateSignedRecordsListSealDigest,
} from "./signed-records-list-seal-integrity";

const committedManifest: ManifestSummary = {
  manifestId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  runId: "00000000-0000-0000-0000-000000000099",
  createdUtc: "2026-03-20T16:45:00.000Z",
  manifestHash: "sha256-demo-abcdef1234567890abcdef1234567890",
  ruleSetId: "healthcare-claims",
  ruleSetVersion: "2.4.1",
  decisionCount: 3,
  warningCount: 0,
  unresolvedIssueCount: 0,
  status: "Committed",
};

describe("signed-records-list-seal-integrity", () => {
  it("truncates long manifest digests for disclosure", () => {
    expect(truncateSignedRecordsListSealDigest("sha256-demo-abcdef1234567890abcdef1234567890")).toBe(
      "sha256-d…34567890",
    );
  });

  it("marks committed manifests without unresolved issues as sealed", () => {
    expect(deriveSignedRecordsListSealIntegrity(committedManifest)).toEqual({
      kind: "ready",
      label: "Sealed",
    });
  });

  it("flags committed manifests with unresolved issues as needs attention", () => {
    expect(
      deriveSignedRecordsListSealIntegrity({
        ...committedManifest,
        unresolvedIssueCount: 2,
        hasUnresolvedIssues: true,
      }),
    ).toEqual({
      kind: "needs-attention",
      label: "Needs attention",
    });
  });

  it("marks resolved golden manifests as sealed", () => {
    expect(
      deriveSignedRecordsListSealIntegrity({
        ...committedManifest,
        status: "Resolved",
      }),
    ).toEqual({
      kind: "ready",
      label: "Sealed",
    });
  });
});
