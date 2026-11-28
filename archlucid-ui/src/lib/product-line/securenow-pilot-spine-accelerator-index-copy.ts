import {
  SECURENOW_GOLDEN_SPONSOR_WALKTHROUGH_HREF,
  SECURENOW_SPECIALTY_TEMPLATES_HREF,
} from "@/lib/product-line/securenow-accelerator-template-links";

export const SECURENOW_PILOT_SPINE_ACCELERATOR_INDEX_TITLE = "Labeled accelerator catalog" as const;

export const SECURENOW_PILOT_SPINE_ACCELERATOR_INDEX_LEAD =
  "Jump to fixture-safe templates and guides. Each link names whether data is illustrative or tenant-backed — none replace capture on your subscription." as const;

export type SecureNowPilotSpineAcceleratorLink = {
  readonly id: string;
  readonly href: string;
  readonly label: string;
  readonly hint: string;
};

export const SECURENOW_PILOT_SPINE_ACCELERATOR_LINKS: readonly SecureNowPilotSpineAcceleratorLink[] = [
  {
    id: "sponsor-path",
    href: "/administration/securenow-sponsor-path",
    label: "Sponsor path rehearsal",
    hint: "Disposition practice with fixture-path-01 or your ranked path after inspect.",
  },
  {
    id: "specialty-walkthroughs",
    href: SECURENOW_SPECIALTY_TEMPLATES_HREF,
    label: "Specialty review templates",
    hint: "Choose a labeled intake template; previews stay read-only until you start a review.",
  },
  {
    id: "first-review-guide",
    href: "/architecture/first-review-guide",
    label: "First review guide",
    hint: "Tenant checklist after prerequisites — not the same as the fixture pilot spine.",
  },
  {
    id: "golden-sponsor",
    href: SECURENOW_GOLDEN_SPONSOR_WALKTHROUGH_HREF,
    label: "Golden sponsor export walkthrough",
    hint: "Illustrative architecture review sample only — exports stay separate from live workspace data.",
  },
  {
    id: "fixture-path-03",
    href: "/securenow-sample#fixture-path-03",
    label: "Third synthetic path (fixture-path-03)",
    hint: "Vault secrets hops on the public sample, then sponsor path rehearsal in product.",
  },
  {
    id: "remediation-factory-empty",
    href: "/security/remediation-factory",
    label: "Pilot beat 2 when ranked paths are empty",
    hint: "Fixture walkthrough only — no stored ranked paths on your subscription yet.",
  },
] as const;
