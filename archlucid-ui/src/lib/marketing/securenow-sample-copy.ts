import {
  WHY_SECURENOW_CONVERSATION_LABEL,
  WHY_SECURENOW_CONVERSATION_MAILTO,
  WHY_SECURENOW_DRAFT_PITCH,
  WHY_SECURENOW_STATUS_LINE,
} from "@/lib/marketing/why-securenow-draft-copy";

export const SECURENOW_SAMPLE_HEADING = "SecureNow sample" as const;

export const SECURENOW_SAMPLE_FIXTURE_LINE = "Synthetic fixture. Not a customer result." as const;

export const SECURENOW_SAMPLE_WHY_LINK_HREF = "/why-securenow" as const;

export const SECURENOW_SAMPLE_WHY_LINK_LABEL = "Why SecureNow" as const;

export const SECURENOW_SAMPLE_WHY_LINK_LEAD =
  "Who it is for, the six-step workflow, and the refusals." as const;

export type SecureNowSampleBeat = {
  readonly title: string;
  readonly body: string;
};

export const SECURENOW_SAMPLE_BEATS: readonly SecureNowSampleBeat[] = [
  {
    title: "Scope and freshness",
    body: "Fixture tenant, one workspace, one subscription. The latest collection time is visible. A missing capture is a gap, not a clean bill of health.",
  },
  {
    title: "One ranked path",
    body: "Fixture path fixture-path-01. Cited hops: Reader on the subscription, then Contributor on a storage account. This is a possible access path. It is not an observed exploit.",
  },
  {
    title: "Advisory cut point",
    body: "Remove the standing Contributor assignment on that storage account. This is an analysis recommendation. SecureNow does not change Azure.",
  },
  {
    title: "Engineer action",
    body: "The fixture shows a remediation instance with an advisory runbook. The engineer changes Azure outside SecureNow under the organization's approvals. SecureNow records the plan and the later collection. It does not change Azure.",
  },
  {
    title: "Not verified",
    body: "When the later capture, the human attestation, the completed analysis, or the substantive postcondition is missing, the fixture result is not verified. A missing piece is not a silent pass.",
  },
  {
    title: "Audit link",
    body: "A person records the audit link to the relevant control. The link shows traceability. It is not compliance certification.",
  },
] as const;

export {
  WHY_SECURENOW_CONVERSATION_LABEL,
  WHY_SECURENOW_CONVERSATION_MAILTO,
  WHY_SECURENOW_DRAFT_PITCH,
  WHY_SECURENOW_STATUS_LINE,
};
