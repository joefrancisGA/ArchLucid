import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { SECURENOW_REMEDIATION_FACTORY_PATH } from "@/lib/governance/governance-route-paths";

export const SECURENOW_PILOT_WALKTHROUGH_BEAT_PARAM = "securenowWalkBeat" as const;

export const SECURENOW_PILOT_SPINE_PATH = "/administration/securenow-pilot-spine" as const;

export const SECURENOW_PILOT_SPINE_HEADING = "Pilot walkthrough (fixture)" as const;

export const SECURENOW_PILOT_SPINE_LEAD =
  "Six beats aligned to the public sample and the facilitator storyboard. Every beat is synthetic until you capture your subscription. SecureNow beta remains NO_GO." as const;

export const SECURENOW_PILOT_SPINE_GUARDRAIL =
  "This walkthrough is not customer evidence, does not authorize commerce, and does not change Azure." as const;

export const SECURENOW_FIXTURE_PATH_ID = "fixture-path-01" as const;

export type SecureNowPilotSpineStep = {
  readonly beat: number;
  readonly anchorId: string;
  readonly title: string;
  readonly body: string;
  readonly facilitatorSay: string;
  readonly facilitatorDoNot: string;
  readonly operatorHref: string;
};

export function appendSecureNowWalkBeat(href: string, beat: number): string {
  const hashIndex = href.indexOf("#");
  const base = hashIndex === -1 ? href : href.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : href.slice(hashIndex);
  const separator = base.includes("?") ? "&" : "?";
  const query = `${separator}${SECURENOW_PILOT_WALKTHROUGH_BEAT_PARAM}=${beat}`;

  return `${base}${query}${hash}`;
}

const FIXTURE_PATH_INSPECT_HREF = `${SECURENOW_REMEDIATION_FACTORY_PATH}?pathId=${SECURENOW_FIXTURE_PATH_ID}` as const;

const FIXTURE_CUT_POINT_HREF = `${FIXTURE_PATH_INSPECT_HREF}#cut-points` as const;

export const SECURENOW_PILOT_SPINE_STEPS: readonly SecureNowPilotSpineStep[] = [
  {
    beat: 1,
    anchorId: "beat-scope",
    title: "Scope and freshness",
    body: "Confirm tenant, workspace, subscription, and the latest collection result. A missing capture is a gap, not a clean bill of health.",
    facilitatorSay: "Before we trust a path ranking, we confirm which Azure scope this capture covers and whether anything is missing or stale.",
    facilitatorDoNot: "Do not say the environment is fully covered or that this proves you are secure.",
    operatorHref: CLOUD_CONNECTIONS_PATH,
  },
  {
    beat: 2,
    anchorId: "beat-ranked-path",
    title: "One ranked path",
    body: "Open fixture-path-01 and read cited hops and confidence bands. A possible access path is not an observed exploit.",
    facilitatorSay: "SecureNow is showing a possible access path backed by cited inventory hops.",
    facilitatorDoNot: "Do not say this path was exploited or cite a numeric probability.",
    operatorHref: FIXTURE_PATH_INSPECT_HREF,
  },
  {
    beat: 3,
    anchorId: "beat-cut-point",
    title: "Advisory cut point",
    body: "Read the proposed cut point on the selected path. SecureNow recommends; it does not change Azure.",
    facilitatorSay: "This cut point is an analysis recommendation about where an engineer could intervene.",
    facilitatorDoNot: "Do not say SecureNow fixed it or that the change is approved without your change control.",
    operatorHref: FIXTURE_CUT_POINT_HREF,
  },
  {
    beat: 4,
    anchorId: "beat-engineer",
    title: "Engineer action",
    body: "Your engineer implements any Azure change outside SecureNow under your approvals. SecureNow records the plan and later collection.",
    facilitatorSay: "Your engineer decides and implements any Azure change outside SecureNow under your organization's approvals.",
    facilitatorDoNot: "Do not say SecureNow applied the change or autonomous remediation.",
    operatorHref: FIXTURE_PATH_INSPECT_HREF,
  },
  {
    beat: 5,
    anchorId: "beat-not-verified",
    title: "Not verified",
    body: "When a later capture, attestation, analysis, or postcondition is missing, the honest outcome is not verified.",
    facilitatorSay: "Verification requires a later capture, your attestation, completed analysis, and a substantive postcondition.",
    facilitatorDoNot: "Do not say verified or problem solved from fixture data alone.",
    operatorHref: "/administration/securenow-first-hour#stop",
  },
  {
    beat: 6,
    anchorId: "beat-close",
    title: "Audit link and disposition",
    body: "Record Proceed, Extend, or Stop with rationale when the sponsor is ready. Browser copy is cache; tenant audit is the durable write.",
    facilitatorSay: "A person records disposition against authorized evidence. The audit link shows traceability, not certification.",
    facilitatorDoNot: "Do not say SOC 2 certified or that the model signed off on the control.",
    operatorHref: "/administration/securenow-pilot-decision",
  },
] as const;

export function secureNowPilotSpineStepForBeat(beat: number): SecureNowPilotSpineStep | null {
  const normalized = Math.trunc(beat);

  return SECURENOW_PILOT_SPINE_STEPS.find((step) => step.beat === normalized) ?? null;
}

export function secureNowPilotSpineHandoffHrefForBeat(beat: number): string | null {
  const step = secureNowPilotSpineStepForBeat(beat);

  if (step === null) {
    return null;
  }

  return appendSecureNowWalkBeat(step.operatorHref, step.beat);
}

export function secureNowPilotSpineHandoffHrefForBeatIndex(zeroBasedIndex: number): string | null {
  return secureNowPilotSpineHandoffHrefForBeat(zeroBasedIndex + 1);
}
