import * as fs from "fs";
import * as path from "path";

type GlossaryTermEntry = {
  term: string;
  definition: string;
  docLink?: string;
};

type CatalogEntry = GlossaryTermEntry & {
  /** When set, definition is synced from the matching row in docs/library/GLOSSARY.md. */
  glossaryMatch?: string;
};

const glossaryPath = path.resolve(process.cwd(), "../docs/library/GLOSSARY.md");
const outputPath = path.resolve(process.cwd(), "src/lib/glossary-terms.ts");

/** UI catalog keys; definitions with `glossaryMatch` are overwritten from GLOSSARY.md on sync. */
const CATALOG: Record<string, CatalogEntry> = {
  run: {
    term: "Architecture review",
    glossaryMatch: "Review",
    definition:
      "The top-level work unit: a request that flows through ingestion, graph, findings, decisioning, and artifacts, ending in a finalized golden manifest.",
    docLink: "/docs/library/GLOSSARY.md#architecture-run-run",
  },
  golden_manifest: {
    term: "Golden manifest",
    glossaryMatch: "Signed manifest",
    definition:
      "The versioned, finalized design record for an architecture review—the source of truth for governance, comparison, and artifacts.",
    docLink: "/docs/library/GLOSSARY.md#golden-manifest",
  },
  findings: {
    term: "Finding",
    glossaryMatch: "Finding",
    definition:
      "A structured observation from a finding engine about the architecture (policy gaps, cost, security, and similar).",
    docLink: "/docs/library/GLOSSARY.md#finding",
  },
  authority_pipeline: {
    term: "Review pipeline",
    definition:
      "The in-process pipeline that runs ingestion → graph → findings → decisioning → artifact synthesis for one architecture review, inside a SQL unit of work.",
    docLink: "/docs/library/GLOSSARY.md#authority-run-orchestrator",
  },
  context_snapshot: {
    term: "Context snapshot",
    definition:
      "A point-in-time capture of ingested context (declarations, requirements, topology) that feeds the knowledge graph.",
    docLink: "/docs/library/GLOSSARY.md#context-snapshot",
  },
  decision_trace: {
    term: "Decision trace",
    definition:
      "A structured log of decisioning for a run—rules, applied findings, and outcome—used for provenance and replay.",
    docLink: "/docs/library/GLOSSARY.md#decision-trace",
  },
  provenance: {
    term: "Provenance",
    glossaryMatch: "Evidence trail",
    definition:
      "A traceable record of how an architectural decision was made, linking findings, policy rules, and context snapshots.",
    docLink: "/docs/library/GLOSSARY.md#decision-trace",
  },
  effective_governance: {
    term: "Effective governance",
    definition:
      "The merged policy content for a scope (project → workspace → tenant) used for alerts, compliance, and advisories.",
    docLink: "/docs/library/GLOSSARY.md#effective-governance",
  },
  policy_pack: {
    term: "Policy pack",
    glossaryMatch: "Policy pack",
    definition:
      "A versioned document that bundles rules, advisories, and alert wiring; assigned to scopes and merged at evaluation time.",
    docLink: "/docs/library/GLOSSARY.md#policy-pack",
  },
  knowledge_graph: {
    term: "Knowledge graph",
    definition:
      "A typed graph of nodes and edges built from a context snapshot—used by finding engines and the graph UI.",
    docLink: "/docs/library/GLOSSARY.md#knowledge-graph",
  },
  artifact_bundle: {
    term: "Artifact bundle",
    glossaryMatch: "Deliverable",
    definition:
      "A ZIP of artifacts for a run (diagrams, documents, JSON). Large bundles may be stored in blob storage.",
    docLink: "/docs/library/GLOSSARY.md#artifact-bundle",
  },
  scope: {
    term: "Scope",
    glossaryMatch: "Tenant",
    definition:
      "Tenant / workspace / project identifiers that partition data; carried in claims or headers and enforced in SQL (RLS when enabled).",
    docLink: "/docs/library/GLOSSARY.md#scope-tenant--workspace--project",
  },
  comparison_replay: {
    term: "Comparison replay",
    definition:
      "Re-running comparison logic on stored output without re-invoking agents, to see deltas under new rules.",
    docLink: "/docs/library/GLOSSARY.md#comparison-replay",
  },
  hosting_role: {
    term: "Hosting role",
    definition:
      "Whether a process runs API, worker, or combined—controls which services and background jobs are active.",
    docLink: "/docs/library/GLOSSARY.md#hosting-role",
  },
  outbox: {
    term: "Transactional outbox",
    definition:
      "SQL tables that enqueue work in the same transaction as the change; workers publish or process rows reliably after commit.",
    docLink: "/docs/library/GLOSSARY.md#outbox-transactional-outbox",
  },
  finding_engine: {
    term: "Finding engine",
    definition:
      "A pluggable component that reads context/graph state and returns findings; multiple engines run in the orchestrated pipeline.",
    docLink: "/docs/library/GLOSSARY.md#finding-engine",
  },
  audit_event: {
    term: "Audit event",
    glossaryMatch: "Audit trail",
    definition:
      "One row in the tenant audit log: who did what, when, with optional correlation, run, and detail payload JSON.",
  },
  governance_workflow: {
    term: "Governance workflow",
    glossaryMatch: "Governance approval",
    definition:
      "The structured path to request, review, and activate manifest changes for a run, with approver and evidence trail.",
  },
  architecture_manifest: {
    term: "Architecture manifest",
    glossaryMatch: "Signed manifest",
    definition:
      "A finalized architecture record containing decisions, findings, and evidence — ready for governance review and sponsor export.",
    docLink: "/docs/library/GLOSSARY.md#golden-manifest",
  },
  manifest_diff: {
    term: "Manifest diff",
    definition:
      "A field-level comparison between two finalized, reviewed manifests (or their persisted projection), used in Compare to see what changed between runs.",
    docLink: "/docs/library/COMPARISON_REPLAY.md",
  },
  comparison_record: {
    term: "Comparison record",
    definition:
      "A persisted result of a compare (legacy and/or structured paths) you can re-open, replay, or reason about without re-running agents.",
    docLink: "/docs/library/COMPARISON_REPLAY.md",
  },
  approval_request: {
    term: "Approval request",
    glossaryMatch: "Governance approval",
    definition:
      "A governance row asking approvers to promote, reject, or activate a change for a run, with segregation of duties and audit trail.",
    docLink: "/docs/library/GLOSSARY.md#governance-workflow",
  },
  governance_resolution: {
    term: "Governance resolution",
    definition:
      "The operator workflow that applies policy, reconciles risk, and routes outcomes after findings or compliance signals—before or instead of a formal approval in some tenants.",
    docLink: "/docs/library/contributor-reference/GOVERNANCE.md",
  },
};

