import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";

export const SECURENOW_FIRST_USEFUL_ANSWER_HOME_SECTION_HEADING = "First useful answer" as const;

export const SECURENOW_FIRST_USEFUL_ANSWER_HOME_SECTION_LEAD =
  "Collection status, one ranked path, and one review question. This is not a timed SLA. SecureNow beta remains NO_GO." as const;

export const SECURENOW_FIRST_USEFUL_ANSWER_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: "/administration/securenow-first-hour#first-useful-answer",
    label: "Three visible facts",
    summary: "A missing capture is still a status. Do not open verification yet.",
  },
];
