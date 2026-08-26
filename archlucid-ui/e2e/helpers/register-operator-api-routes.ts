import type { Page, Route } from "@playwright/test";

import type { ComparisonExplanation } from "@/types/explanation";
import type { GoldenManifestComparison } from "@/types/comparison";
import type { ArtifactDescriptor, ManifestSummary, RunComparison, RunDetail } from "@/types/authority";

import { getIdentityProvidersPageBundleMockJson } from "../fixtures/identity-providers-page-bundle-mock";
import { getDemoSampleAuditTrailEvents } from "@/lib/demo-audit-sample-events";
import {
  getMockEffectiveContent,
  listMockPacks,
} from "../policy-packs-mock-state";
import {
  fixtureArtifactDescriptorsNonEmpty,
  fixtureCompareLeftRunManifestDocument,
  fixtureCompareRightRunManifestDocument,
  fixtureComparisonExplanation,
  fixtureConversationThreads,
  fixtureGoldenManifestComparison,
  fixtureLegacyRunComparison,
  fixtureManifestSummary,
  fixtureRunDetail,
  FIXTURE_LEFT_RUN_ID,
  FIXTURE_MANIFEST_ID,
  FIXTURE_RIGHT_RUN_ID,
  FIXTURE_RUN_ID,
} from "../fixtures";
import { fixtureComparePickerRunsPageForStaleInputWarning } from "../fixtures/compare-picker-runs-page";
import {
  backendApiPath,
  matchesArtifactBundleGet,
  matchesArtifactListGet,
  matchesAuthorityProjectRunsPagedGet,
  matchesAuthorityReviewsInScopePagedGet,
  matchesAuthorityRunManifestGet,
  matchesBuyerRunDetailSummaryGet,
  matchesCompareExplainGet,
  matchesLegacyCompareRunsGet,
  matchesManifestSummaryGet,
  matchesRunDetailGet,
  matchesStructuredCompareGet,
} from "./route-match";

/** PKZIP empty archive (22-byte EOCD) — valid for download smoke without a real compressor. */
export const FIXTURE_EMPTY_ZIP_BYTES = Buffer.from([
  0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00,
]);

export type RunDetailRouteSpec = { runId: string; body: RunDetail };

export type ManifestSummaryRouteSpec = { manifestId: string; body: ManifestSummary };

export type ArtifactListRouteSpec = { manifestId: string; body: ArtifactDescriptor[] };

export type LegacyCompareRouteSpec = {
  leftRunId: string;
  rightRunId: string;
  body: RunComparison;
};

export type StructuredCompareRouteSpec = {
  baseRunId: string;
  targetRunId: string;
  body: GoldenManifestComparison;
};

export type AuthorityRunManifestRouteSpec = {
  runId: string;
  body: unknown;
};

export type CompareExplanationRouteSpec = {
  baseRunId: string;
  targetRunId: string;
  body: ComparisonExplanation;
};

export type ArtifactBundleRouteSpec = {
  manifestId: string;
  /** Defaults to {@link FIXTURE_EMPTY_ZIP_BYTES}. */
  body?: Buffer;
  /** When true, HEAD returns 200 with Content-Length and no body. */
  headOk?: boolean;
};

export type OperatorJourneyRouteConfig = {
  runDetail?: RunDetailRouteSpec | null;
  manifestSummary?: ManifestSummaryRouteSpec | null;
  artifactList?: ArtifactListRouteSpec | null;
  legacyCompare?: LegacyCompareRouteSpec | null;
  structuredCompare?: StructuredCompareRouteSpec | null;
  authorityRunManifests?: readonly AuthorityRunManifestRouteSpec[] | null;
  compareExplanation?: CompareExplanationRouteSpec | null;
  artifactBundle?: ArtifactBundleRouteSpec | null;
  /** Stubs `GET /v1/authority/projects/{projectId}/reviews` and scope-wide `GET /v1/authority/reviews` (Compare RunIdPicker). */
  projectRunsPaged?: { projectId: string; body: unknown } | null;
};

