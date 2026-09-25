import type { OperatorSeverityCalloutKind } from "@/components/help/OperatorSeverityCallout";

export type EngineeringTroubleshootingMarkdownSectionRisk = {
  readonly kind: OperatorSeverityCalloutKind;
  readonly heading: string;
  readonly body: string;
};

const DISRUPTIVE_STEP_PATTERN =
  /\b(migration|dbup|restart|\.env(?:\.local)?|environment variable|alter table|env-var)\b/i;

/** Surface OperatorSeverityCallout when a runbook section mentions disruptive ops steps. */
export function resolveEngineeringTroubleshootingMarkdownSectionRisk(
  sectionTitle: string,
  body: string,
): EngineeringTroubleshootingMarkdownSectionRisk | null {
  const haystack = `${sectionTitle}\n${body}`;

  if (!DISRUPTIVE_STEP_PATTERN.test(haystack)) {
    return null;
  }

  return {
    kind: "warn",
    heading: "Disruptive change — confirm scope first",
    body:
      "Restarting services, applying migrations, or editing environment variables can affect live tenants. Capture system-health JSON and request IDs before changing production-like hosts.",
  };
}