function resolveGlossaryPath(): string {
  if (fs.existsSync(glossaryPath)) {
    return glossaryPath;
  }

  const altPath = path.resolve(process.cwd(), "../docs/GLOSSARY.md");

  if (fs.existsSync(altPath)) {
    return altPath;
  }

  throw new Error("Could not find GLOSSARY.md");
}

function parseGlossaryTable(content: string): Map<string, string> {
  const lines = content.split("\n");
  let inTable = false;
  const terms = new Map<string, string>();

  for (const line of lines) {
    if (line.trim().startsWith("| Term | Definition |")) {
      inTable = true;
      continue;
    }

    if (inTable && line.trim().startsWith("|------")) {
      continue;
    }

    if (inTable && line.trim().startsWith("|")) {
      const parts = line.split("|");

      if (parts.length >= 3) {
        const term = parts[1].trim().replace(/\*\*/g, "");
        const definition = parts[2].trim().replace(/\*\*/g, "");

        if (term.length > 0 && definition.length > 0) {
          terms.set(term, definition);
        }
      }

      continue;
    }

    if (inTable && line.trim().length > 0 && !line.trim().startsWith("|")) {
      break;
    }
  }

  return terms;
}

function escapeForTsString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ");
}

function formatEntry(key: string, entry: GlossaryTermEntry): string {
  const lines = [`  ${key}: {`, `    term: "${escapeForTsString(entry.term)}",`, `    definition: "${escapeForTsString(entry.definition)}",`];

  if (entry.docLink !== undefined) {
    lines.push(`    docLink: "${escapeForTsString(entry.docLink)}",`);
  }

  lines.push("  },");

  return lines.join("\n");
}

function buildMergedCatalog(glossaryDefinitions: Map<string, string>): Record<string, GlossaryTermEntry> {
  const merged: Record<string, GlossaryTermEntry> = {};

  for (const [key, catalogEntry] of Object.entries(CATALOG)) {
    const glossaryMatch = catalogEntry.glossaryMatch;
    const syncedDefinition =
      glossaryMatch !== undefined ? glossaryDefinitions.get(glossaryMatch) : undefined;

    merged[key] = {
      term: catalogEntry.term,
      definition: syncedDefinition ?? catalogEntry.definition,
      ...(catalogEntry.docLink !== undefined ? { docLink: catalogEntry.docLink } : {}),
    };
  }

  return merged;
}

function writeGlossaryTermsFile(entries: Record<string, GlossaryTermEntry>): void {
  const body = Object.entries(entries)
    .map(([key, entry]) => formatEntry(key, entry))
    .join("\n");

  const fileContent = `/**
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
${body}
} as const satisfies Readonly<Record<string, GlossaryTermEntry>>;

export type GlossaryTermKey = keyof typeof GLOSSARY_TERMS;
`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, fileContent);
}

try {
  const glossaryDefinitions = parseGlossaryTable(fs.readFileSync(resolveGlossaryPath(), "utf-8"));
  const merged = buildMergedCatalog(glossaryDefinitions);

  writeGlossaryTermsFile(merged);

  const syncedCount = Object.values(CATALOG).filter((entry) => entry.glossaryMatch !== undefined).length;
  console.log(
    `Generated ${outputPath} with ${Object.keys(merged).length} terms (${syncedCount} definitions synced from GLOSSARY.md).`,
  );
} catch (err) {
  console.error(err);
  process.exit(1);
}
