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
    href: "/help/specialty-walkthroughs",
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
    href: "/help/specialty-walkthroughs",
    label: "Golden sponsor export walkthrough",
    hint: "Illustrative sample package only — use the sample review link from Help when you are ready.",
  },
] as const;
