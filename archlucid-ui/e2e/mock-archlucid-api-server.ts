import http from "node:http";
import { randomUUID } from "node:crypto";

import { MOCK_TRIAL_WELCOME_RUN_ID } from "./fixtures/ids";
import {
  getMockEffectiveContent,
  getMockEffectivePacks,
  listMockPacks,
  listMockVersions,
} from "./policy-packs-mock-state";
import {
  FIXTURE_MANIFEST_EMPTY_ARTIFACTS_ID,
  FIXTURE_MANIFEST_ID,
  FIXTURE_RUN_ID,
  SCREENSHOT_RUN_ID,
  SHOWCASE_DEMO_RUN_ID,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  fixtureArtifactDescriptorsForShowcase,
  fixtureArtifactDescriptorsNonEmpty,
  fixtureManifestSummary,
  fixtureManifestSummaryEmptyArtifacts,
  fixtureManifestSummaryForShowcase,
  fixtureRunDetail,
  fixtureRunDetailAlignedToShowcase,
  fixtureRunExplanationSummary,
  fixtureOperatorDemoReviewRunDetail,
  operatorDemoReviewApiResponse,
  OPERATOR_DEMO_REVIEW_RUN_ID,
} from "./fixtures/index";
import { toMockBuyerRunDetailSummary } from "./fixtures/buyer-run-detail-summary";
import { getDemoSampleAuditTrailEvents } from "@/lib/demo-audit-sample-events";
import { getShowcaseStaticDemoPayload } from "@/lib/showcase-static-demo";
import type { RunDetail } from "@/types/authority";

import {
  getEmptyGraphViewModelJson,
  getScreenshotMockFallbackGetJson,
  isGraphUpstreamPath,
} from "./screenshot-mock-fallback";

function fixtureRunDetailForRunId(runId: string): RunDetail {
  const detail = fixtureRunDetail();

  return {
    ...detail,
    run: {
      ...detail.run,
      runId,
    },
  };
}

function resolveRunDetailBodyForRunId(runId: string): RunDetail | null {
  if (runId === FIXTURE_RUN_ID) {
    return fixtureRunDetail();
  }

  if (runId === MOCK_TRIAL_WELCOME_RUN_ID) {
    return fixtureRunDetailForRunId(MOCK_TRIAL_WELCOME_RUN_ID);
  }

  if (runId === SHOWCASE_DEMO_RUN_ID || runId === SCREENSHOT_RUN_ID) {
    return fixtureRunDetailAlignedToShowcase(runId);
  }

  if (runId === OPERATOR_DEMO_REVIEW_RUN_ID) {
    return fixtureOperatorDemoReviewRunDetail(runId);
  }

  return null;
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload, "utf8"),
  });
  res.end(payload);
}

function tryParseManifestSummaryPath(pathname: string): string | null {
  const patterns = [
    /^\/v1\/authority\/(?:manifests|signed-records|signed-review-records)\/([^/]+)\/summary$/,
    /^\/api\/authority\/(?:manifests|signed-records|signed-review-records)\/([^/]+)\/summary$/,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(pathname);

    if (match !== null) {
      return match[1];
    }
  }

  return null;
}

function jsonForManifestSummary(manifestId: string): { status: number; body: unknown } {
  if (manifestId === FIXTURE_MANIFEST_ID) {
    return { status: 200, body: fixtureManifestSummary() };
  }

  if (manifestId === SHOWCASE_STATIC_DEMO_MANIFEST_ID) {
    return { status: 200, body: fixtureManifestSummaryForShowcase(SHOWCASE_DEMO_RUN_ID) };
  }

  if (manifestId === FIXTURE_MANIFEST_EMPTY_ARTIFACTS_ID) {
    return { status: 200, body: fixtureManifestSummaryEmptyArtifacts() };
  }

  return { status: 404, body: { detail: "Review record not found." } };
}

function tryParseArtifactListPath(pathname: string): string | null {
  const patterns = [
    /^\/v1\/artifacts\/(?:manifests|signed-records|signed-review-records)\/([^/]+)$/,
    /^\/api\/artifacts\/(?:manifests|signed-records|signed-review-records)\/([^/]+)$/,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(pathname);

    if (match !== null) {
      return match[1];
    }
  }

  return null;
}

