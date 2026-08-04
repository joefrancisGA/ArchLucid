export const DEMO_ENTRY_CANONICAL_PATH = "/demo" as const;

export const DEMO_ENTRY_CLAIM_DISCIPLINE =
  "This URL is a shareable demo entry that immediately redirects into the CTO tour or home — it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Security & trust or the Trust Center when you need assurance artifacts.";

export const DEMO_ENTRY_SOURCES_INTRO =
  "Use these evaluation links if the automatic redirect does not complete, or when you need assurance and packaging follow-ups instead of the demo tour.";

export const DEMO_ENTRY_REDIRECTING_LABEL = "Opening the ArchLucid demo…";

export type DemoEntrySourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Marketing/operator Sources — no self-href to `/demo`. */
export const DEMO_ENTRY_SOURCES: readonly DemoEntrySourceLink[] = [
  { label: "Product FAQ", href: "/faq" },
  { label: "Security & trust", href: "/security-trust" },
  { label: "Trust Center", href: "/trust" },
  { label: "Pricing", href: "/pricing" },
  { label: "Start evaluation", href: "/signup" },
] as const;
