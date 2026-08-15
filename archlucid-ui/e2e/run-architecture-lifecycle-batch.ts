/**
 * Batch driver: create → execute → commit → governance approve for N architecture reviews.
 * Requires ArchLucid.Api in Simulator + DevelopmentBypass (see scripts/run-architecture-lifecycle-batch.ps1).
 *
 * Review count: CLI arg, ARCHITECTURE_LIFECYCLE_BATCH_REVIEW_COUNT env, or default 30.
 */
import fs from "node:fs";
import path from "node:path";

import { request } from "@playwright/test";

import {
  aggregateFindingsByCategory,
  formatFindingsByCategory,
} from "./helpers/architecture-lifecycle-batch-findings";
import {
  ARCHITECTURE_LIFECYCLE_BATCH_UNIQUE_SCENARIO_COUNT,
  buildArchitectureLifecycleBatchScenarios,
  toArchitectureRequestBody,
} from "./helpers/architecture-lifecycle-batch-scenarios";
import {
  approveGovernanceRequest,
  commitRun,
  createApprovalRequest,
  createRun,
  executeRun,
  freshIsolatedTenantScope,
  getAuthorityRunDetailWithTransientRetries,
  liveApiBase,
  liveE2eCommitWaitMs,
  livePeerReviewerActorName,
  resolveLivePeerReviewerGovernanceOptions,
  waitForLiveApiReady,
  waitForReadyForCommit,
  waitForRunDetailCommitted,
} from "./helpers/live-api-client";
import { throwIfNotOk } from "./helpers/live-api-response";

type BatchScenarioOutcome = {
  readonly scenarioName: string;
  readonly cohortId?: string;
  readonly runId?: string;
  readonly manifestVersion?: string;
  readonly governanceStatus?: string;
  readonly findingsByCategory: Record<string, number>;
  readonly findingsTotal: number;
  readonly durationMs: number;
  readonly status: "Approved" | "Failed";
  readonly error?: string;
};

type BatchReport = {
  readonly generatedUtc: string;
  readonly apiBaseUrl: string;
  readonly reviewCount: number;
  readonly scenarioCount: number;
  readonly succeeded: number;
  readonly failed: number;
  readonly results: readonly BatchScenarioOutcome[];
};

const DEFAULT_REVIEW_COUNT = 30;

function parseReviewCount(): number {
  const envValue = process.env.ARCHITECTURE_LIFECYCLE_BATCH_REVIEW_COUNT?.trim();
  const cliValue = process.argv[2]?.trim();
  const raw = envValue || cliValue || String(DEFAULT_REVIEW_COUNT);
  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(
      `Invalid review count "${raw}". Pass a positive integer via -ReviewCount, ARCHITECTURE_LIFECYCLE_BATCH_REVIEW_COUNT, or CLI arg.`,
    );
  }

  return parsed;
}

function truncateError(message: string, maxLength = 240): string {
  if (message.length <= maxLength) {
    return message;
  }

  return `${message.slice(0, maxLength)}...`;
}

function resolveReportDirectory(): string {
  const configured = process.env.ARCHITECTURE_LIFECYCLE_BATCH_REPORT_DIR?.trim();

  if (configured && configured.length > 0) {
    return path.resolve(configured);
  }

  return path.join(__dirname, "reports");
}

function writeReports(report: BatchReport): { readonly markdownPath: string; readonly jsonPath: string } {
  const reportDir = resolveReportDirectory();

  fs.mkdirSync(reportDir, { recursive: true });

  const stamp = report.generatedUtc.replace(/[:.]/g, "-");
  const jsonPath = path.join(reportDir, `architecture-lifecycle-batch-${stamp}.json`);
  const markdownPath = path.join(reportDir, `architecture-lifecycle-batch-${stamp}.md`);

  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const lines: string[] = [
    "# Architecture lifecycle batch report",
    "",
    `- Generated (UTC): ${report.generatedUtc}`,
    `- API base: ${report.apiBaseUrl}`,
    `- Reviews requested: ${report.reviewCount}`,
    `- Scenarios executed: ${report.scenarioCount}`,
    `- Succeeded: ${report.succeeded}`,
    `- Failed: ${report.failed}`,
    "",
    "| Scenario | Run ID | Status | Manifest version | Findings (by category) | Duration (s) | Error |",
    "| --- | --- | --- | --- | --- | ---: | --- |",
  ];

  for (const row of report.results) {
    const durationSec = (row.durationMs / 1000).toFixed(1);
    const errorCell = row.error
      ? truncateError(row.error).replace(/\|/g, "\\|").replace(/\n/g, " ")
      : "";

    lines.push(
      `| ${row.scenarioName} | ${row.runId ?? "—"} | ${row.status} | ${row.manifestVersion ?? "—"} | ${formatFindingsByCategory(row.findingsByCategory)} | ${durationSec} | ${errorCell} |`,
    );
  }

  lines.push("");

  fs.writeFileSync(markdownPath, `${lines.join("\n")}\n`, "utf8");

  return { markdownPath, jsonPath };
}

