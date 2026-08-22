import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildReportProblemContext,
  extractReviewIdFromRoutePath,
  formatReportProblemProductVersion,
} from "@/lib/report-problem-context";

describe("report-problem-context (TB-783)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers server correlation id over client request id", () => {
    const context = buildReportProblemContext({
      routePath: "/architecture/reviews",
      correlationId: "server-corr-123",
      clientRequestId: "client-req-456",
      submittedAtUtc: "2026-07-16T00:00:00.000Z",
    });

    expect(context.correlationId).toBe("server-corr-123");
    expect(context.clientRequestId).toBe("client-req-456");
  });

  it("includes review id on review detail route fixture", () => {
    const runId = "11111111-2222-3333-4444-555555555555";

    expect(extractReviewIdFromRoutePath(`/architecture/reviews/${runId}`)).toBe(runId);

    const context = buildReportProblemContext({
      routePath: `/architecture/reviews/${runId}`,
      submittedAtUtc: "2026-07-16T00:00:00.000Z",
    });

    expect(context.reviewId).toBe(runId);
    expect(context.routePath).toBe(`/architecture/reviews/${runId}`);
  });

  it("omits review id for /architecture/reviews/new", () => {
    const context = buildReportProblemContext({
      routePath: "/architecture/reviews/new",
      submittedAtUtc: "2026-07-16T00:00:00.000Z",
    });

    expect(context.reviewId).toBeNull();
  });

  it("formats product version from GET /version shape", () => {
    expect(
      formatReportProblemProductVersion({
        application: "ArchLucid.Api",
        informationalVersion: "1.2.3",
        commitSha: "abcdef1234567890abcdef1234567890abcdef12",
      }),
    ).toBe("ArchLucid.Api 1.2.3 sha=abcdef123456");
  });

  it("uses explicit scope snapshot and problem details when provided", () => {
    const context = buildReportProblemContext({
      routePath: "/governance/findings",
      scope: {
        tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        workspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      },
      problem: {
        title: "Approval queue unavailable",
        status: 503,
        errorCode: "GOVERNANCE_QUEUE_UNAVAILABLE",
        correlationId: "corr-from-problem",
      },
      submittedAtUtc: "2026-07-16T00:00:00.000Z",
    });

    expect(context.tenantId).toBe("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    expect(context.workspaceId).toBe("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    expect(context.errorTitle).toBe("Approval queue unavailable");
    expect(context.httpStatus).toBe(503);
    expect(context.errorCode).toBe("GOVERNANCE_QUEUE_UNAVAILABLE");
    expect(context.correlationId).toBe("corr-from-problem");
  });

  it("surfaces ui build fingerprint when env is set", () => {
    vi.stubEnv("NEXT_PUBLIC_BUILD_COMMIT_SHA", "abcdef1234567890abcdef1234567890abcdef12");
    vi.stubEnv("NEXT_PUBLIC_BUILD_TIMESTAMP", "2026-07-16T04:00:00Z");
    vi.stubEnv("NEXT_PUBLIC_DEPLOY_STAMP", "1842212345-1");
    vi.stubEnv("NEXT_PUBLIC_CI_BUILD_NUMBER", "1842");

    const context = buildReportProblemContext({
      submittedAtUtc: "2026-07-16T00:00:00.000Z",
    });

    expect(context.uiVersion).toBe("Build 1842 abcdef123456@2026-07-16T04:00:00Z");
    expect(context.uiCommitSha).toBe("abcdef1234567890abcdef1234567890abcdef12");
    expect(context.deployStamp).toBe("1842212345-1");
  });

  it("keeps sha@timestamp ui version when the CI number is not baked in", () => {
    vi.stubEnv("NEXT_PUBLIC_BUILD_COMMIT_SHA", "abcdef1234567890abcdef1234567890abcdef12");
    vi.stubEnv("NEXT_PUBLIC_BUILD_TIMESTAMP", "2026-07-16T04:00:00Z");

    const context = buildReportProblemContext({
      submittedAtUtc: "2026-07-16T00:00:00.000Z",
    });

    expect(context.uiVersion).toBe("abcdef123456@2026-07-16T04:00:00Z");
  });

  it("uses the CI build label alone when commit identity is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_CI_BUILD_NUMBER", "1842");

    const context = buildReportProblemContext({
      submittedAtUtc: "2026-07-16T00:00:00.000Z",
    });

    expect(context.uiVersion).toBe("Build 1842");
  });

  it("prefers API deploy stamp and commit sha from GET /version", () => {
    vi.stubEnv("NEXT_PUBLIC_DEPLOY_STAMP", "ui-only-stamp");
    vi.stubEnv("NEXT_PUBLIC_BUILD_COMMIT_SHA", "ffffffffffffffffffffffffffffffffffffffff");

    const context = buildReportProblemContext({
      productVersion: {
        application: "ArchLucid.Api",
        informationalVersion: "1.2.3",
        commitSha: "abcdef1234567890abcdef1234567890abcdef12",
        deployStamp: "1842212345-2",
        environment: "Staging",
      },
      submittedAtUtc: "2026-07-16T00:00:00.000Z",
    });

    expect(context.deployStamp).toBe("1842212345-2");
    expect(context.apiCommitSha).toBe("abcdef1234567890abcdef1234567890abcdef12");
    expect(context.environment).toBe("Staging");
  });
});