async function fulfillJson(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

export async function registerOperatorJourneyApiRoutes(
  page: Page,
  config: OperatorJourneyRouteConfig,
): Promise<void> {
  await page.route("**/*", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();

    if (backendApiPath(url) === null) {
      await route.continue();
      return;
    }

    const tryFulfill = async (): Promise<boolean> => {
      if (
        config.projectRunsPaged &&
        method === "GET" &&
        (matchesAuthorityProjectRunsPagedGet(url, config.projectRunsPaged.projectId) ||
          matchesAuthorityReviewsInScopePagedGet(url))
      ) {
        await fulfillJson(route, 200, config.projectRunsPaged.body);
        return true;
      }

      if (
        config.runDetail &&
        method === "GET" &&
        (matchesRunDetailGet(url, config.runDetail.runId) ||
          matchesBuyerRunDetailSummaryGet(url, config.runDetail.runId))
      ) {
        await fulfillJson(route, 200, config.runDetail.body);
        return true;
      }

      if (
        config.manifestSummary &&
        method === "GET" &&
        matchesManifestSummaryGet(url, config.manifestSummary.manifestId)
      ) {
        await fulfillJson(route, 200, config.manifestSummary.body);
        return true;
      }

      if (config.artifactList && method === "GET" && matchesArtifactListGet(url, config.artifactList.manifestId)) {
        await fulfillJson(route, 200, config.artifactList.body);
        return true;
      }

      if (
        config.legacyCompare &&
        method === "GET" &&
        matchesLegacyCompareRunsGet(url, config.legacyCompare.leftRunId, config.legacyCompare.rightRunId)
      ) {
        await fulfillJson(route, 200, config.legacyCompare.body);
        return true;
      }

      if (
        config.structuredCompare &&
        method === "GET" &&
        matchesStructuredCompareGet(url, config.structuredCompare.baseRunId, config.structuredCompare.targetRunId)
      ) {
        await fulfillJson(route, 200, config.structuredCompare.body);
        return true;
      }

      if (config.authorityRunManifests && method === "GET") {
        for (const spec of config.authorityRunManifests) {
          if (matchesAuthorityRunManifestGet(url, spec.runId)) {
            await fulfillJson(route, 200, spec.body);
            return true;
          }
        }
      }

      if (
        config.compareExplanation &&
        method === "GET" &&
        matchesCompareExplainGet(url, config.compareExplanation.baseRunId, config.compareExplanation.targetRunId)
      ) {
        await fulfillJson(route, 200, config.compareExplanation.body);
        return true;
      }

      if (config.artifactBundle && matchesArtifactBundleGet(url, config.artifactBundle.manifestId)) {
        const zip = config.artifactBundle.body ?? FIXTURE_EMPTY_ZIP_BYTES;

        if (method === "HEAD" && config.artifactBundle.headOk) {
          await route.fulfill({
            status: 200,
            headers: { "Content-Type": "application/zip", "Content-Length": String(zip.length) },
          });
          return true;
        }

        if (method === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/zip",
            body: zip,
          });
          return true;
        }
      }

      if (method === "GET" && backendApiPath(url) === "/v1/audit/event-types") {
        await fulfillJson(route, 200, [
          "RunStarted",
          "context.snapshot.created",
          "graph.snapshot.created",
          "findings.snapshot.created",
          "ManifestGenerated",
          "GovernanceApprovalApproved",
          "RunExported",
        ]);

        return true;
      }

      if (method === "GET" && backendApiPath(url) === "/v1/audit/search") {
        const requestedTake = Math.min(
          200,
          Math.max(1, Number.parseInt(url.searchParams.get("take") ?? "200", 10) || 200),
        );
        const items = getDemoSampleAuditTrailEvents();

        await fulfillJson(route, 200, {
          items: items.slice(0, requestedTake),
          nextCursor: null,
          hasMore: false,
          requestedTake,
        });

        return true;
      }

      return false;
    };

    const handled = await tryFulfill();
    if (!handled) {
      await route.continue();
    }
  });
}

/** Legacy + structured compare for the default E2E left/right run IDs (no AI explain route). */
export function defaultFixturePairLegacyStructuredCompareConfig(): Pick<
  OperatorJourneyRouteConfig,
  "legacyCompare" | "structuredCompare" | "authorityRunManifests"
