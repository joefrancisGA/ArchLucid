import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { SECURENOW_REMEDIATION_FACTORY_PATH } from "@/lib/governance/governance-route-paths";

export const SECURENOW_FIRST_HOUR_HEADING = "First hour preparation" as const;

export const SECURENOW_FIRST_HOUR_LEAD =
  "Internal operator path for the first useful review. SecureNow beta remains NO_GO." as const;

export type SecureNowFirstHourStep = {
  readonly title: string;
  readonly body: string;
  readonly href?: string;
};

export const SECURENOW_FIRST_USEFUL_ANSWER_HEADING = "First useful answer" as const;

export const SECURENOW_FIRST_USEFUL_ANSWER_BODY =
  "The first useful answer is collection status, one ranked path in Path inspect, and one review question on Diagrams. A missing capture still counts as status. This is not a timed SLA." as const;

export const SECURENOW_FIRST_USEFUL_ANSWER_DIAGRAMS_PATH = "/infrastructure/diagrams" as const;

export const SECURENOW_FIRST_HOUR_STEPS: readonly SecureNowFirstHourStep[] = [
  {
    title: "1 — Scope and freshness",
    body: "Confirm tenant, workspace, subscription, and the latest collection result on Home. A missing or stale capture is a gap, not a clean bill of health.",
    href: CLOUD_CONNECTIONS_PATH,
  },
  {
    title: "2 — One ranked path",
    body: "Open one ranked path and read cited hops and confidence bands. Do not treat the path as confirmed exploitation.",
    href: SECURENOW_REMEDIATION_FACTORY_PATH,
  },
  {
    title: "3 — Advisory cut point",
    body: "Select a priority row from step 2 and read the proposed cut point in Path inspect. The panel shows the cut point and linked remediation pattern. SecureNow recommends; it does not change Azure.",
  },
  {
    title: "4 — Stop",
    body: "Do not start verification, engineer tickets, or sponsor packaging until the sponsor names the review question. Name that question in the question queue on Diagrams.",
    href: SECURENOW_FIRST_USEFUL_ANSWER_DIAGRAMS_PATH,
  },
] as const;

export const SECURENOW_FIRST_HOUR_TERMS: readonly string[] = [
  "Possible access path — a ranked permission and network combination SecureNow can cite. Not proof of an exploit.",
  "Advisory cut point — an analysis recommendation for where to intervene. Not proof the change is safe to implement without your approvals.",
  "External change — any Azure change made outside SecureNow under your organization's process.",
  "NOT VERIFIED — the honest outcome when a later capture, analysis, or postcondition is missing.",
] as const;

export const SECURENOW_FIRST_HOUR_GUARDRAIL =
  "This page does not promise a timed SLA, hands-free Azure repair, or a CPA attestation." as const;
