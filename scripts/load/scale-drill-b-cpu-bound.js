/**
 * TB-946 drill B — CPU-bound reads (expect api_enable_cpu_scale_rule when HTTP concurrency stays low).
 *
 * Targets compare, governance dashboard, advisory list, and run detail — graph merge / aggregation paths.
 *
 * Usage:
 *   k6 run scripts/load/scale-drill-b-cpu-bound.js
 */
import http from "k6/http";
import { check, sleep } from "k6";

import {
  base,
  headers,
  okRead,
  rampingVusScenario,
  runId,
} from "./scale-drill-k6-common.js";

const compareBase = __ENV.ARCHLUCID_COMPARE_BASE_RUN_ID || "00000000-0000-0000-0000-000000000001";
const compareTarget = __ENV.ARCHLUCID_COMPARE_TARGET_RUN_ID || "00000000-0000-0000-0000-000000000002";
const peakVus = Number(__ENV.K6_DRILL_B_PEAK_VUS || 12);
const rampDuration = __ENV.K6_DRILL_B_RAMP || "60s";
const holdDuration = __ENV.K6_DRILL_B_HOLD || "4m";

export const options = {
  scenarios: {
    drill_b_cpu: rampingVusScenario(peakVus, rampDuration, holdDuration, "drillBCpuBurst"),
  },
  thresholds: {
    http_req_failed: [{ threshold: "rate<0.05", abortOnFail: false }],
    http_req_duration: [{ threshold: "p(95)<20000", abortOnFail: false }],
  },
};

export function drillBCpuBurst() {
  const compare = http.get(
    `${base}/v1/compare?baseRunId=${compareBase}&targetRunId=${compareTarget}`,
    { headers: headers(), tags: { name: "compare" } },
  );
  check(compare, { compare_ok: (r) => okRead(r) });

  const governance = http.get(
    `${base}/v1/governance/dashboard?maxPending=50&maxDecisions=50&maxChanges=50`,
    { headers: headers(), tags: { name: "governance_dashboard" } },
  );
  check(governance, { governance_ok: (r) => okRead(r) });

  const advisory = http.get(`${base}/v1/advisory/runs/${runId}/recommendations`, {
    headers: headers(),
    tags: { name: "advisory_recommendations" },
  });
  check(advisory, { advisory_ok: (r) => okRead(r) });

  const runDetail = http.get(`${base}/v1/architecture/run/${runId}`, {
    headers: headers(),
    tags: { name: "run_detail" },
  });
  check(runDetail, { run_detail_ok: (r) => okRead(r) });

  sleep(0.05);
}

export function handleSummary(data) {
  return {
    stdout: `TB-946 drill B complete — base=${base} peakVus=${peakVus}\n`,
    "scale-drill-b-summary.json": JSON.stringify(data, null, 2),
  };
}