function jsonForArtifactList(manifestId: string): unknown {
  if (manifestId === FIXTURE_MANIFEST_ID) {
    return fixtureArtifactDescriptorsNonEmpty();
  }

  if (manifestId === SHOWCASE_STATIC_DEMO_MANIFEST_ID) {
    return fixtureArtifactDescriptorsForShowcase(SHOWCASE_DEMO_RUN_ID);
  }

  if (manifestId === FIXTURE_MANIFEST_EMPTY_ARTIFACTS_ID) {
    return [];
  }

  return [];
}

function jsonRunSummaryFromDetail(detail: RunDetail): unknown {
  const r = detail.run;

  return {
    runId: r.runId,
    projectId: r.projectId,
    description: r.description,
    createdUtc: r.createdUtc,
    contextSnapshotId: r.contextSnapshotId,
    graphSnapshotId: r.graphSnapshotId,
    findingsSnapshotId: r.findingsSnapshotId,
    goldenManifestId: r.goldenManifestId,
    decisionTraceId: r.decisionTraceId,
    artifactBundleId: r.artifactBundleId,
    hasContextSnapshot: Boolean(r.contextSnapshotId),
    hasGraphSnapshot: Boolean(r.graphSnapshotId),
    hasFindingsSnapshot: Boolean(r.findingsSnapshotId),
    hasGoldenManifest: Boolean(r.goldenManifestId),
    hasDecisionTrace: Boolean(r.decisionTraceId),
    hasArtifactBundle: Boolean(r.artifactBundleId),
    runDegradedExecution: detail.runDegradedExecution === true,
    degradedExecutionAgents: Array.isArray(detail.degradedExecutionAgents)
      ? detail.degradedExecutionAgents
      : [],
  };
}

function jsonCriticalPageBundleForRunId(runId: string): unknown | null {
  const detail = resolveRunDetailBodyForRunId(runId);

  if (detail === null) {
    return null;
  }

  const manifestId = typeof detail.run.goldenManifestId === "string" ? detail.run.goldenManifestId.trim() : "";
  const manifestPayload =
    manifestId.length > 0 ? jsonForManifestSummary(manifestId) : { status: 200, body: null as unknown };

  return {
    buyerSummary: toMockBuyerRunDetailSummary(detail),
    progressSummary: jsonRunSummaryFromDetail(detail),
    manifestSummary: manifestPayload.status === 200 ? manifestPayload.body : null,
    artifacts: manifestId.length > 0 ? jsonForArtifactList(manifestId) : [],
  };
}

/**
 * Minimal HTTP stub for ArchLucid API routes used by RSC run/manifest pages and `/policy-packs` reads.
 *
 * Mock E2E builds run with `NEXT_PUBLIC_DEMO_MODE=true` / `NEXT_PUBLIC_DEMO_STATIC_OPERATOR=true`, so the operator
 * `/policy-packs` page renders the buyer-polished shell — operator-only Create/Publish/Assign controls are hidden.
 * Lifecycle mutations are exercised by `live-api-policy-pack-lifecycle.spec.ts` against the real API instead, so this
 * stub only serves the read endpoints the buyer-polished page calls during render.
 */
