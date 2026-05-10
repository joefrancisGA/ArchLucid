/**
 * Core in-product glossary entries (short + long). For the broader operator glossary with doc links, see `glossary-terms.ts`.
 * Word budgets: short ≤20 words, long ≤60 words (enforced in unit tests).
 */
export type GlossaryDefinitionEntry = {
  readonly displayLabel: string;
  readonly shortDefinition: string;
  readonly longDefinition: string;
};

export const GLOSSARY_DEFINITIONS = {
  run: {
    displayLabel: "Run",
    shortDefinition: "A single architecture review work unit from intake through finalized outputs.",
    longDefinition:
      "A run captures one architecture question end-to-end: ingested context, graph and findings, decisioning, and synthesized artifacts culminating in a versioned manifest you can govern and compare.",
  },
  manifest: {
    displayLabel: "Golden manifest",
    shortDefinition: "The finalized, reviewed architecture record treated as source of truth for a run.",
    longDefinition:
      "The golden manifest is the immutable, versioned design package for a run—decisions, findings, and evidence together—used for approvals, exports, and diffs against other runs.",
  },
  finding: {
    displayLabel: "Finding",
    shortDefinition: "A structured observation about risk, cost, policy, or design quality tied to evidence.",
    longDefinition:
      "A finding records what the engines observed, rule context, and traceable evidence so reviewers can accept, waive, or remediate without losing provenance.",
  },
  artifact: {
    displayLabel: "Artifact",
    shortDefinition: "Generated output from a run—diagrams, documents, JSON, or bundles for sponsors.",
    longDefinition:
      "Artifacts are versioned deliverables produced after decisioning—anything from diagrams to narrative packs—packaged for download or downstream systems.",
  },
  evidence_package: {
    displayLabel: "Evidence package",
    shortDefinition: "The curated trace bundle proving how conclusions were reached for a run.",
    longDefinition:
      "An evidence package aggregates citations, snapshots, and decision traces so sponsors and auditors can verify claims without replaying the entire pipeline.",
  },
  authority_chain: {
    displayLabel: "Authority chain",
    shortDefinition: "The ordered pipeline that applies policies and records authoritative outcomes for a run.",
    longDefinition:
      "The authority chain is the trusted sequence from context through engines and governance: each step declares inputs, rules, and outputs so overrides and replay stay explainable.",
  },
  governance_gate: {
    displayLabel: "Governance approval",
    shortDefinition: "Checkpoints where policy, reviewers, or thresholds must pass before advancing.",
    longDefinition:
      "Governance approvals enforce required reviewers, policy packs, and risk thresholds before a manifest or deliverable state advances—blocking unsafe silent changes.",
  },
  policy_pack: {
    displayLabel: "Policy pack",
    shortDefinition: "A versioned bundle of rules, advisories, and alert wiring assigned to scopes.",
    longDefinition:
      "Policy packs merge at evaluation time to define what “good” means: compliance rules, cost caps, advisories, and how violations surface to operators.",
  },
  comparison: {
    displayLabel: "Comparison",
    shortDefinition: "A structured diff between two finalized manifests or persisted comparison results.",
    longDefinition:
      "Comparison highlights field-level and semantic deltas across runs or snapshots so teams see what changed in decisions, findings, and evidence without re-running agents.",
  },
  replay: {
    displayLabel: "Replay",
    shortDefinition: "Re-executing stored logic or outputs to reproduce deltas under current rules.",
    longDefinition:
      "Replay recomputes comparison or governance views from saved manifests and traces—useful when policies change and you need a consistent historical baseline.",
  },
} as const satisfies Readonly<Record<string, GlossaryDefinitionEntry>>;

export type GlossaryDefinitionId = keyof typeof GLOSSARY_DEFINITIONS;

/** Stable list of core term ids for tests and iteration. */
export const GLOSSARY_CORE_TERM_IDS = Object.freeze(
  Object.keys(GLOSSARY_DEFINITIONS) as GlossaryDefinitionId[],
);
