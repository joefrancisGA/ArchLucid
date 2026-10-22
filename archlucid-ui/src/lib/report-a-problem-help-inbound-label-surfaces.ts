import { REPORT_A_PROBLEM_HELP_TOPIC_LABEL } from "@/lib/report-a-problem-help-evidence-copy";

/** TB-1743 — troubleshooting and Support surfaces share one inbound label for structured intake. */
export const REPORT_A_PROBLEM_HELP_INBOUND_PATH_LABELS: Readonly<Record<string, string>> = {} as const;

export const REPORT_A_PROBLEM_HELP_INBOUND_LABEL_SOURCE_FILES: readonly string[] = [
  "src/lib/troubleshooting-help-evidence-copy.ts",
  "src/app/(operator)/help/_sections/HelpTroubleshootingGuideView.tsx",
] as const;

export const REPORT_A_PROBLEM_HELP_TROUBLESHOOTING_CROSS_LINK_LABEL = REPORT_A_PROBLEM_HELP_TOPIC_LABEL;
