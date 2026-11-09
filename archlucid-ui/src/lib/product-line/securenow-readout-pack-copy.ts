import {
  SECURENOW_FIXTURE_PATH_ID,
  SECURENOW_PILOT_SPINE_PATH,
  appendSecureNowWalkBeat,
} from "@/lib/product-line/securenow-pilot-spine-copy";
import {
  SECURENOW_REMEDIATION_FACTORY_PATH,
  SECURENOW_REMEDIATION_PATTERNS_PATH,
} from "@/lib/governance/governance-route-paths";
import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";

export const SECURENOW_READOUT_PACK_PATH = "/administration/securenow-readout-pack" as const;

export const SECURENOW_READOUT_PACK_HEADING = "Readout pack (fixture)" as const;

export const SECURENOW_READOUT_PACK_LEAD =
  "Template anchors for sponsor readouts, investigation effort, and draft remediation patterns. Synthetic until you capture your subscription. SecureNow beta remains NO_GO." as const;

export const SECURENOW_READOUT_PACK_GUARDRAIL =
  "This hub does not certify the environment, authorize commerce, or change Azure." as const;

const FIXTURE_PATH_INSPECT_HREF = `${SECURENOW_REMEDIATION_FACTORY_PATH}?pathId=${SECURENOW_FIXTURE_PATH_ID}` as const;

export const SECURENOW_READOUT_PACK_FIXTURE_ANCHORS = [
  {
    label: "Fixture ranked path (fixture-path-01)",
    href: appendSecureNowWalkBeat(FIXTURE_PATH_INSPECT_HREF, 2),
    summary: "Cited hops, confidence bands, and cut points on the pilot fixture row.",
  },
  {
    label: "Investigation effort worksheet",
    href: "/administration/securenow-investigation-effort",
    summary: "Name the review question before opening verification or sponsor packaging.",
  },
  {
    label: "Pilot disposition (Proceed / Extend / Stop)",
    href: "/administration/securenow-pilot-decision",
    summary: "Record rationale when the sponsor is ready. Not certification.",
  },
  {
    label: "Pilot walkthrough beats",
    href: SECURENOW_PILOT_SPINE_PATH,
    summary: "Six facilitator beats with deep links into the product.",
  },
  {
    label: "Additional fixture scenarios",
    href: "/administration/securenow-scenario-walks",
    summary: "Collection gaps, cut-only views, and contributor-between-captures cases.",
  },
] as const;

export const SECURENOW_READOUT_PACK_DRAFT_PATTERNS = [
  {
    label: "Remediation pattern registry",
    href: SECURENOW_REMEDIATION_PATTERNS_PATH,
    summary: "Open the pattern library. Match cut-point pattern keys on the selected path — not live changes.",
  },
  {
    label: "Advisory cut on fixture-path-01",
    href: `${FIXTURE_PATH_INSPECT_HREF}#cut-points`,
    summary: "Read the proposed cut and suggested pattern key on the fixture row.",
  },
] as const;

export const SECURENOW_READOUT_PACK_HOME_SECTION_HEADING = "Readout pack" as const;

export const SECURENOW_READOUT_PACK_HOME_SECTION_LEAD =
  "Fixture templates for sponsor readouts and pattern drafts. Not customer evidence. SecureNow beta remains NO_GO." as const;

export const SECURENOW_READOUT_PACK_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: SECURENOW_READOUT_PACK_PATH,
    label: "Open the readout pack hub",
    summary: "Fixture path, investigation effort, disposition, pilot beats, and pattern registry links.",
    recommendedFirst: true,
  },
  {
    href: SECURENOW_PILOT_SPINE_PATH,
    label: "Pilot walkthrough (six beats)",
    summary: "Same storyboard with facilitator say / do-not-say lines.",
  },
] as const;
