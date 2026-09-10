import { stripMarkdownSectionsByTitlePrefix } from "@/lib/help-markdown/section-strips";
import {
  applyLeakageRewriteTableThenCleanup,
} from "../leakage-rewrite-table";
import {
  CAIQ_SIG_LEAKAGE_REWRITES,
  DPA_TEMPLATE_LEAKAGE_REWRITES,
} from "../contributor-leakage-rewrite-tables";

import {
  dedupeConsecutiveCaiqSigPhrase,
  SOC2_SELF_ASSESSMENT_OMITTED_SECTION_PREFIXES,
  isSoc2SelfAssessmentContributorLeakageLine,
  TRUST_CENTER_SECURITY_DOC_REQUEST_DISCLOSURE,
} from "./internal";

export function stripCaiqSigContributorLeakage(markdown: string): string {
  const substituted = applyLeakageRewriteTableThenCleanup(markdown, CAIQ_SIG_LEAKAGE_REWRITES);

  return dedupeConsecutiveCaiqSigPhrase(substituted, "automated security testing in CI");
}

export function stripDpaTemplateContributorLeakage(markdown: string): string {
  return applyLeakageRewriteTableThenCleanup(markdown, DPA_TEMPLATE_LEAKAGE_REWRITES);
}

export function stripSoc2SelfAssessmentContributorSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, SOC2_SELF_ASSESSMENT_OMITTED_SECTION_PREFIXES);
}

