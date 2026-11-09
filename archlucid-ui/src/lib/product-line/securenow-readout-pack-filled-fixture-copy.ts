import { SECURENOW_FIXTURE_PATH_ID } from "@/lib/product-line/securenow-pilot-spine-copy";

/** Synthetic readout lines for facilitator rehearsal — not customer evidence. */
export const SECURENOW_READOUT_PACK_FILLED_FIXTURE_HEADING = "Filled fixture readout (synthetic)" as const;

export const SECURENOW_READOUT_PACK_FILLED_FIXTURE_LEAD =
  "One complete sponsor readout shape using fixture-path-01. Replace every value after you capture your subscription." as const;

export const SECURENOW_READOUT_PACK_FILLED_FIXTURE_ROWS = [
  {
    label: "Ranked path",
    value: `${SECURENOW_FIXTURE_PATH_ID} — cited hops and confidence bands on the fixture row.`,
  },
  {
    label: "Advisory cut",
    value: "Proposed cut on the weakest hop. Pattern key may be suggested; Azure change is out of band.",
  },
  {
    label: "Remediation pattern",
    value: "Match cut-point pattern key in the pattern registry — draft reference only.",
  },
  {
    label: "Verification",
    value: "NOT VERIFIED until a later capture and attestation are supplied.",
  },
  {
    label: "Disposition",
    value: "Proceed, Extend, or Stop with rationale when the sponsor is ready — not certification.",
  },
] as const;
