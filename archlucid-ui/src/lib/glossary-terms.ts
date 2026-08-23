/**
 * Auto-generated from docs/library/GLOSSARY.md via scripts/ui/sync-glossary.ts.
 * UI-specific keys and doc links are cataloged in the sync script; matched definitions are synced from GLOSSARY.md.
 */
export type GlossaryTermEntry = {
  term: string;
  definition: string;
  /** Repo-relative doc path (browser may 404; useful from IDE and static hosts). */
  docLink?: string;
};

export const GLOSSARY_TERMS = {
  run: {
    term: "Architecture review",
    definition: "A structured examination of architecture change or design intent tied to artifacts and policies. In product copy, prefer architecture review when the reader might confuse \"review\" with code review alone.",
    docLink: "/help/glossary#term-review",
  },
  golden_manifest: {
    term: "Finalized review record",
    definition: "The provenance-backed record that closes a finalized review (what was decided, bound to lineage). PKI-style cryptographic signing is not claimed for current V1 storage unless a deployment explicitly enables it — treat \"signed\" as lineage / provenance closure unless an architecture note says otherwise. Former terms: *signed manifest*, *golden manifest*, *sealed review record*.",
    docLink: "/help/glossary#term-sealed-review-record",
  },
  review_package: {
    term: "Review package",
    definition: "A finalized architecture review with finalized review record, evidence trail, findings, approval records, and deliverables — the unit buyers open from the reviews list.",
    docLink: "/help/glossary#term-review-package",
  },
  findings: {
    term: "Finding",
    definition: "A machine- or assisted-generated observation from decisioning (risk, drift, conformance, duplication, etc.). Finding severity and policy mapping live in packs and workflows; distinguish from informal \"comments\" outside the ledger.",
    docLink: "/help/glossary#term-finding",
  },
  authority_pipeline: {
    term: "Review pipeline",
    definition: "The in-process pipeline that runs ingestion → graph → findings → decisioning → artifact synthesis for one architecture review, inside a SQL unit of work.",
    docLink: "/docs/library/GLOSSARY.md#authority-run-orchestrator",
  },
  context_snapshot: {
    term: "Context snapshot",
    definition: "A point-in-time capture of ingested context (declarations, requirements, topology) that feeds the knowledge graph.",
    docLink: "/docs/library/GLOSSARY.md#context-snapshot",
  },
  decision_trace: {
    term: "Decision trace",
    definition: "A structured log of decisioning for a run — rules, applied findings, and outcome — used for provenance and replay.",
    docLink: "/docs/library/GLOSSARY.md#decision-trace",
  },
  provenance: {
    term: "Provenance",
    definition: "The chronological, inspectable lineage from inputs (prompts, repositories, citations) through deterministic steps to reviewer-visible outputs. Evidence that cannot be reconstructed from stored traces is weaker procurement posture — call that gap explicitly.",
    docLink: "/help/glossary#term-evidence-trail",
  },
  effective_governance: {
    term: "Effective policy",
    definition: "The merged policy content for this scope, used for alerts, compliance, and advisory decisions.",
    docLink: "/docs/library/GLOSSARY.md#effective-governance",
  },
  policy_pack: {
    term: "Policy pack",
    definition: "A versioned bundle of rules, thresholds, and policy mappings applied to reviews (compliance, finding treatment, approval checks before finalize). Packs are assigned, published, and audited — not informal one-off prose.",
    docLink: "/help/glossary#term-policy-pack",
  },
  knowledge_graph: {
    term: "Knowledge graph",
    definition: "A typed graph of nodes and edges built from a context snapshot — used by finding engines and the graph UI.",
    docLink: "/docs/library/GLOSSARY.md#knowledge-graph",
  },
  artifact_bundle: {
    term: "Artifact bundle",
    definition: "An exportable artifact aimed at a specific audience (sponsor report, architecture board packet, security appendix, diligence bundle). Distinct from a raw finding row: deliverables are packaged outputs.",
    docLink: "/help/glossary#term-deliverable",
  },
  scope: {
    term: "Scope",
    definition: "The top-level customer boundary for data isolation. In typical SaaS posture, one tenant is one customer organization unless the contract defines otherwise.",
    docLink: "/help/scope",
  },
  comparison_replay: {
    term: "Comparison replay",
    definition: "Re-running comparison logic on stored output without re-invoking agents, to see deltas under new rules.",
    docLink: "/docs/library/GLOSSARY.md#comparison-replay",
  },
  hosting_role: {
    term: "Hosting role",
    definition: "Whether a process runs API, worker, or combined — controls which services and background jobs are active.",
    docLink: "/docs/library/GLOSSARY.md#hosting-role",
  },
  outbox: {
    term: "Transactional outbox",
    definition: "SQL tables that enqueue work in the same transaction as the change; workers publish or process rows reliably after commit.",
    docLink: "/docs/library/GLOSSARY.md#outbox-transactional-outbox",
  },
  finding_engine: {
    term: "Finding engine",
    definition: "A pluggable component that reads context/graph state and returns findings; multiple engines run in the orchestrated pipeline.",
    docLink: "/docs/library/GLOSSARY.md#finding-engine",
  },
  audit_event: {
    term: "Audit event",
    definition: "The persisted, replayable ledger of authenticated actions across reviews, merges, approvals, retention, notifications, exports, and integrations — narrower than informal logging; wider than SIEM payloads alone. Audit trail retention norms are posture-specific.",
  },
  governance_workflow: {
    term: "Resolve outcomes workflow",
    definition: "A committed decision in the approval workflow affecting merge, rollout, waiver, exception, or escalation — differentiated from UX affordances labelled \"Approve\" unless they write to approval state.",
  },
  architecture_manifest: {
    term: "Finalized review record",
    definition: "A finalized architecture record containing decisions, findings, and evidence — ready for approval and sponsor export.",
    docLink: "/docs/library/GLOSSARY.md#golden-manifest",
  },
  manifest_diff: {
    term: "Review comparison",
    definition: "A field-level comparison between two finalized review records (or their persisted projection), used in Compare to see what changed between reviews.",
    docLink: "/docs/library/COMPARISON_REPLAY.md",
  },
  comparison_record: {
    term: "Comparison record",
    definition: "A persisted result of a compare (legacy and/or structured paths) you can re-open, replay, or reason about without re-running agents.",
    docLink: "/docs/library/COMPARISON_REPLAY.md",
  },
  approval_request: {
    term: "Approval request",
    definition: "A committed decision in the approval workflow affecting merge, rollout, waiver, exception, or escalation — differentiated from UX affordances labelled \"Approve\" unless they write to approval state.",
    docLink: "/docs/library/GLOSSARY.md#governance-workflow",
  },
  governance_resolution: {
    term: "Policy resolution",
    definition: "The read-only diagnostic view that shows merged policy packs, precedence decisions, and conflicts for the current scope.",
    docLink: "/docs/library/contributor-reference/GOVERNANCE.md",
  },
} as const satisfies Readonly<Record<string, GlossaryTermEntry>>;

export type GlossaryTermKey = keyof typeof GLOSSARY_TERMS;
