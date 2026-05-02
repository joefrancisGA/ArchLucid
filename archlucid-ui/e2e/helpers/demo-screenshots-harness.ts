/**
 * Preflight, failure scanning, filenames, and report output for {@link ../live-api-demo-screenshots.spec.ts}.
 */
import * as fs from "node:fs";
import * as path from "node:path";

import type { APIRequestContext, Page } from "@playwright/test";

import {
  getGraphForRunRaw,
  liveAcceptHeaders,
  liveApiBase,
  listRecentAudit,
  toRunGuidPathSegment,
} from "./live-api-client";

/** Substrings that indicate demo-unsafe or broken UI — case-sensitive match on visible text. */
export const DEMO_SCREENSHOT_FAILURE_SUBSTRINGS: readonly string[] = [
  "This architecture review could not be loaded",
  "No reviews in this workspace yet",
  "No graph on screen yet",
  "Loading graph viewer",
  "Loading workflow data",
  "Loading alerts",
  "Registered packs 0",
  "Effective layers 0",
  "Selected pack —",
  "No audit events",
  "No matching alerts",
  "Platform services: Healthy on an error page",
  "NEXT_PUBLIC_",
  "API-enforced",
  "client-only bundle",
  "not wired in this build",
  "coming soon",
];

/** Repo root (ArchLucid) from `archlucid-ui/e2e/**.ts`. */
export function demoScreenshotsRepoRoot(): string {
  return path.resolve(__dirname, "..", "..", "..");
}

export function demoScreenshotsOutputDir(timestamp: string): string {
  return path.join(demoScreenshotsRepoRoot(), "artifacts", "screenshots", timestamp);
}

/** Deterministic ordering — `/runs?projectId=default` is the supported reviews list URL (not `/runs/projectId/default`). */
export const DEMO_SCREENSHOT_ROUTES: readonly string[] = [
  "/",
  "/runs?projectId=default",
  "/runs/claims-intake-modernization-run",
  "/manifests/a1c2e3f4-a5b6-7890-abcd-ef1234567890",
  "/runs/claims-intake-modernization-run/findings/phi-minimization-risk",
  "/graph",
  "/ask",
  "/governance",
  "/audit",
  "/alerts",
  "/policy-packs",
  "/see-it",
  "/demo/preview",
];

export type PreflightCheck = { name: string; ok: boolean; detail?: string };

export type DemoPreflightResult = {
  ok: boolean;
  checks: PreflightCheck[];
  claimsRunIdForApi: string;
  graphRunSegment: string;
  alertsDemoReady: boolean;
  alertCount: number;
};

/** Canonical Claims Intake slug used by API + static demo (see `showcase-static-demo.ts`). */
export const CLAIMS_INTAKE_CANONICAL_RUN_ID = "claims-intake-modernization";

export const CLAIMS_INTAKE_MANIFEST_ID = "a1c2e3f4-a5b6-7890-abcd-ef1234567890";

export const CLAIMS_INTAKE_FINDING_ID = "phi-minimization-risk";

async function countAlertsApi(request: APIRequestContext): Promise<number> {
  const res = await request.get(`${liveApiBase}/v1/alerts`, {
    params: { take: "100" },
    headers: liveAcceptHeaders(),
  });

  if (!res.ok()) {
    const t = await res.text();

    throw new Error(`GET /v1/alerts failed ${res.status()}: ${t.slice(0, 400)}`);
  }

  const body: unknown = await res.json();

  if (Array.isArray(body)) {
    return body.length;
  }

  if (body !== null && typeof body === "object" && "items" in body) {
    const items = (body as { items?: unknown }).items;

    return Array.isArray(items) ? items.length : 0;
  }

  return 0;
}

type RunDetailJson = {
  run?: { runId?: string; goldenManifestId?: string | null };
};