> {
  return {
    legacyCompare: {
      leftRunId: FIXTURE_LEFT_RUN_ID,
      rightRunId: FIXTURE_RIGHT_RUN_ID,
      body: fixtureLegacyRunComparison(),
    },
    structuredCompare: {
      baseRunId: FIXTURE_LEFT_RUN_ID,
      targetRunId: FIXTURE_RIGHT_RUN_ID,
      body: fixtureGoldenManifestComparison(),
    },
    authorityRunManifests: [
      { runId: FIXTURE_LEFT_RUN_ID, body: fixtureCompareLeftRunManifestDocument() },
      { runId: FIXTURE_RIGHT_RUN_ID, body: fixtureCompareRightRunManifestDocument() },
    ],
  };
}

/** Client compare page: mock legacy + structured GETs for the standard fixture pair. */
export async function registerDefaultPairLegacyStructuredCompare(page: Page): Promise<void> {
  await registerOperatorJourneyApiRoutes(page, defaultFixturePairLegacyStructuredCompareConfig());
}

/**
 * Compare stale-input warning journey: fixture pair mocks **plus** a non-empty runs list so buyer-polished readonly
 * comboboxes can switch selection via dropdown options (typing is disabled).
 */
export async function registerCompareStaleInputWarningRoutes(page: Page): Promise<void> {
  await registerOperatorJourneyApiRoutes(page, {
    ...defaultFixturePairLegacyStructuredCompareConfig(),
    projectRunsPaged: { projectId: "default", body: fixtureComparePickerRunsPageForStaleInputWarning() },
  });
}

/** Default fixture pair: run + manifest + artifacts + bundle (for future run/manifest journey tests from the browser). */
export async function registerDefaultRunManifestArtifactRoutes(page: Page): Promise<void> {
  await registerOperatorJourneyApiRoutes(page, {
    runDetail: { runId: FIXTURE_RUN_ID, body: fixtureRunDetail() },
    manifestSummary: { manifestId: FIXTURE_MANIFEST_ID, body: fixtureManifestSummary() },
    artifactList: { manifestId: FIXTURE_MANIFEST_ID, body: fixtureArtifactDescriptorsNonEmpty() },
    artifactBundle: { manifestId: FIXTURE_MANIFEST_ID, body: FIXTURE_EMPTY_ZIP_BYTES, headOk: true },
  });
}

/** Compare page (client): legacy + structured + optional AI explanation GETs. */
export async function registerCompareAndExplainRoutes(page: Page): Promise<void> {
  await registerOperatorJourneyApiRoutes(page, {
    ...defaultFixturePairLegacyStructuredCompareConfig(),
    compareExplanation: {
      baseRunId: FIXTURE_LEFT_RUN_ID,
      targetRunId: FIXTURE_RIGHT_RUN_ID,
      body: fixtureComparisonExplanation(),
    },
  });
}

/**
 * Stubs generic `/api/proxy` GETs used by full-route screenshot crawls when no backend is reachable.
 * Register **after** {@link registerOperatorJourneyApiRoutes} so this handler runs first (Playwright matches last registered routes first).
 */
