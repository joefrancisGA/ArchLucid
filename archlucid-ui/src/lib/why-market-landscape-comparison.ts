/**
 * Condensed qualitative rows for the public **`/why`** page — summarized from **`docs/go-to-market/COMPETITIVE_LANDSCAPE.md`** §2.3 (*AI-native tools*).
 * Not a quantitative scorecard (that remains the deterministic hard-comparison grid + proof pack elsewhere on the page).
 */
export type WhyMarketLandscapeMarketingRow = {
  readonly dimension: string;
  readonly archlucid: string;
  readonly githubCopilotAdHocArchitecture: string;
  readonly manualChatgptClaude: string;
  readonly structurizrWithAssist: string;
};

export const WHY_MARKET_LANDSCAPE_MARKETING_ROWS: readonly WhyMarketLandscapeMarketingRow[] = [
  {
    dimension: "Pricing",
    archlucid: "Consumption-based SaaS with published packaging documentation and quote-led enterprise paths.",
    githubCopilotAdHocArchitecture: "Typical fit: per-seat developer tooling billed for IDE assistance.",
    manualChatgptClaude: "Typical fit: conversational assist with unstructured outputs and manual prompting.",
    structurizrWithAssist:
      "Typical fit: modeling and diagram DSL with optional SaaS tiers; packaged governance evidence varies by rollout.",
  },
  {
    dimension: "AI capability",
    archlucid:
      "Purpose-built governed review workflow — multi-agent synthesis, deterministic replay, routed models behind human-reviewed outcomes.",
    githubCopilotAdHocArchitecture: "Typical fit: code completions and refactoring assistance in the editor.",
    manualChatgptClaude: "Often used for exploratory analysis; repeatability depends on prompting and transcripts.",
    structurizrWithAssist:
      "Typical fit: architecture modeling views; analytical depth tied to authored models and integrations.",
  },
  {
    dimension: "Governance & audit posture",
    archlucid:
      "Committed manifests, segregation-of-duty gates, typed audit envelopes, and replay/export paths aligned to architecture review packs.",
    githubCopilotAdHocArchitecture: "Typical fit: developer workflow tooling — not an architecture-evidence catalogue product.",
    manualChatgptClaude: "Typical fit: interactive Q&A — not a governed package with finalized signed manifest lineage by default.",
    structurizrWithAssist:
      "Typical fit: documenting system context — governance promotion workflows differ from packaged review records.",
  },
];