export function startMockArchlucidApiServer(port: number): Promise<{ stop: () => Promise<void> }> {
  const host = "127.0.0.1";

  const server = http.createServer((req, res) => {
    void (async () => {
      const u = new URL(req.url ?? "/", `http://${host}`);

      if (req.method === "GET" && u.pathname === "/health/ready") {
        sendJson(res, 200, { status: "Healthy", entries: [] as { name: string; status: string }[] });
        return;
      }

      if (req.method === "GET" && u.pathname === "/version") {
        sendJson(res, 200, { application: "ArchLucid", informationalVersion: "e2e-mock" });
        return;
      }

      if (req.method === "GET" && u.pathname === "/health") {
        const acc = req.headers.accept ?? "";
        if (acc.includes("application/json")) {
          sendJson(res, 200, {
            status: "Healthy",
            entries: [{ name: "database", status: "Healthy" }],
          });
          return;
        }
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("ok");
        return;
      }

      if (req.method === "GET" && u.pathname === "/health/diagnostics") {
        const acc = req.headers.accept ?? "";
        if (acc.includes("application/json")) {
          sendJson(res, 200, {
            status: "Healthy",
            totalDurationMs: 0,
            entries: [{ name: "circuit_breakers", status: "Healthy", data: { gates: [] as unknown[] } }],
          });
          return;
        }
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("ok");
        return;
      }

      if (req.method === "GET" && u.pathname === "/api/auth/me") {
        const mockMeRole = process.env.MOCK_AUTH_ME_ROLE?.trim() || "Admin";
        sendJson(res, 200, {
          name: "E2E mock operator",
          claims: [{ type: "roles", value: mockMeRole }],
          /** Unlocks operate-analysis / operate-governance nav after collapsed-pilot expand in mock E2E. */
          hasCommittedArchitectureReview: true,
        });

        return;
      }

      const pathname = decodeURIComponent(u.pathname);

      if (req.method === "GET" && pathname === "/v1/public/demo/sample-run") {
        sendJson(res, 404, { detail: "Not available in E2E mock" });
        return;
      }

      const showcaseMatch = /^\/v1\/marketing\/showcase\/(.+)$/.exec(pathname);

      if (req.method === "GET" && showcaseMatch) {
        sendJson(res, 200, getShowcaseStaticDemoPayload(decodeURIComponent(showcaseMatch[1])));
        return;
      }

      if (req.method === "GET" && pathname === "/v1/demo/explain") {
        const runExplanation = fixtureRunExplanationSummary();
        sendJson(res, 200, {
          generatedUtc: "2026-01-15T14:30:00.000Z",
          runId: "customer-intake-modernization",
          manifestVersion: "3.4.1",
          isDemoData: true,
          demoStatusMessage: "Demonstration — Enterprise Customer Intake Modernization",
          runExplanation,
          provenanceGraph: {
            nodes: [
              { id: "n1", label: "Request intake", type: "Context" },
              { id: "n2", label: "Policy evaluation", type: "Decision" },
              { id: "n3", label: "Finalized review", type: "Manifest" },
            ],
            edges: [
              { source: "n1", target: "n2", type: "derives" },
              { source: "n2", target: "n3", type: "finalizes" },
            ],
            nodeCount: 3,
            edgeCount: 2,
            isEmpty: false,
          },
        });
        return;
      }

      if (req.method === "GET" && pathname === "/v1/policy-packs") {
        sendJson(res, 200, listMockPacks());
        return;
      }

      if (req.method === "GET" && pathname === "/v1/policy-packs/effective") {
        sendJson(res, 200, getMockEffectivePacks());
        return;
      }

      if (req.method === "GET" && pathname === "/v1/policy-packs/effective-content") {
        sendJson(res, 200, getMockEffectiveContent());
        return;
      }

      const versionsMatch = /^\/v1\/policy-packs\/([^/]+)\/versions$/.exec(pathname);

      if (req.method === "GET" && versionsMatch) {
        sendJson(res, 200, listMockVersions(versionsMatch[1]));
        return;
      }

      const runsPagedMatchV1 = /^\/v1\/authority\/projects\/([^/]+)\/(?:runs|reviews)$/.exec(pathname);

      if (req.method === "GET" && runsPagedMatchV1) {
        const pageNum = Math.max(1, Number.parseInt(u.searchParams.get("page") ?? "1", 10) || 1);
        const pageSize = Math.min(200, Math.max(1, Number.parseInt(u.searchParams.get("pageSize") ?? "20", 10) || 20));
        /**
         * Empty page keeps **demo / mock E2E** aligned with `tryStaticDemoRunSummariesPaged`:
         * `/reviews` SSR injects the Customer Intake showcase row + `OperatorDemoStaticBanner` when
         * `NEXT_PUBLIC_DEMO_MODE` / static-operator flags are on. Returning a non-empty "live" page skips that path,
         * shrinks the document (~full-page screenshots), and breaks `chromium-visual` goldens.
         *
         * Client pickers use `loadProjectRunsMergedWithDemoFallback` (`afterEmptyLiveList`); sponsor/admin SSR uses
         * demo fallback when the live list is empty and demo mode is enabled.
         */
        sendJson(res, 200, {
          items: [],
          totalCount: 0,
          page: pageNum,
          pageSize,
          hasMore: false,
        });
        return;
      }

      if (req.method === "GET" && pathname === "/v1/audit/event-types") {
        sendJson(res, 200, ["Authority.RunCompleted", "Policy.PackPublished"]);
        return;
      }

      if (req.method === "GET" && pathname === "/v1/audit/search") {
        const requestedTake = Math.min(
          200,
          Math.max(1, Number.parseInt(u.searchParams.get("take") ?? "200", 10) || 200),
        );
        const items = getDemoSampleAuditTrailEvents();

        sendJson(res, 200, {
          items: items.slice(0, requestedTake),
          nextCursor: null,
          hasMore: false,
          requestedTake,
        });
        return;
      }

      if (req.method === "GET" && pathname === "/v1/alerts/inbox-summary") {
        sendJson(res, 200, {
          openCount: 0,
          acknowledgedCount: 0,
          resolvedCount: 0,
          blockingCount: 0,
          lastEvaluatedUtc: null,
        });
        return;
      }

      if (req.method === "GET" && pathname === "/v1/alerts") {
        const pageNum = Math.max(1, Number.parseInt(u.searchParams.get("page") ?? "1", 10) || 1);
        const pageSize = Math.min(200, Math.max(1, Number.parseInt(u.searchParams.get("pageSize") ?? "25", 10) || 25));
        sendJson(res, 200, {
          items: [],
          totalCount: 0,
          page: pageNum,
          pageSize,
          hasMore: false,
        });
        return;
      }

      if (req.method === "GET" && pathname === "/v1/tenant/trial-status") {
        /**
         * Functional mock specs (e.g. core-pilot-path) assert operator-home chrome that renders only when the
         * page stays on `/`. `TrialWelcomeRunDeepLink` redirects home → `/architecture/reviews/{trialWelcomeRunId}` whenever
         * the API exposes a welcome run, so we null it out here. Specs that exercise the welcome redirect supply
         * their own `page.route` override (trial-funnel) or prime the sessionStorage guard (pilot-nav-profile).
         * Remaining fields mirror the screenshot fallback so trial-banner reads stay populated.
         */
        const trialStatus = getScreenshotMockFallbackGetJson(pathname, u.search) as Record<string, unknown>;

        sendJson(res, 200, { ...trialStatus, trialWelcomeRunId: null });
        return;
      }

      if (req.method === "POST" && pathname === "/v1/reviews/demo") {
        sendJson(res, 200, operatorDemoReviewApiResponse());
        return;
      }

      if (req.method === "POST" && pathname === "/v1/ask") {
        sendJson(res, 200, {
          threadId: randomUUID(),
          answer: "Mock answer from E2E stub.",
          referencedDecisions: [] as string[],
          referencedFindings: [] as string[],
          referencedArtifacts: [] as string[],
        });
        return;
      }

      if (req.method === "POST" && pathname === "/v1/governance/recurrence-schedules/preview-next-runs") {
        sendJson(res, 200, {
          isValid: true,
          validationError: null,
          nextRunUtc: ["2026-08-25T12:00:00.000Z"],
        });
        return;
      }

      if (req.method === "GET" && pathname === "/v1/governance/recurrence-schedules") {
        sendJson(res, 200, []);
        return;
      }

      const policyPackVersionMatch = /^\/v1\/policy-packs\/([^/]+)\/versions\/([^/]+)$/.exec(pathname);

      if (req.method === "GET" && policyPackVersionMatch) {
        sendJson(res, 200, {
          policyPackVersionId: `${policyPackVersionMatch[1]}-${policyPackVersionMatch[2]}`,
          policyPackId: policyPackVersionMatch[1],
          version: policyPackVersionMatch[2],
          contentJson: JSON.stringify(getMockEffectiveContent()),
          createdUtc: "2026-01-01T00:00:00.000Z",
          isPublished: true,
        });
        return;
      }

      /** Fire-and-forget client telemetry; real API accepts POST — avoid 405 noise in screenshot / mock E2E. */
      if (
        req.method === "POST" &&
        (pathname === "/v1/diagnostics/client-error" ||
          pathname === "/v1/diagnostics/first-tenant-funnel" ||
          pathname === "/v1/diagnostics/core-pilot-rail-step" ||
          pathname === "/v1/diagnostics/sponsor-banner-first-commit-badge")
      ) {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method !== "GET") {
        res.writeHead(405);
        res.end();
        return;
      }

      // RSC server-side fetch uses `getServerApiBaseUrl()` → these paths (see `src/lib/api.ts`).
      // ADR 0064 renamed the authority run routes to `/reviews`; both spellings stay matched so a
      // caller left on the old path still gets fixture data instead of the generic fallback body.
      const buyerSummaryMatchV1 = /^\/v1\/authority\/(?:runs|reviews)\/([^/]+)\/buyer-summary$/.exec(pathname);
      const buyerSummaryMatchLegacy = /^\/api\/authority\/(?:runs|reviews)\/([^/]+)\/buyer-summary$/.exec(pathname);
      const buyerSummaryMatch = buyerSummaryMatchV1 ?? buyerSummaryMatchLegacy;

      if (buyerSummaryMatch) {
        const detail = resolveRunDetailBodyForRunId(buyerSummaryMatch[1]);

        if (detail === null) {
          sendJson(res, 404, { detail: "Review not found." });
        } else {
          sendJson(res, 200, toMockBuyerRunDetailSummary(detail));
        }

        return;
      }

      const criticalBundleMatchV1 =
        /^\/v1\/authority\/(?:runs|reviews)\/([^/]+)\/critical-page-bundle$/.exec(pathname);
      const criticalBundleMatchLegacy =
        /^\/api\/authority\/(?:runs|reviews)\/([^/]+)\/critical-page-bundle$/.exec(pathname);
      const criticalBundleMatch = criticalBundleMatchV1 ?? criticalBundleMatchLegacy;

      if (criticalBundleMatch) {
        const bundle = jsonCriticalPageBundleForRunId(criticalBundleMatch[1]);

        if (bundle === null) {
          sendJson(res, 404, { detail: "Review not found." });
        } else {
          sendJson(res, 200, bundle);
        }

        return;
      }

      const timelinesBundleMatch =
        /^\/v1\/authority\/(?:runs|reviews)\/([^/]+)\/timelines-bundle$/.exec(pathname) ??
        /^\/api\/authority\/(?:runs|reviews)\/([^/]+)\/timelines-bundle$/.exec(pathname);

      if (timelinesBundleMatch) {
        sendJson(res, 200, { pipelineTimeline: [], stageTimeline: [] });
        return;
      }

      const workspaceContextMatch =
        /^\/v1\/authority\/(?:runs|reviews)\/([^/]+)\/workspace-context-bundle$/.exec(pathname) ??
        /^\/api\/authority\/(?:runs|reviews)\/([^/]+)\/workspace-context-bundle$/.exec(pathname);

      if (workspaceContextMatch) {
        sendJson(res, 200, {
          recentProjectRuns: [],
          priorCommittedRunComparison: null,
          priorCommittedRunId: null,
          priorCommittedRunCreatedUtc: null,
        });
        return;
      }

      const runMatchV1 = /^\/v1\/authority\/(?:runs|reviews)\/([^/]+)$/.exec(pathname);
      const runMatchLegacy = /^\/api\/authority\/(?:runs|reviews)\/([^/]+)$/.exec(pathname);
      const runMatch = runMatchV1 ?? runMatchLegacy;

      if (runMatch) {
        const detail = resolveRunDetailBodyForRunId(runMatch[1]);

        if (detail === null) {
          sendJson(res, 404, { detail: "Review not found." });
        } else {
          sendJson(res, 200, detail);
        }

        return;
      }

      const runSummaryMatchV1 = /^\/v1\/authority\/(?:runs|reviews)\/([^/]+)\/summary$/.exec(pathname);
      const runSummaryMatchLegacy = /^\/api\/authority\/(?:runs|reviews)\/([^/]+)\/summary$/.exec(pathname);
      const runSummaryMatch = runSummaryMatchV1 ?? runSummaryMatchLegacy;

      if (runSummaryMatch) {
        const rid = runSummaryMatch[1];

        if (rid === FIXTURE_RUN_ID) {
          sendJson(res, 200, jsonRunSummaryFromDetail(fixtureRunDetail()));
          return;
        }

        if (rid === MOCK_TRIAL_WELCOME_RUN_ID) {
          sendJson(res, 200, jsonRunSummaryFromDetail(fixtureRunDetailForRunId(MOCK_TRIAL_WELCOME_RUN_ID)));
          return;
        }

        if (rid === SHOWCASE_DEMO_RUN_ID || rid === SCREENSHOT_RUN_ID) {
          sendJson(res, 200, jsonRunSummaryFromDetail(fixtureRunDetailAlignedToShowcase(rid)));
          return;
        }

        if (rid === OPERATOR_DEMO_REVIEW_RUN_ID) {
          sendJson(res, 200, jsonRunSummaryFromDetail(fixtureOperatorDemoReviewRunDetail(rid)));
          return;
        }

        sendJson(res, 404, { detail: "Run summary not found." });
        return;
      }

      const explainAggregateMatch = /^\/v1\/explain\/runs\/([^/]+)\/aggregate$/.exec(pathname);

      if (explainAggregateMatch) {
        const runId = explainAggregateMatch[1];
        /** `getScreenshotMockFallbackGetJson` measured-roi uses `demoRunId: "demo"` — keep in sync. */
        const aggregateFixtureRunIds = new Set<string>([
          FIXTURE_RUN_ID,
          MOCK_TRIAL_WELCOME_RUN_ID,
          "demo",
          SHOWCASE_DEMO_RUN_ID,
          SCREENSHOT_RUN_ID,
          OPERATOR_DEMO_REVIEW_RUN_ID,
        ]);

        if (aggregateFixtureRunIds.has(runId)) {
          sendJson(res, 200, fixtureRunExplanationSummary());
        }
        else {
          sendJson(res, 404, { detail: "Aggregate explanation not found." });
        }

        return;
      }

      const manifestSummaryManifestId = tryParseManifestSummaryPath(pathname);

      if (manifestSummaryManifestId !== null) {
        const summaryPayload = jsonForManifestSummary(manifestSummaryManifestId);
        sendJson(res, summaryPayload.status, summaryPayload.body);

        return;
      }

      const artifactListManifestId = tryParseArtifactListPath(pathname);

      if (artifactListManifestId !== null) {
        sendJson(res, 200, jsonForArtifactList(artifactListManifestId));

        return;
      }

      const stageTimelineMatch = /^\/v1\/architecture\/run\/([^/]+)\/stage-timeline$/.exec(pathname);

      if (stageTimelineMatch) {
        sendJson(res, 200, []);
        return;
      }

      if (isGraphUpstreamPath(pathname)) {
        sendJson(res, 200, getEmptyGraphViewModelJson());
        return;
      }

      if (/^\/v1\/pilots\/runs\/[^/]+\/first-value-report$/.test(pathname)) {
        const accept = req.headers.accept ?? "";
        if (accept.includes("text/markdown")) {
          res.writeHead(200, { "Content-Type": "text/markdown; charset=utf-8" });
          res.end("# Mock first value report\n");
          return;
        }
        sendJson(res, 200, { detail: "Expected Accept: text/markdown" });
        return;
      }

      if (pathname.startsWith("/v1/") || pathname.startsWith("/api/authority/") || pathname.startsWith("/api/artifacts/")) {
        sendJson(res, 200, getScreenshotMockFallbackGetJson(pathname, u.search));
        return;
      }

      sendJson(res, 404, { detail: "E2E mock: no handler for this path." });
    })().catch(() => {
      sendJson(res, 500, { detail: "E2E mock internal error" });
    });
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      resolve({
        stop: () =>
          new Promise((res, rej) => {
            server.close((err) => {
              if (err) {
                rej(err);
              } else {
                res();
              }
            });
          }),
      });
    });
  });
}
