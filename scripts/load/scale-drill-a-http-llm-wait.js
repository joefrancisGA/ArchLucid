/**
 * TB-946 drill A — HTTP / LLM-wait concurrency (expect http_scale_rule scale-out; CPU may stay low).
 *
 * Usage:
 *   k6 run scripts/load/scale-drill-a-http-llm-wait.js
 *   k6 run -e ARCHLUCID_BASE_URL=https://staging-api -e K6_DRILL_A_PEAK_VUS=30 scripts/load/scale-drill-a-http-llm-wait.js
 *
 * Env:
 *   K6_DRILL_A_PEAK_VUS (default 25)
 *   K6_DRILL_A_RAMP / K6_DRILL_A_HOLD
 *   ARCHLUCID_LOAD_TEST_WRITES=true — include POST /v1/architecture/request (Simulator + ExecuteAuthority)
 */
import { check, sleep } from "k6";

import {
  base,
  okRead,
  okWrite,
  postArchitectureRequest,
  rampingVusScenario,
  retrievalSearch,
} from "./scale-drill-k6-common.js";

const peakVus = Number(__ENV.K6_DRILL_A_PEAK_VUS || 25);
const rampDuration = __ENV.K6_DRILL_A_RAMP || "90s";
const holdDuration = __ENV.K6_DRILL_A_HOLD || "4m";
const loadTestWrites = __ENV.ARCHLUCID_LOAD_TEST_WRITES === "true";

const writeScenario = loadTestWrites
  ? {
      drill_a_writes: {
        executor: "constant-vus",
        vus: Number(__ENV.K6_DRILL_A_WRITE_VUS || 8),
        duration: holdDuration,
        exec: "drillAWrites",
        startTime: rampDuration,
      },
    }
  : {};

export const options = {
  scenarios: {
    drill_a_reads: rampingVusScenario(peakVus, rampDuration, holdDuration, "drillAReads"),
    ...writeScenario,
  },
  thresholds: {
    http_req_failed: [{ threshold: "rate<0.05", abortOnFail: false }],
    http_req_duration: [{ threshold: "p(95)<30000", abortOnFail: false }],
  },
};

export function drillAReads() {
  const search = retrievalSearch();
  check(search, {
    retrieval_search_ok: (r) => okRead(r),
  });

  sleep(0.15 + Math.random() * 0.25);
}

export function drillAWrites() {
  const response = postArchitectureRequest();
  check(response, {
    architecture_request_ok: (r) => okWrite(r),
  });

  sleep(0.4 + Math.random() * 0.4);
}

export function handleSummary(data) {
  return {
    stdout: `TB-946 drill A complete — base=${base} peakVus=${peakVus} writes=${loadTestWrites}\n`,
    "scale-drill-a-summary.json": JSON.stringify(data, null, 2),
  };
}