export async function runDemoScreenshotPreflight(
  request: APIRequestContext,
  uiBaseUrl: string,
): Promise<DemoPreflightResult> {
  const checks: PreflightCheck[] = [];

  const push = (name: string, ok: boolean, detail?: string): void => {
    checks.push({ name, ok, detail });
  };

  let claimsRunIdForApi = CLAIMS_INTAKE_CANONICAL_RUN_ID;
  let graphRunSegment = toRunGuidPathSegment(CLAIMS_INTAKE_CANONICAL_RUN_ID);
  let alertsDemoReady = false;
  let alertCount = 0;

  try {
    const uiProbe = await request.get(uiBaseUrl.replace(/\/$/, "") + "/", { timeout: 60_000 });

    push("UI reachable", uiProbe.ok(), uiProbe.ok() ? undefined : `HTTP ${uiProbe.status()}`);
  } catch (e) {
    push("UI reachable", false, (e as Error).message);
  }

  try {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    push("API /health/ready", health.ok(), health.ok() ? undefined : `HTTP ${health.status()}`);
  } catch (e) {
    push("API /health/ready", false, (e as Error).message);
  }

  try {
    const runRes = await request.get(`${liveApiBase}/v1/architecture/run/${encodeURIComponent(CLAIMS_INTAKE_CANONICAL_RUN_ID)}`, {
      headers: liveAcceptHeaders(),
    });

    if (!runRes.ok()) {
      push(
        "Claims Intake architecture run",
        false,
        `HTTP ${runRes.status()}: ${(await runRes.text()).slice(0, 400)}`,
      );
    } else {
      const detail = (await runRes.json()) as RunDetailJson;
      const rid = detail.run?.runId?.trim();

      if (!rid) {
        push("Claims Intake architecture run", false, "response missing run.runId");
      } else {
        claimsRunIdForApi = rid;
        graphRunSegment = toRunGuidPathSegment(rid);
        push("Claims Intake architecture run", true);
      }
    }
  } catch (e) {
    push("Claims Intake architecture run", false, (e as Error).message);
  }

  try {
    const manifestRes = await request.get(
      `${liveApiBase}/v1/architecture/manifest/${encodeURIComponent(CLAIMS_INTAKE_MANIFEST_ID)}/summary`,
      { headers: liveAcceptHeaders() },
    );

    push(
      "Claims Intake manifest summary",
      manifestRes.ok(),
      manifestRes.ok() ? undefined : `HTTP ${manifestRes.status()}: ${(await manifestRes.text()).slice(0, 400)}`,
    );
  } catch (e) {
    push("Claims Intake manifest summary", false, (e as Error).message);
  }

  try {
    const inspectUrl = `${liveApiBase}/v1/architecture/run/${encodeURIComponent(claimsRunIdForApi)}/findings/${encodeURIComponent(CLAIMS_INTAKE_FINDING_ID)}/inspect`;
    const fiRes = await request.get(inspectUrl, { headers: liveAcceptHeaders() });

    push(
      "PHI minimization finding inspect",
      fiRes.ok(),
      fiRes.ok() ? undefined : `HTTP ${fiRes.status()}: ${(await fiRes.text()).slice(0, 400)}`,
    );
  } catch (e) {
    push("PHI minimization finding inspect", false, (e as Error).message);
  }

  try {
    const graphRes = await getGraphForRunRaw(request, graphRunSegment);

    if (!graphRes.ok()) {
      push("Graph API (nodes/edges)", false, `HTTP ${graphRes.status()}: ${(await graphRes.text()).slice(0, 400)}`);
    } else {
      const gj = (await graphRes.json()) as { nodes?: unknown[]; edges?: unknown[] };
      const nc = Array.isArray(gj.nodes) ? gj.nodes.length : 0;
      const ec = Array.isArray(gj.edges) ? gj.edges.length : 0;
      const ok = nc >= 1 && ec >= 1;

      push(
        "Graph API (nodes/edges)",
        ok,
        ok ? undefined : `nodes=${nc} edges=${ec} (need at least 1 each)`,
      );
    }
  } catch (e) {
    push("Graph API (nodes/edges)", false, (e as Error).message);
  }

  try {
    const auditItems = await listRecentAudit(request, 200);
    const ok = auditItems.length >= 1;

    push("Audit API (≥1 event)", ok, ok ? undefined : `count=${auditItems.length}`);
  } catch (e) {
    push("Audit API (≥1 event)", false, (e as Error).message);
  }

  try {
    alertCount = await countAlertsApi(request);
    alertsDemoReady = alertCount >= 1;
    push(
      "Alerts API",
      true,
      alertsDemoReady ? `count=${alertCount}` : `count=0 (alerts route will be skipped as not demo-ready)`,
    );
  } catch (e) {
    push("Alerts API", false, (e as Error).message);
  }

  const ok = checks.every((c) => c.ok);

  return {
    ok,
    checks,
    claimsRunIdForApi,
    graphRunSegment,
    alertsDemoReady,
    alertCount,
  };
}