export async function registerScreenshotSuiteProxyRoutes(page: Page): Promise<void> {
  await page.route("**/*", async (route) => {
    const req = route.request();

    if (req.method() !== "GET") {
      await route.fallback();

      return;
    }

    const url = new URL(req.url());
    const apiPath = backendApiPath(url);

    if (apiPath === null) {
      await route.fallback();

      return;
    }

    if (apiPath === "/health/ready") {
      await fulfillJson(route, 200, {
        status: "Healthy",
        entries: [{ name: "database", status: "Healthy", durationMs: 12 }],
      });

      return;
    }

    if (apiPath === "/version") {
      await fulfillJson(route, 200, {
        informationalVersion: "e2e-screenshots",
        commitSha: "e2e000000000000000000000000000000000000",
      });

      return;
    }

    if (apiPath === "/health") {
      await fulfillJson(route, 200, {
        status: "Healthy",
        entries: [{ name: "database", status: "Healthy" }],
      });

      return;
    }

    if (apiPath === "/v1/admin/diagnostics/identity-providers-page-bundle") {
      await fulfillJson(route, 200, getIdentityProvidersPageBundleMockJson());

      return;
    }

    if (apiPath === "/health/diagnostics") {
      await fulfillJson(route, 200, {
        status: "Healthy",
        totalDurationMs: 1,
        version: "e2e-screenshots",
        commitSha: "e2e000000000000000000000000000000000000",
        entries: [
          {
            name: "circuit_breakers",
            status: "Healthy",
            durationMs: 1,
            data: {
              gates: [{ name: "completion", state: "Closed", breakDurationSeconds: 0 }],
            },
          },
        ],
      });

      return;
    }

    if (apiPath === "/v1/diagnostics/operator-task-success-rates") {
      await fulfillJson(route, 200, {
        windowNote: "E2E screenshot fixture.",
        firstRunCommittedTotal: 1,
        firstSessionCompletedTotal: 2,
        firstRunCommittedPerSessionRatio: 0.5,
      });

      return;
    }

    if (apiPath === "/api/auth/me") {
      await fulfillJson(route, 200, {
        name: "E2E screenshot operator",
        claims: [{ type: "roles", value: "Admin" }],
        hasCommittedArchitectureReview: true,
      });

      return;
    }

    if (apiPath === "/v1/conversations" && url.searchParams.has("take")) {
      await fulfillJson(route, 200, fixtureConversationThreads());

      return;
    }

    if (/^\/v1\/conversations\/[^/]+\/messages$/u.test(apiPath) && url.searchParams.has("take")) {
      await fulfillJson(route, 200, []);

      return;
    }

    if (apiPath === "/v1/authority/projects/default/reviews") {
      await fulfillJson(route, 200, {
        items: [],
        totalCount: 0,
        page: Number(url.searchParams.get("page") ?? "1"),
        pageSize: Number(url.searchParams.get("pageSize") ?? "50"),
        hasMore: false,
      });

      return;
    }

    if (apiPath === "/v1/audit/event-types") {
      await fulfillJson(route, 200, [
        "RunStarted",
        "context.snapshot.created",
        "graph.snapshot.created",
        "findings.snapshot.created",
        "ManifestGenerated",
        "GovernanceApprovalApproved",
        "RunExported",
      ]);

      return;
    }

    /**
     * Audit log: Playwright stubs return the Customer Intake trail so screenshots never depend on build-time demo merge
     * (see `screenshot-demo-quality-gates` — forbid "Showing 0 events").
     */
    if (apiPath === "/v1/audit/search") {
      const requestedTake = Math.min(200, Math.max(1, Number.parseInt(url.searchParams.get("take") ?? "200", 10) || 200));
      const items = getDemoSampleAuditTrailEvents();

      await fulfillJson(route, 200, {
        items: items.slice(0, requestedTake),
        nextCursor: null,
        hasMore: false,
        requestedTake,
      });

      return;
    }

    await route.fallback();
  });
}

/** Policy pack detail reads — route-level stub avoids flake when the shared loopback mock is contended. */
export async function registerPolicyPackDetailRoutes(page: Page): Promise<void> {
  await page.route("**/api/proxy/**", async (route) => {
    const req = route.request();

    if (req.method() !== "GET") {
      await route.fallback();

      return;
    }

    const url = new URL(req.url());
    const apiPath = backendApiPath(url);

    if (apiPath === null) {
      await route.fallback();

      return;
    }

    if (apiPath === "/v1/policy-packs") {
      await fulfillJson(route, 200, listMockPacks());

      return;
    }

    if (apiPath === "/v1/policy-packs/workspace-selection") {
      await fulfillJson(route, 200, []);

      return;
    }

    const versionMatch = /^\/v1\/policy-packs\/([^/]+)\/versions\/([^/]+)$/.exec(apiPath);

    if (versionMatch) {
      await fulfillJson(route, 200, {
        policyPackVersionId: `${versionMatch[1]}-${versionMatch[2]}`,
        policyPackId: versionMatch[1],
        version: versionMatch[2],
        contentJson: JSON.stringify(getMockEffectiveContent()),
        createdUtc: "2026-01-01T00:00:00.000Z",
        isPublished: true,
      });

      return;
    }

    await route.fallback();
  });
}