export function alignSoc2SelfAssessmentRoadmapHonesty(markdown: string): string {
  return markdown
    .replace(
      /## SOC 2 Type I — readiness planning \(Q2–Q3 2026\)/gi,
      "## SOC 2 Type I — readiness planning (illustrative — not a commitment)",
    )
    .replace(
      /\| Readiness consultant engaged \| Illustrative — owner\/budget gated \|/gi,
      "| Readiness consultant engaged | When budget approves external consultant |",
    )
    .replace(
      /\| Control baseline freeze for observation \| Illustrative — owner\/budget gated \|/gi,
      "| Control baseline freeze for observation | After funded readiness workshop |",
    )
    .replace(
      /\| Type I observation period start \| 2026-09-01 \|/gi,
      "| Type I observation period start | Per selected CPA scope (not committed) |",
    )
    .replace(
      /\| Type I report \(stretch\) \| 2026-Q4 \|/gi,
      "| Type I report (stretch) | Requires executed attestation agreement |",
    )
    .replace(
      /\| Type I observation period start \| Illustrative — owner\/budget gated \|/gi,
      "| Type I observation period start | Per selected CPA scope (not committed) |",
    )
    .replace(
      /\| Type I report \(stretch\) \| Illustrative — owner\/budget gated \|/gi,
      "| Type I report (stretch) | Requires executed attestation agreement |",
    )
    .replace(
      /\*\*Open\*\* — requires external readiness consultant shortlist and budget line \(see Pending Questions\)/gi,
      "**Open** — readiness planning only; CPA Type I attestation requires funded consultant engagement and executed agreement (not a product commitment)",
    )
    .replace(
      /\| G-001 \| No CPA SOC 2 report \| CFO \/ Security \| Fund external readiness consultant \+ CPA firm; Type I observation window \|/gi,
      "| G-001 | No CPA SOC 2 report | Security / leadership | Fund external readiness consultant + CPA firm when budget approves |",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

export function stripSoc2SelfAssessmentContributorLeakage(markdown: string): string {
  const sectionStripped = stripSoc2SelfAssessmentContributorSections(markdown);
  const lines = sectionStripped.split("\n");
  const result: string[] = [];

  for (const line of lines) {
    if (/^\| G-001 \|/i.test(line)) {
      result.push(
        "| G-001 | No CPA SOC 2 report | Security / leadership | Fund external readiness consultant + CPA firm when budget approves | **Open** — readiness planning only; CPA Type I attestation requires funded consultant engagement and executed agreement (not a product commitment) |",
      );
      continue;
    }

    if (/^\| G-002 \|/i.test(line)) {
      result.push(
        "| G-002 | Third-party pen-test redacted summary not yet published | Security | Execute vendor program when funded | **Open** — ArchLucid uses owner-conducted testing; independent third-party publication when a funded program completes (not CPA SOC 2 attestation) |",
      );
      continue;
    }

    if (/^\| G-003 \|/i.test(line)) {
      result.push(
        "| G-003 | CAIQ / SIG not pre-filled | Security | Publish alongside trust center | **Closed (artifacts)** — [CAIQ / SIG questionnaire responses](/help/caiq-sig-response) |",
      );
      continue;
    }

    if (/^\| Security — logical access \|/i.test(line)) {
      result.push(
        "| Security — logical access | Entra / JWT roles, API keys, RBAC policies; privileged operations recorded in the [product audit trail](/help/security-trust) | Partial |",
      );
      continue;
    }

    if (/^\| Security — data protection \|/i.test(line)) {
      result.push(
        "| Security — data protection | Database-per-tenant catalogs with defense-in-depth; private endpoint posture in hosted deployments ([Data handling and tenant isolation](/help/data-handling)) | Partial |",
      );
      continue;
    }

    if (/^\| Security — secure SDLC \|/i.test(line)) {
      result.push(
        "| Security — secure SDLC | Automated security testing in CI (static analysis, contract tests, unit/integration tiers) — see [Security and trust](/help/security-trust) | Strong |",
      );
      continue;
    }

    if (/^\| Availability \|/i.test(line)) {
      result.push(
        "| Availability | Health monitoring, SLO documentation, and operational runbooks | Partial |",
      );
      continue;
    }

    if (isSoc2SelfAssessmentContributorLeakageLine(line)) {
      continue;
    }

    if (/^> \*\*Scope:\*\*/i.test(line.trim())) {
      result.push(
        "> **Scope:** SOC 2 Trust Services Criteria — **self-assessment only** (not CPA attestation). CAIQ/SIG pre-fills are available; Type I scoping remains a **readiness planning** milestone (not yet an opinion).",
      );
      continue;
    }

    result.push(line);
  }

  return alignSoc2SelfAssessmentRoadmapHonesty(
    result.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd(),
  );
}

export function alignCaiqSigAssuranceHonesty(markdown: string): string {
  return markdown
    .replace(
      /\|\s*Third-party pen test\s*\|\s*In flight\s*\|/gi,
      "| Third-party pen test | Planned, not yet scheduled |",
    )
    .replace(
      /\*\*In flight\*\*, \*\*Inherited\*\*/gi,
      "**Planned, not yet scheduled**, **Inherited**",
    )
    .replace(/pen[- ]test in flight/gi, "third-party penetration test planned, not yet scheduled")
    .replace(/pen[- ]test underway/gi, "third-party penetration test planned, not yet scheduled")
    .replace(/SOC 2 ready/gi, "SOC 2 self-assessment (not CPA attestation)")
    .replace(/SOC 2 certified/gi, "SOC 2 self-assessment (not CPA attestation)")
    .replace(/SOC 2 in process/gi, "SOC 2 readiness planning (not CPA attestation)")
    .replace(/almost attested/gi, "self-assessment only (not CPA attestation)")
    .replace(/\n{3,}/g, "\n\n");
}

export function stripTrustCenterContributorLeakage(markdown: string): string {
  let result = markdown
    .replace(/<!-- TRUST_CENTER_LAST_REVIEWED_UTC:[^>]+ -->\s*\n?/gi, "")
    .replace(/\*\*Canonical assurance wording:\*\*[^\n]*\n?/gi, "")
    .replace(/\*\*Canonical artefact\/status table:\*\*[^\n]*\n?/gi, "")
    .replace(/Former standalone body:[^\n]*\n?/gi, "")
    .replace(/Path-stable alias:[^\n]*\n?/gi, "")
    .replace(/`BUYER_SCALABILITY_FAQ\.md`[^\n]*\n?/gi, "")
    .replace(/buyer-jobs\/HEALTHCARE_CLAIMS_POLICY_REVIEW\.md/gi, "healthcare policy review guide")
    .replace(/`PROCUREMENT_RESPONSE_ACCELERATOR\.md`[^\n]*\n?/gi, "")
    .replace(/`PROCUREMENT_PACK_INDEX\.md`[^\n]*\n?/gi, "")
    .replace(/`ASSURANCE_STATUS_CANONICAL\.md`[^\n]*\n?/gi, "")
    .replace(/`PENDING_QUESTIONS\.md`[^\n]*\n?/gi, "")
    .replace(/`V1_SCOPE\.md`[^\n]*\n?/gi, "")
    .replace(/`AZURE_EXTRACTOR_INGEST\.md`[^\n]*\n?/gi, "")
    .replace(/`AZURE_EXTRACTOR_TECHNICAL_BACKLOG\.md`[^\n]*\n?/gi, "")
    .replace(/`POLICY_PACK_HEALTHCARE_CLAIMS_PILOT\.md[^`\s)]*`?/gi, "healthcare vertical positioning guide")
    .replace(/`docs\/runbooks\/TRUST_CENTER_FRESHNESS\.md`[^\n]*\n?/gi, "")
    .replace(/`docs\/go-to-market\/PROCUREMENT_PACK_INDEX\.md`[^\n]*\n?/gi, "")
    .replace(
      /The HTTP response carries an `ETag`[\s\S]*?`304 Not Modified`\./gi,
      "",
    )
    .replace(/the endpoint \*\*deliberately omits\*\* the redacted \*\*third-party\*\* pen-test summary because no third-party assessor report exists yet, and the pgp key \(future release\)\./gi, "The endpoint **deliberately omits** the redacted **third-party** pen-test summary because no third-party assessor report exists yet.")
    .replace(
      /\[scalability and load evidence\]\(#scalability-and-load-evidence\)/gi,
      "[Scalability and load evidence](/help/security-trust#scalability-and-load-evidence)",
    )
    .replace(
      /\[Assurance Status Canonical\]\(([^)]+)\)/gi,
      "[SOC 2 readiness roadmap]($1)",
    )
    .replace(
      /\[Pen Test Summary Procurement Interim\]\(([^)]+)\)/gi,
      "[Procurement FAQ]($1)",
    )
    .replace(
      /\[2026 Q2 Owner Conducted\]\(([^)]+)\)/gi,
      "[Owner-conducted pen-test summary]($1)",
    )
    .replace(
      /\[2026 Q2 Sow\]\(([^)]+)\)/gi,
      "[Pen-test SoW template]($1)",
    )
    .replace(
      /\[Soc2 Status Procurement\]\(([^)]+)\)/gi,
      "[SOC 2 procurement status]($1)",
    )
    .replace(
      /\[Remediation Tracker\]\(([^)]+)\)/gi,
      "[Pen-test remediation tracker]($1)",
    )
    .replace(
      /- \[Row-level security \(RLS\) and session context\]\(\.\.\/security\/MULTI_TENANT_RLS\.md\)/gi,
      `- ${TRUST_CENTER_SECURITY_DOC_REQUEST_DISCLOSURE} See [Data handling and tenant isolation](/help/data-handling#isolation) for buyer-facing isolation summary.`,
    )
    .replace(
      /- \[RLS risk acceptance\]\(\.\.\/security\/RLS_RISK_ACCEPTANCE\.md\)/gi,
      `- [RLS risk acceptance](/help/data-handling)`,
    )
    .replace(
      /- \[System threat model \(STRIDE\)\]\(\.\.\/security\/SYSTEM_THREAT_MODEL\.md\)/gi,
      `- [Security and trust](/help/security-trust)`,
    )
    .replace(
      /- \[Ask \/ RAG pipeline threat notes\]\(\.\.\/security\/ASK_RAG_THREAT_MODEL\.md\)/gi,
      `- [Security and trust](/help/security-trust)`,
    )
    .replace(
      /- \[OWASP ZAP baseline rules \(CI\)\]\(\.\.\/security\/ZAP_BASELINE_RULES\.md\)/gi,
      `- Automated security testing in CI (details on request during diligence).`,
    )
    .replace(
      /- \[Compliance matrix\]\(\.\.\/security\/COMPLIANCE_MATRIX\.md\)/gi,
      `- [Audit trail](/help/audit-trail)`,
    )
    .replace(
      /- \[Evidence pack overview\]\(\.\.\/security\/EVIDENCE_PACK\.md\)/gi,
      `- [Download the evidence pack](/v1/marketing/trust-center/evidence-pack.zip) or open [Trust Center](/trust).`,
    )
    .replace(
      /- \[Managed identity and SQL \/ Blob boundaries\]\(\.\.\/security\/MANAGED_IDENTITY_SQL_BLOB\.md\)/gi,
      `- [Security and trust](/help/security-trust)`,
    )
    .replace(
      /- \[Gitleaks pre-receive guidance\]\(\.\.\/security\/GITLEAKS_PRE_RECEIVE\.md\)/gi,
      `- ${TRUST_CENTER_SECURITY_DOC_REQUEST_DISCLOSURE}`,
    )
    .replace(
      /- \[Deferred assurance and packaging \(V1_DEFERRED\)\]\(\.\.\/library\/V1_DEFERRED\.md\)/gi,
      `- Deferred assurance programs are tracked internally — contact **security@archlucid.net** during procurement for the current deferral register.`,
    )
    .replace(/`Get-ArchLucidAzurePackage\.ps1`/gi, "Azure collector script")
    .replace(/`Get-ArchLucidAwsPackage\.ps1`/gi, "AWS collector script")
    .replace(/`Get-ArchLucidGcpPackage\.ps1`/gi, "GCP collector script")
    .replace(/`SystemWithPerTenantCatalogs`/gi, "database-per-tenant catalogs")
    .replace(/`docs\/runbooks\/TRUST_CENTER_FRESHNESS\.md`/gi, "trust center freshness runbook")
    .replace(/docs\/runbooks\/TRUST_CENTER_FRESHNESS\.md/gi, "trust center freshness runbook")
    .replace(/`docs\/go-to-market\/PROCUREMENT_PACK_INDEX\.md`/gi, "[Procurement FAQ](/help/procurement)")
    .replace(/docs\/go-to-market\/PROCUREMENT_PACK_INDEX\.md/gi, "/help/procurement")
    .replace(/`ASSURANCE_STATUS_CANONICAL\.md`/gi, "[SOC 2 self-assessment](/help/soc2-self-assessment)")
    .replace(/ASSURANCE_STATUS_CANONICAL\.md/gi, "/help/soc2-self-assessment")
    .replace(/`PEN_TEST_SUMMARY_PROCUREMENT_INTERIM\.md`/gi, "[Procurement FAQ](/help/procurement)")
    .replace(/PEN_TEST_SUMMARY_PROCUREMENT_INTERIM\.md/gi, "/help/procurement")
    .replace(/`V1_DEFERRED\.md`/gi, "deferred assurance register")
    .replace(/V1_DEFERRED\.md/gi, "deferred assurance register")
    .replace(/`REMEDIATION_TRACKER\.md`/gi, "pen-test remediation tracker")
    .replace(/REMEDIATION_TRACKER\.md/gi, "pen-test remediation tracker")
    .replace(/`BUYER_SECURITY_PROCUREMENT_PACKET\.md`/gi, "[Procurement FAQ](/help/procurement)")
    .replace(/BUYER_SECURITY_PROCUREMENT_PACKET\.md/gi, "/help/procurement")
    .replace(/`SOC2_STATUS_PROCUREMENT\.md`/gi, "[SOC 2 self-assessment](/help/soc2-self-assessment)")
    .replace(/SOC2_STATUS_PROCUREMENT\.md/gi, "/help/soc2-self-assessment")
    .replace(/`LOAD_TEST_BASELINE\.md`/gi, "load-test baseline documentation")
    .replace(/LOAD_TEST_BASELINE\.md/gi, "load-test baseline documentation")
    .replace(/`CAPACITY_AND_COST_PLAYBOOK\.md`/gi, "capacity and cost playbook")
    .replace(/CAPACITY_AND_COST_PLAYBOOK\.md/gi, "capacity and cost playbook")
    .replace(/`RTO_RPO_TARGETS\.md`/gi, "RTO/RPO planning targets")
    .replace(/RTO_RPO_TARGETS\.md/gi, "RTO/RPO planning targets")
    .replace(/`REDIS_AND_MULTI_REGION\.md`/gi, "Redis and multi-region documentation")
    .replace(/REDIS_AND_MULTI_REGION\.md/gi, "Redis and multi-region documentation")
    .replace(/`PER_TENANT_COST_MODEL\.md`/gi, "[Pilot ROI measurement](/help/sponsor-report#pilot-roi-measurement)")
    .replace(/PER_TENANT_COST_MODEL\.md/gi, "/help/sponsor-report#pilot-roi-measurement")
    .replace(/`SUPPORT_POLICY\.md`/gi, "[Procurement FAQ](/help/procurement)")
    .replace(/SUPPORT_POLICY\.md/gi, "/help/procurement")
    .replace(/`tests\/load\/[^`]+`/gi, "automated load tests")
    .replace(/tests\/load\/[^\s)`]+/gi, "automated load tests")
    .replace(/`\.github\/workflows\/[^`]+`/gi, "CI workflows")
    .replace(/\.github\/workflows\/[^\s)`]+/gi, "CI workflows")
    .replace(/`scripts\/load\/[^`]+`/gi, "load-test scripts")
    .replace(/scripts\/load\/[^\s)`]+/gi, "load-test scripts")
    .replace(/`scripts\/ci\/[^`]+`/gi, "automated assurance checks")
    .replace(/scripts\/ci\/[^\s)`]+/gi, "automated assurance checks")
    .replace(/`BenchmarkDotNet`/gi, "performance benchmarks")
    .replace(/ADR 0037/gi, "tenant isolation architecture decision")
    .replace(/`docs\/architecture\/adrs\/0037[^`]+`/gi, "tenant isolation architecture decision")
    .replace(/`docs\/runbooks\/DATABASE_FAILOVER\.md`/gi, "database failover runbook")
    .replace(/docs\/runbooks\/DATABASE_FAILOVER\.md/gi, "database failover runbook");

  result = result.replace(
    /## Third-party engagements[\s\S]*?(?=\n## |\n---\n|$)/i,
    [
      "## Third-party engagements",
      "",
      "**Current product posture:** There is **no** awarded third-party penetration-test vendor.",
      "",
      "**Current** assurance includes **owner-conducted** testing ([Owner-conducted pen-test summary](/help/procurement)) plus CI and self-assessment evidence linked above.",
      "",
      "**Planned, not yet scheduled:** When a third-party program is funded, publish the engagement here. Redacted findings remain **NDA-gated** until explicitly approved for wider distribution — contact **security@archlucid.net**.",
    ].join("\n"),
  );

  result = result.replace(
    /## Automated freshness posture[\s\S]*?(?=\n## |\n---\n|$)/i,
    "",
  );

  result = result.replace(
    /## Healthcare and PHI[\s\S]*?(?=\n## |\n---\n|$)/i,
    [
      "## Healthcare and PHI",
      "",
      "ArchLucid is for **architecture and approval evidence** — not a regulated record system for clinical care.",
      "",
      "- **Do not upload PHI** into briefs, uploads, or free-text architecture fields.",
      "- For **BAA**, **MSA/DPA** wording, or contractual posture beyond in-repo templates, contact **sales@archlucid.net**.",
      "- For **tenant isolation** and residency messaging, see [Data handling and tenant isolation](/help/data-handling#isolation).",
      "- Deeper healthcare vertical positioning lives in the healthcare policy review guide — product fit only; no new certification claims.",
    ].join("\n"),
  );

  return result.replace(/\n{3,}/g, "\n\n").trimEnd();
}
