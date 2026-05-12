import { FIXTURE_LEFT_RUN_ID, FIXTURE_RIGHT_RUN_ID } from "./ids";

/** Minimal manifest-shaped JSON for E2E mock `GET /v1/authority/runs/{runId}/manifest` (left fixture run). */
export function fixtureCompareLeftRunManifestDocument(): Record<string, unknown> {
  return {
    systemName: "Fixture intake",
    runId: FIXTURE_LEFT_RUN_ID,
    metadata: { stage: "baseline", costBand: "low" },
    services: [{ id: "svc-a", name: "Intake API" }],
  };
}

/** Minimal manifest-shaped JSON for E2E mock (right fixture run) — intentionally diverges for diff visibility. */
export function fixtureCompareRightRunManifestDocument(): Record<string, unknown> {
  return {
    systemName: "Fixture intake",
    runId: FIXTURE_RIGHT_RUN_ID,
    metadata: { stage: "hardened", costBand: "low" },
    services: [{ id: "svc-a", name: "Intake API" }, { id: "svc-b", name: "Audit fan-out" }],
  };
}
