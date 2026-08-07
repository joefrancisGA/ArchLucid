import type { APIRequestContext } from "@playwright/test";

import { TRUSTED_BASELINE_RUN_ID_N } from "./demo-screenshots-harness";
import { postDemoSeedWithTransientRetries } from "./ensure-demo-workspace-seed";
import { getLiveApiPathWithTransientRetries, toRunGuidPathSegment } from "./live-api-client";

const maxTrustedBaselinePollAttempts = 24;

type RunDetailJson = {
  run?: { runId?: string; goldenManifestId?: string | null };
};

type GraphJson = {
  nodes?: unknown[];
  edges?: unknown[];
};

type AuditListJson = {
  items?: unknown[];
};

async function sleepTrustedBaselineBackoff(attempt: number): Promise<void> {
  const baseDelayMs = Math.min(1000 * 2 ** attempt, 8000);
  const jitterMs = Math.floor(Math.random() * 250);

  await new Promise((resolve) => setTimeout(resolve, baseDelayMs + jitterMs));
}

async function trustedBaselineGraphReady(request: APIRequestContext): Promise<boolean> {
  const graphSegment = toRunGuidPathSegment(TRUSTED_BASELINE_RUN_ID_N);
  const graphRes = await getLiveApiPathWithTransientRetries(request, `/v1/evidence-graph/reviews/${graphSegment}`);

  if (!graphRes.ok()) {
    return false;
  }

  const graphBody = (await graphRes.json()) as GraphJson;
  const nodeCount = Array.isArray(graphBody.nodes) ? graphBody.nodes.length : 0;
  const edgeCount = Array.isArray(graphBody.edges) ? graphBody.edges.length : 0;

  return nodeCount >= 1 && edgeCount >= 1;
}

async function trustedBaselineAuditReady(request: APIRequestContext): Promise<boolean> {
  const auditRes = await getLiveApiPathWithTransientRetries(request, "/v1/audit?take=200");

  if (!auditRes.ok()) {
    return false;
  }

  const auditBody = (await auditRes.json()) as AuditListJson;
  const items = auditBody.items;

  return Array.isArray(items) && items.length >= 1;
}

/** Idempotent Contoso trusted-baseline seed plus probes used by demo screenshot preflight. */
export async function ensureTrustedBaselineDemoReady(request: APIRequestContext): Promise<void> {
  await postDemoSeedWithTransientRetries(request);

  const runPath = `/v1/architecture/review/${encodeURIComponent(TRUSTED_BASELINE_RUN_ID_N)}`;
  let lastDetail = "unknown";

  for (let attempt = 0; attempt < maxTrustedBaselinePollAttempts; attempt++) {
    const runRes = await getLiveApiPathWithTransientRetries(request, runPath);

    if (!runRes.ok()) {
      lastDetail = `GET ${runPath} HTTP ${runRes.status()}: ${(await runRes.text()).slice(0, 300)}`;

      if (attempt < maxTrustedBaselinePollAttempts - 1) {
        await sleepTrustedBaselineBackoff(attempt);

        continue;
      }

      break;
    }

    const detail = (await runRes.json()) as RunDetailJson;
    const goldenManifestId = detail.run?.goldenManifestId?.trim();

    if (!goldenManifestId || goldenManifestId.length === 0) {
      lastDetail = "trusted baseline run missing run.goldenManifestId";

      if (attempt < maxTrustedBaselinePollAttempts - 1) {
        await sleepTrustedBaselineBackoff(attempt);

        continue;
      }

      break;
    }

    const manifestRes = await getLiveApiPathWithTransientRetries(
      request,
      `/v1/authority/signed-review-records/${encodeURIComponent(goldenManifestId)}/summary`,
    );

    if (!manifestRes.ok()) {
      lastDetail = `GET manifest summary HTTP ${manifestRes.status()}: ${(await manifestRes.text()).slice(0, 300)}`;

      if (attempt < maxTrustedBaselinePollAttempts - 1) {
        await sleepTrustedBaselineBackoff(attempt);

        continue;
      }

      break;
    }

    if (!(await trustedBaselineGraphReady(request))) {
      lastDetail = "graph API not ready (need at least one node and one edge)";

      if (attempt < maxTrustedBaselinePollAttempts - 1) {
        await sleepTrustedBaselineBackoff(attempt);

        continue;
      }

      break;
    }

    if (!(await trustedBaselineAuditReady(request))) {
      lastDetail = "audit API not ready (need at least one event)";

      if (attempt < maxTrustedBaselinePollAttempts - 1) {
        await sleepTrustedBaselineBackoff(attempt);

        continue;
      }

      break;
    }

    return;
  }

  throw new Error(`Trusted baseline demo not ready for screenshot preflight — ${lastDetail}`);
}
