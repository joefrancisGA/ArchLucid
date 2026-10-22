/**
 * TB-946 drill C — worker backlog (expect azure-queue and/or prometheus scale on worker, not API HTTP).
 *
 * Enqueues durable export work via analysis-report export POST. Run only when worker queue scaling is enabled.
 *
 * Usage:
 *   ARCHLUCID_LOAD_TEST_WRITES=true k6 run scripts/load/scale-drill-c-worker-backlog.js
 */
import http from "k6/http";
import { check, sleep } from "k6";

import { base, headers, okWrite, runId } from "./scale-drill-k6-common.js";

const peakVus = Number(__ENV.K6_DRILL_C_PEAK_VUS || 6);
const rampDuration = __ENV.K6_DRILL_C_RAMP || "45s";
const holdDuration = __ENV.K6_DRILL_C_HOLD || "3m";

export const options = {
  scenarios: {
    drill_c_worker: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: rampDuration, target: peakVus },
        { duration: holdDuration, target: peakVus },
        { duration: "30s", target: 0 },
      ],
      exec: "drillCWorkerBacklog",
      gracefulRampDown: "20s",
    },
  },
  thresholds: {
    http_req_failed: [{ threshold: "rate<0.10", abortOnFail: false }],
  },
};

export function drillCWorkerBacklog() {
  const exportBody = JSON.stringify({
    format: "markdown",
    template: "consulting",
  });

  const analysisExport = http.post(
    `${base}/v1/architecture/review/${runId}/analysis-report/export`,
    exportBody,
    { headers: headers(true), tags: { name: "analysis_report_export" } },
  );
  check(analysisExport, { analysis_export_ok: (r) => okWrite(r) });

  const auditExport = http.get(
    `${base}/v1/audit/export?fromUtc=2026-01-01T00:00:00Z&toUtc=2026-04-01T00:00:00Z&maxRows=500`,
    { headers: headers(), tags: { name: "audit_export" } },
  );
  check(auditExport, { audit_export_ok: (r) => okWrite(r) });

  sleep(0.8 + Math.random() * 0.5);
}

export function handleSummary(data) {
  return {
    stdout: `TB-946 drill C complete — base=${base} peakVus=${peakVus}\n`,
    "scale-drill-c-summary.json": JSON.stringify(data, null, 2),
  };
}
