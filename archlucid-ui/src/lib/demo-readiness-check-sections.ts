import type { BuyerCtoDemoReadinessCheck } from "@/lib/buyer/buyer-cto-demo-readiness";

export type DemoReadinessCheckSection = {
  readonly id: string;
  readonly title: string;
  readonly checkIds: readonly BuyerCtoDemoReadinessCheck["id"][];
};

export const DEMO_READINESS_CHECK_SECTIONS: readonly DemoReadinessCheckSection[] = [
  {
    id: "experience",
    title: "Demo experience",
    checkIds: ["buyer-shell", "journey-routes"],
  },
  {
    id: "sample-data",
    title: "Sample data readiness",
    checkIds: ["showcase-committed", "spine-offline", "compare-seeded", "showcase-only"],
  },
  {
    id: "platform",
    title: "Platform services",
    checkIds: ["api-ready", "demo-auth", "llm-budget"],
  },
  {
    id: "presentation",
    title: "Presentation mode",
    checkIds: ["static-label"],
  },
] as const;

export function groupDemoReadinessChecksBySection(
  checks: readonly BuyerCtoDemoReadinessCheck[],
): readonly { readonly section: DemoReadinessCheckSection; readonly checks: readonly BuyerCtoDemoReadinessCheck[] }[] {
  const checkById = new Map(checks.map((check) => [check.id, check]));

  return DEMO_READINESS_CHECK_SECTIONS.map((section) => ({
    section,
    checks: section.checkIds
      .map((id) => checkById.get(id))
      .filter((check): check is BuyerCtoDemoReadinessCheck => check !== undefined),
  })).filter((entry) => entry.checks.length > 0);
}