export function routeToScreenshotFilename(routePath: string): string {
  const trimmed = routePath.trim();
  const pseudo = trimmed.startsWith("/") ? `http://local${trimmed}` : `http://local/${trimmed}`;
  const u = new URL(pseudo);
  const combined = `${u.pathname}${u.search}`.replace(/^\//, "");
  const slug = (combined.length > 0 ? combined : "index").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");

  return `${slug.length > 0 ? slug : "index"}.png`;
}

export function collectFailureSubstringsInText(visibleText: string): string[] {
  const hit: string[] = [];

  for (const s of DEMO_SCREENSHOT_FAILURE_SUBSTRINGS) {
    if (visibleText.includes(s)) {
      hit.push(s);
    }
  }

  return hit;
}

export async function waitForShellReady(page: Page, timeoutMs: number): Promise<void> {
  await page.locator('[data-app-ready="true"]').waitFor({ state: "attached", timeout: timeoutMs });
}

/** Best-effort: dynamic routes often show these loaders; wait before scanning/snapshotting. */
export async function settleDemoRoute(page: Page, routePath: string): Promise<void> {
  const p = routePath.split("?")[0] ?? routePath;

  if (p === "/graph" || p.startsWith("/graph")) {
    const graphLoading = page.getByText(/loading graph viewer/i).first();
    if ((await graphLoading.count()) > 0)
      await graphLoading.waitFor({ state: "hidden", timeout: 120_000 });

    return;
  }

  if (p === "/governance" || p.startsWith("/governance")) {
    const govLoading = page.getByText(/loading workflow data/i).first();
    if ((await govLoading.count()) > 0)
      await govLoading.waitFor({ state: "hidden", timeout: 120_000 });

    return;
  }

  if (p === "/alerts" || p.startsWith("/alerts")) {
    const alertsLoading = page.getByText(/loading alerts/i).first();
    if ((await alertsLoading.count()) > 0)
      await alertsLoading.waitFor({ state: "hidden", timeout: 120_000 });
  }
}

export type RouteCaptureResult = {
  route: string;
  path: string;
  screenshotFile: string | null;
  status: "pass" | "fail" | "skipped";
  issues: string[];
};

export type DemoScreenshotsReport = {
  generatedAtUtc: string;
  uiBaseUrl: string;
  apiBaseUrl: string;
  viewport: { width: number; height: number };
  preflight: { ok: boolean; checks: PreflightCheck[]; alertsDemoReady: boolean; alertCount: number };
  routes: RouteCaptureResult[];
  exitFailedRouteCount: number;
};

export function writeDemoScreenshotsReports(outDir: string, report: DemoScreenshotsReport): void {
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2), "utf8");

  const lines: string[] = [
    "# Demo screenshots report",
    "",
    "Canonical URLs: reviews list uses `/runs?projectId=default` (not `/runs/projectId/default`). Demo preview is `/demo/preview` (not `/demo-preview`).",
    "",
    `Generated: ${report.generatedAtUtc}`,
    `UI: ${report.uiBaseUrl}`,
    `API: ${report.apiBaseUrl}`,
    `Viewport: ${report.viewport.width}x${report.viewport.height}`,
    "",
    "## Preflight",
    "",
    `- **OK:** ${report.preflight.ok}`,
    `- **Alerts demo-ready:** ${report.preflight.alertsDemoReady} (API count ${report.preflight.alertCount})`,
    "",
    "| Check | OK | Detail |",
    "| --- | --- | --- |",
    ...report.preflight.checks.map((c) => `| ${c.name} | ${c.ok} | ${c.detail ?? ""} |`),
    "",
    "## Routes",
    "",
    "| Route | Screenshot | Status | Issues |",
    "| --- | --- | --- | --- |",
    ...report.routes.map((r) => {
      const issues = r.issues.length > 0 ? r.issues.join("; ") : "";

      return `| \`${r.route}\` | ${r.screenshotFile ?? "—"} | **${r.status}** | ${issues.replace(/\|/g, "\\|")} |`;
    }),
    "",
    `**Failed routes (exit):** ${report.exitFailedRouteCount}`,
    "",
  ];

  fs.writeFileSync(path.join(outDir, "report.md"), lines.join("\n"), "utf8");
}
