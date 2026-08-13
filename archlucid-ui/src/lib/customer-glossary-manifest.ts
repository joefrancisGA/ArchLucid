/**
 * Customer-facing glossary contract for `/help/glossary`.
 * Internal field taxonomies belong in `docs/library/contributor-reference/RECORD_TYPE_FIELD_TAXONOMY.md`.
 */
export const CUSTOMER_GLOSSARY_CONTRACT_VERSION = "2026-07-13";

export type CustomerGlossaryCategoryId =
  | "review-process"
  | "evidence"
  | "decisions-and-findings"
  | "risk-and-controls"
  | "governance"
  | "organization-and-access"
  | "deliverables";

export type CustomerGlossaryTermVisibility = "customer" | "internal-only";

export type CustomerGlossaryTerm = {
  readonly id: string;
  readonly label: string;
  readonly definition: string;
  readonly category: CustomerGlossaryCategoryId;
  readonly aliases?: readonly string[];
  readonly relatedTermIds?: readonly string[];
  readonly detail?: string;
  readonly deprecatedAliases?: readonly string[];
  readonly visibility: CustomerGlossaryTermVisibility;
};

export const CUSTOMER_GLOSSARY_CATEGORY_ORDER: readonly CustomerGlossaryCategoryId[] = [
  "review-process",
  "evidence",
  "decisions-and-findings",
  "risk-and-controls",
  "governance",
  "organization-and-access",
  "deliverables",
];

export const CUSTOMER_GLOSSARY_CATEGORY_LABELS: Readonly<Record<CustomerGlossaryCategoryId, string>> = {
  "review-process": "Review process",
  evidence: "Evidence",
  "decisions-and-findings": "Decisions and findings",
  "risk-and-controls": "Risk and controls",
  governance: "Governance",
  "organization-and-access": "Organization and access",
  deliverables: "Deliverables",
};

export const CUSTOMER_GLOSSARY_TERMS: readonly CustomerGlossaryTerm[] = [
  {
    id: "review",
    label: "Review",
    definition:
      "A structured evaluation of architecture change or design intent tied to evidence and policy. In ArchLucid, a review is the governed process from intake through finalized outputs.",
    category: "review-process",
    relatedTermIds: ["review-package", "architecture-draft"],
    detail:
      "A review is the governed evaluation process from intake through finalized outputs such as the signed review record, findings, and exports.",
    visibility: "customer",
  },
  {
    id: "architecture-draft",
    label: "Architecture draft",
    definition:
      "A saved, resumable description of architecture intent and context. Saving or editing a draft does not start a review.",
    category: "review-process",
    relatedTermIds: ["review", "review-package"],
    visibility: "customer",
  },
  {
    id: "review-package",
    label: "Architecture review",
    definition:
      "The durable record for one architecture review: findings, decisions, evidence links, signed review record, governance records, and exportable deliverables.",
    category: "review-process",
    relatedTermIds: ["review", "signed-review-record", "deliverable"],
    detail:
      "Stakeholders open an architecture review to triage findings, finalize, export, compare, and audit outcomes. Finalize locks the signed review record and sponsor-ready exports.",
    deprecatedAliases: ["Review package", "review package", "Architecture package", "architecture package", "Finalized review"],
    visibility: "customer",
  },
  {
    id: "signed-review-record",
    label: "Signed review record",
    definition:
      "The immutable, provenance-backed package that closes a finalized review. ArchLucid treats it as the authoritative review anchor for governance and exports. Do not call this a signed decision record — a decision is one disposition inside the package.",
    category: "review-process",
    aliases: ["Signed review record"],
    deprecatedAliases: ["Signed manifest", "Golden manifest", "Signed decision record"],
    relatedTermIds: ["review-package", "evidence-trail", "decision"],
    visibility: "customer",
  },
  {
    id: "evidence-trail",
    label: "Evidence trail",
    definition:
      "The inspectable lineage from inputs through analysis steps to reviewer-visible conclusions and citations.",
    category: "evidence",
    relatedTermIds: ["evidence-graph", "citation", "audit-trail"],
    detail:
      "An evidence trail explains what supports a conclusion. An audit trail records who performed actions and when.",
    visibility: "customer",
  },
  {
    id: "evidence-graph",
    label: "Evidence graph",
    definition:
      "The graph view that shows how evidence, findings, and review context connect for a selected review.",
    category: "evidence",
    aliases: ["Graph"],
    relatedTermIds: ["evidence-trail", "finding"],
    visibility: "customer",
  },
  {
    id: "citation",
    label: "Citation",
    definition: "A reference from a finding or conclusion back to a specific evidence source in the review.",
    category: "evidence",
    relatedTermIds: ["evidence-trail", "finding"],
    visibility: "customer",
  },
  {
    id: "finding",
    label: "Finding",
    definition:
      "An observed condition or conclusion produced during review analysis, with severity and links to supporting evidence.",
    category: "decisions-and-findings",
    relatedTermIds: ["risk", "control", "decision"],
    detail: "A finding is an observed condition or conclusion. A risk is a potential adverse outcome that may be associated with findings.",
    visibility: "customer",
  },
  {
    id: "decision",
    label: "Decision",
    definition:
      "A recorded disposition on review proposals—such as approve, waive, defer, or escalate—captured for governance and audit. Not the same as the signed review record (the package that locks those decisions at finalize).",
    category: "decisions-and-findings",
    relatedTermIds: ["governance-approval", "finding", "signed-review-record"],
    detail:
      "Browse decisions in the Decision register. Open the signed review record for the immutable package that contains decisions, findings, and exports for one review.",
    visibility: "customer",
  },
  {
    id: "risk",
    label: "Risk",
    definition:
      "A potential adverse outcome related to architecture or operational change, often tracked alongside findings and controls.",
    category: "risk-and-controls",
    relatedTermIds: ["finding", "control"],
    visibility: "customer",
  },
  {
    id: "control",
    label: "Control",
    definition:
      "A safeguard—process, tooling, entitlement, or monitoring—that mitigates risk or enforces policy during review and operations.",
    category: "risk-and-controls",
    relatedTermIds: ["risk", "policy-pack"],
    visibility: "customer",
  },
  {
    id: "governance-approval",
    label: "Governance approval",
    definition:
      "A committed governance decision that affects rollout, waiver, exception, or escalation for a review or related record.",
    category: "governance",
    relatedTermIds: ["decision", "audit-trail"],
    visibility: "customer",
  },
  {
    id: "audit-trail",
    label: "Audit trail",
    definition:
      "The replayable ledger of authenticated actions across reviews, approvals, exports, and integrations in your workspace.",
    category: "governance",
    relatedTermIds: ["evidence-trail", "governance-approval"],
    visibility: "customer",
  },
  {
    id: "policy-pack",
    label: "Policy pack",
    definition:
      "A versioned bundle of rules, thresholds, and governance mappings applied to reviews in your workspace.",
    category: "governance",
    relatedTermIds: ["finding", "control"],
    visibility: "customer",
  },
  {
    id: "tenant",
    label: "Tenant",
    definition: "The top-level organization boundary that isolates customer data in ArchLucid.",
    category: "organization-and-access",
    relatedTermIds: ["workspace", "project"],
    visibility: "customer",
  },
  {
    id: "workspace",
    label: "Workspace",
    definition:
      "A collaboration boundary under a tenant where reviews, findings, and exports are grouped for a team or program.",
    category: "organization-and-access",
    relatedTermIds: ["tenant", "project"],
    visibility: "customer",
  },
  {
    id: "project",
    label: "Project",
    definition: "A routing scope within a workspace. Most pilot flows use one primary project per workspace.",
    category: "organization-and-access",
    relatedTermIds: ["workspace", "tenant"],
    visibility: "customer",
  },
  {
    id: "deliverable",
    label: "Deliverable",
    definition:
      "An exportable output aimed at a specific audience, such as an sponsor report, board packet, or diligence bundle.",
    category: "deliverables",
    relatedTermIds: ["review-package", "signed-review-record"],
    visibility: "customer",
  },
];

