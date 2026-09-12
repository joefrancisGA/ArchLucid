import { DAYTIME_WAIT_WORKING_BACKGROUND_WAIT_HELPER } from "@/lib/daytime-wait-never-stay-on-page-working";

/** DW-015 — help: background wait on Working (ADR 0096 / PC-08). */
export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SLUG = "background-wait" as const;

export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_TITLE = "Work continues in the background" as const;

export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_OVERVIEW = [
  "On Working seats, analysis does not require babysitting one browser tab.",
  DAYTIME_WAIT_WORKING_BACKGROUND_WAIT_HELPER,
  "Career Real execute uses the async operations pattern (ADR 0096) — poll operations, not a fictional run-progress URL.",
].join(" ") as const;
