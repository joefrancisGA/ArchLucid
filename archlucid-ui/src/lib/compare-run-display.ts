import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

/** Friendly labels for known demo/compare URL segments — avoids raw IDs in primary Compare UI. */
export function compareRunHeadingLabel(runId: string): string {
  const u = runId.trim();

  if (u === "claims-intake-run-v1") {
    return "Claims Intake (baseline)";
  }

  if (u === "claims-intake-run-v2") {
    return "Claims Intake (updated)";
  }

  if (u === SHOWCASE_STATIC_DEMO_RUN_ID) {
    return "Claims Intake (completed run)";
  }

  return u;
}