export function listCustomerFacingGlossaryTerms(): readonly CustomerGlossaryTerm[] {
  return CUSTOMER_GLOSSARY_TERMS.filter((term) => term.visibility === "customer");
}

export function getCustomerGlossaryTermById(id: string): CustomerGlossaryTerm | null {
  const normalized = id.trim().toLowerCase();

  return CUSTOMER_GLOSSARY_TERMS.find((term) => term.id === normalized) ?? null;
}

export function sortGlossaryTermsAlphabetically(terms: readonly CustomerGlossaryTerm[]): CustomerGlossaryTerm[] {
  return [...terms].sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: "base" }));
}

export function glossaryTermsForCategory(
  terms: readonly CustomerGlossaryTerm[],
  category: CustomerGlossaryCategoryId | "all",
): CustomerGlossaryTerm[] {
  const alphabetized = sortGlossaryTermsAlphabetically(terms);

  if (category === "all") {
    return alphabetized;
  }

  return alphabetized.filter((term) => term.category === category);
}

export function filterGlossaryTermsByQuery(
  terms: readonly CustomerGlossaryTerm[],
  query: string,
  termLabelById: Readonly<Record<string, string>>,
): CustomerGlossaryTerm[] {
  const normalized = query.trim().toLowerCase();

  if (normalized.length === 0) {
    return sortGlossaryTermsAlphabetically(terms);
  }

  return sortGlossaryTermsAlphabetically(
    terms.filter((term) => {
      const haystack = [
        term.label,
        term.definition,
        term.detail ?? "",
        ...(term.aliases ?? []),
        ...(term.deprecatedAliases ?? []),
        ...(term.relatedTermIds ?? []).map((relatedId) => termLabelById[relatedId] ?? relatedId),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    }),
  );
}

export function buildGlossaryTermLabelIndex(terms: readonly CustomerGlossaryTerm[]): Readonly<Record<string, string>> {
  const index: Record<string, string> = {};

  for (const term of terms) {
    index[term.id] = term.label;
  }

  return index;
}

export function lettersWithGlossaryTerms(terms: readonly CustomerGlossaryTerm[]): readonly string[] {
  const letters = new Set<string>();

  for (const term of terms) {
    const first = term.label.trim().charAt(0).toUpperCase();

    if (/[A-Z]/.test(first)) {
      letters.add(first);
    }
  }

  return [...letters].sort();
}
