import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { LIVE_DEMO_PAGE_TITLE } from "@/lib/live-demo-page-copy";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const DEMO_READINESS_CANONICAL_PATH = "/internal/demo-readiness" as const;

/** Page H1 on the admin diagnostics surface — distinct from sidebar nav label (TB-1409). */
export const INTERNAL_DEMO_READINESS_PAGE_TITLE = "Internal demo readiness" as const;

/** PageHeading metadata — names the Internal Operations nav group for operators (TB-1409). */
export const INTERNAL_OPERATIONS_NAV_EYEBROW = "Internal Operations" as const;

/** Default run-of-show download name on Demo readiness admin — no `cto-demo` segment (TB-1410). */
export const DEMO_READINESS_RUN_OF_SHOW_DOWNLOAD_FILENAME = "archlucid-internal-demo-runofshow.md" as const;

/** Empty-state title when demo-operator tooling is off in this deployment (TB-1411). */
export const INTERNAL_DEMO_READINESS_TOOLING_DISABLED_TITLE = "Demo operator checks are not enabled here" as const;

export const INTERNAL_DEMO_READINESS_TOOLING_DISABLED_BODY =
  "This page is for ArchLucid employees and demo operators who run internal showcase readiness checks. It is not turned on in this deployment — bookmarked links will not show the checklist until your environment enables demo-operator tooling.";

export const INTERNAL_DEMO_READINESS_TOOLING_DISABLED_DIAGNOSTICS_CTA = "Open diagnostics dashboard" as const;

export const INTERNAL_DEMO_READINESS_TOOLING_DISABLED_SYSTEM_HEALTH_CTA = "Open System health" as const;

export const DEMO_READINESS_CLAIM_DISCIPLINE =
  "This Demo readiness page is an internal employee diagnostic for buyer CTO demo checks - it is not a signed-review diligence Sources package. Open System health, Trial funnel, or Audit when you need live dependency, conversion, or governed trails.";

export const DEMO_READINESS_SOURCES_INTRO =
  "Use these follow-ups when demo checks turn into platform health, trial conversion, or public demo surfaces.";


/** Operator Sources - no self-href to `/internal/demo-readiness`. */
export const DEMO_READINESS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "System health", href: "/administration/system-health" },
  { label: "Trial funnel", href: "/internal/trial-funnel" },
  { label: "Tenant health", href: "/internal/tenant-health" },
  { label: LIVE_DEMO_PAGE_TITLE, href: "/live-demo" },
  { label: "Choose your next step", href: inAppHelpHref("choose-your-next-step") },
] as const;
