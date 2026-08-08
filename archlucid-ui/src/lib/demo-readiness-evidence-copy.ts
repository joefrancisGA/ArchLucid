import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const DEMO_READINESS_CANONICAL_PATH = "/internal/demo-readiness" as const;

export const DEMO_READINESS_CLAIM_DISCIPLINE =
  "This Demo readiness page is an internal employee diagnostic for buyer CTO demo checks - it is not a signed-review diligence Sources package. Open System health, Trial funnel, or Audit when you need live dependency, conversion, or governed trails.";

export const DEMO_READINESS_SOURCES_INTRO =
  "Use these follow-ups when demo checks turn into platform health, trial conversion, or public demo surfaces.";

export type DemoReadinessSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources - no self-href to `/internal/demo-readiness`. */
export const DEMO_READINESS_SOURCES: readonly DemoReadinessSourceLink[] = [
  { label: "System health", href: "/administration/system-health" },
  { label: "Trial funnel", href: "/internal/trial-funnel" },
  { label: "Tenant health", href: "/internal/tenant-health" },
  { label: "Live demo", href: "/live-demo" },
  { label: "Choose your next step", href: inAppHelpHref("path-chooser") },
] as const;
