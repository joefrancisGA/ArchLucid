import { REPORT_PROBLEM_ACKNOWLEDGEMENT_TEMPLATE } from "@/lib/report-problem-copy";

/** Phrases that overclaim support monitoring or response time (TB-790). */
export const REPORT_PROBLEM_SUPPORT_OVERCLAIM_PHRASES = [
  "24/7",
  "24 hours a day",
  "monitor reports",
  "immediate response",
  "within hours",
  "live chat",
] as const;

export function findReportProblemSupportOverclaimPhrases(text: string): string[] {
  const normalized = text.toLowerCase();

  return REPORT_PROBLEM_SUPPORT_OVERCLAIM_PHRASES.filter((phrase) => normalized.includes(phrase.toLowerCase()));
}

/** Canonical SLA fragment reused across help, settings, and trust copy. */
export const REPORT_PROBLEM_HELP_SLA_SENTENCE = "We respond by the next business day.";

export function includesReportProblemSlaCopy(text: string): boolean {
  return (
    text.includes(REPORT_PROBLEM_HELP_SLA_SENTENCE)
    || text.includes(REPORT_PROBLEM_ACKNOWLEDGEMENT_TEMPLATE.replace("{id}", "").trim())
    || text.toLowerCase().includes("next business day")
  );
}
