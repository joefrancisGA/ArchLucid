import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";

export const SECURENOW_FIRST_HOUR_HOME_SECTION_HEADING = "Start here" as const;

export const SECURENOW_FIRST_HOUR_HOME_SECTION_LEAD =
  "A missing or stale capture is the current step. A blank ranking is not a clean result. This is not a timed SLA. SecureNow beta remains NO_GO." as const;

export const SECURENOW_FIRST_HOUR_OPERATOR_PATH = "/administration/securenow-first-hour" as const;

export const SECURENOW_FIRST_HOUR_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: "/integrations/cloud-connections",
    label: "Scope and freshness",
    summary: "Open cloud connections when Home says no collection yet or the capture needs attention.",
    recommendedFirst: true,
  },
  {
    href: "/security/remediation-factory",
    label: "One ranked path",
    summary: "Open one ranked row and read the cited hops. Do not treat the path as an exploit.",
  },
  {
    href: "/administration/securenow-first-hour#path-inspect",
    label: "Path inspect",
    summary: "Select that ranked row. Path inspect is the panel on the row, not a separate page.",
  },
  {
    href: "/administration/securenow-first-hour#stop",
    label: "Stop",
    summary: "Do not open verification or sponsor packaging until the sponsor names the review question.",
  },
  {
    href: SECURENOW_FIRST_HOUR_OPERATOR_PATH,
    label: "First hour page",
    summary: "Read the four steps and the terms in one place.",
  },
];