async function runScenario(
  api: Awaited<ReturnType<typeof request.newContext>>,
  scenarioName: string,
  cohortId: string | undefined,
  createBody: Record<string, unknown>,
): Promise<BatchScenarioOutcome> {
  const startedMs = Date.now();
  const tenantScope = freshIsolatedTenantScope();

  try {
    const { runId } = await createRun(api, createBody, tenantScope);

    await executeRun(api, runId, tenantScope);
    await waitForReadyForCommit(api, runId, liveE2eCommitWaitMs(120_000), tenantScope);

    const commitJson = await commitRun(api, runId, tenantScope);
    const manifestVersion = commitJson.manifest?.metadata?.manifestVersion?.trim() ?? "";

    if (manifestVersion.length === 0) {
      throw new Error("Commit response missing manifest.metadata.manifestVersion");
    }

    await waitForRunDetailCommitted(api, runId, liveE2eCommitWaitMs(60_000), tenantScope);

    const authorityResponse = await getAuthorityRunDetailWithTransientRetries(api, runId, tenantScope);

    await throwIfNotOk(authorityResponse, "GET /v1/authority/reviews/...");

    const authorityPayload = (await authorityResponse.json()) as unknown;
    const findingsByCategory = aggregateFindingsByCategory(authorityPayload);
    const findingsTotal = Object.values(findingsByCategory).reduce((sum, count) => sum + count, 0);

    const submitted = await createApprovalRequest(
      api,
      {
        runId,
        manifestVersion,
        sourceEnvironment: "dev",
        targetEnvironment: "test",
        requestComment: `Architecture lifecycle batch — ${scenarioName}`,
      },
      tenantScope,
    );

    const approvalRequestId = submitted.approvalRequestId?.trim() ?? "";

    if (approvalRequestId.length === 0) {
      throw new Error("Governance submit response missing approvalRequestId");
    }

    const approved = await approveGovernanceRequest(
      api,
      approvalRequestId,
      {
        reviewedBy: livePeerReviewerActorName,
        reviewComment: "Architecture lifecycle batch peer approve",
      },
      resolveLivePeerReviewerGovernanceOptions(),
      tenantScope,
    );

    return {
      scenarioName,
      cohortId,
      runId,
      manifestVersion,
      governanceStatus: approved.status ?? "Approved",
      findingsByCategory,
      findingsTotal,
      durationMs: Date.now() - startedMs,
      status: "Approved",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return {
      scenarioName,
      cohortId,
      findingsByCategory: {},
      findingsTotal: 0,
      durationMs: Date.now() - startedMs,
      status: "Failed",
      error: message,
    };
  }
}

async function main(): Promise<number> {
  const reviewCount = parseReviewCount();
  const apiBaseUrl = liveApiBase;
  const scenarios = buildArchitectureLifecycleBatchScenarios(reviewCount);
  const requestSuffix = Date.now().toString(36);
  const cyclesUsed =
    reviewCount > ARCHITECTURE_LIFECYCLE_BATCH_UNIQUE_SCENARIO_COUNT
      ? Math.ceil(reviewCount / ARCHITECTURE_LIFECYCLE_BATCH_UNIQUE_SCENARIO_COUNT)
      : 1;

  const api = await request.newContext({
    baseURL: apiBaseUrl,
    extraHTTPHeaders: {
      Accept: "application/json",
    },
  });

  try {
    await waitForLiveApiReady(api, { timeoutMs: 120_000 });

    console.log(`[architecture-lifecycle-batch] API ready at ${apiBaseUrl}`);
    console.log(
      `[architecture-lifecycle-batch] Running ${scenarios.length} review(s) (${ARCHITECTURE_LIFECYCLE_BATCH_UNIQUE_SCENARIO_COUNT} unique templates` +
        (cyclesUsed > 1 ? `, ~${cyclesUsed} cycles` : "") +
        `) sequentially`,
    );

    const results: BatchScenarioOutcome[] = [];

    for (let index = 0; index < scenarios.length; index++) {
      const scenario = scenarios[index];
      const createBody = toArchitectureRequestBody(scenario, requestSuffix);

      console.log(`[architecture-lifecycle-batch] (${index + 1}/${scenarios.length}) ${scenario.name}`);

      const outcome = await runScenario(api, scenario.name, scenario.cohortId, createBody);

      results.push(outcome);

      if (outcome.status === "Approved") {
        console.log(
          `[architecture-lifecycle-batch] OK ${scenario.name} runId=${outcome.runId} findings=${outcome.findingsTotal}`,
        );
      } else {
        console.error(`[architecture-lifecycle-batch] FAILED ${scenario.name}: ${outcome.error ?? "unknown"}`);
      }
    }

    const succeeded = results.filter((row) => row.status === "Approved").length;
    const failed = results.length - succeeded;

    const report: BatchReport = {
      generatedUtc: new Date().toISOString(),
      apiBaseUrl,
      reviewCount,
      scenarioCount: results.length,
      succeeded,
      failed,
      results,
    };

    const { markdownPath, jsonPath } = writeReports(report);

    console.log(`[architecture-lifecycle-batch] Markdown report: ${markdownPath}`);
    console.log(`[architecture-lifecycle-batch] JSON report: ${jsonPath}`);
    console.log(`[architecture-lifecycle-batch] Complete — ${succeeded}/${results.length} approved, ${failed} failed`);

    return failed === 0 ? 0 : 1;
  } finally {
    await api.dispose();
  }
}

main()
  .then((exitCode) => {
    const exitCodeFile = process.env.ARCHITECTURE_LIFECYCLE_BATCH_EXIT_CODE_FILE?.trim();

    if (exitCodeFile && exitCodeFile.length > 0) {
      fs.writeFileSync(exitCodeFile, String(exitCode), "utf8");
    }

    process.exit(exitCode);
  })
  .catch((error) => {
    console.error("[architecture-lifecycle-batch] Fatal error:", error);
    process.exit(1);
  });
