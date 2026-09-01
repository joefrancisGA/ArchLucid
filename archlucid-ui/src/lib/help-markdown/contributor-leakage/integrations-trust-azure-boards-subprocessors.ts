import { stripMarkdownSectionsByTitlePrefix } from "@/lib/help-markdown/section-strips";
import { AZURE_BOARDS_HELP_LIMITATIONS_HEADING } from "@/lib/azure-boards-help-limitations-honesty";

import {
  SUBPROCESSORS_OMITTED_SECTION_PREFIXES,
  isSubprocessorsContributorLeakageLine,
  TENANT_ISOLATION_THREE_LAYERS_BUYER_BODY,
} from "./internal";

/** TB-1622 — buyer-safe limitations heading instead of eng release-phase jargon. */
export function rewriteAzureBoardsLimitationsHeadingHonesty(markdown: string): string {
  return markdown
    .replace(
      /^## Known limitations \(Phase 1\)\s*$/gim,
      `## ${AZURE_BOARDS_HELP_LIMITATIONS_HEADING}`,
    )
    .replace(/^## Known limitations\s*$/gim, `## ${AZURE_BOARDS_HELP_LIMITATIONS_HEADING}`);
}

export function stripAzureBoardsContributorLeakage(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let inFence = false;
  let detailsBuffer: string[] | null = null;

  const flushDetailsBuffer = (): void => {
    if (detailsBuffer === null) {
      return;
    }

    const block = detailsBuffer.join("\n");
    detailsBuffer = null;

    if (
      /CONNECTOR_SMOKE_/i.test(block) ||
      /docs\/integrations\/smoke/i.test(block) ||
      /smoke validation/i.test(block)
    ) {
      return;
    }

    for (const bufferedLine of block.split("\n")) {
      result.push(bufferedLine);
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const trimmedStart = line.trimStart();

    if (trimmedStart.startsWith("```")) {
      inFence = !inFence;
      result.push(line);
      continue;
    }

    if (inFence) {
      result.push(line);
      continue;
    }

    if (/^<details\b/i.test(trimmed)) {
      detailsBuffer = [line];
      continue;
    }

    if (detailsBuffer !== null) {
      detailsBuffer.push(line);

      if (/^<\/details>/i.test(trimmed)) {
        flushDetailsBuffer();
      }

      continue;
    }

    if (/docs\/integrations\/smoke/i.test(line)) {
      continue;
    }

    if (/CONNECTOR_SMOKE_/i.test(line)) {
      continue;
    }

    result.push(line);
  }

  flushDetailsBuffer();

  return result
    .join("\n")
    .replace(/`?docs\/integrations\/smoke\/[^`\s)]+`?/gi, "connector validation runbook")
    .replace(/docs\/integrations\/smoke\/[^\s)]+/gi, "connector validation runbook")
    .replace(/\n{3,}/g, "\n\n");
}

export function stripSubprocessorsContributorSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, SUBPROCESSORS_OMITTED_SECTION_PREFIXES);
}

export function stripSubprocessorsContributorLeakage(markdown: string): string {
  const sectionStripped = stripSubprocessorsContributorSections(markdown);
  const lines = sectionStripped.split("\n");
  const result: string[] = [];

  for (const line of lines) {
    if (
      /^ArchLucid uses the following \*\*subprocessors\*\* to deliver the hosted service\./i.test(line.trim())
    ) {
      result.push(
        "ArchLucid uses the following **subprocessors** to deliver the hosted service. The list reflects the **Azure-first** hosted service architecture. For trust posture and data handling, see [Security and trust](/help/security-trust).",
      );
      continue;
    }

    if (/^Production deployments are \*\*Azure-region scoped\*\*/i.test(line.trim())) {
      result.push(
        "Production deployments are **Azure-region scoped**; the **primary region** is selected when the hosted service is provisioned for your subscription or order.",
      );
      continue;
    }

    if (/^\*\*Roadmap:\*\* Document \*\*multi-region\*\*/i.test(line.trim())) {
      result.push(
        "**Roadmap:** Document **multi-region** active/active or failover when offered (not yet published as a standard hosted offering).",
      );
      continue;
    }

    if (/^\*\*Non-Microsoft:\*\*/i.test(line.trim())) {
      result.push(
        "**Non-Microsoft:** Core hosted ArchLucid API functionality runs on Microsoft Azure services listed above. Additional third-party subprocessors (for example observability, CRM, or support tools) are listed here when they process customer content.",
      );
      continue;
    }

    if (/^Until a single public \*\*primary production region\*\*/i.test(line.trim())) {
      result.push(
        "For **hosted ArchLucid SaaS**, primary data-processing regions are **confirmed in your order or security diligence pack** unless a single public primary region is published on [Security and trust](/help/security-trust). Customer-managed deployments follow the Azure region selected at provisioning.",
      );
      continue;
    }

    if (isSubprocessorsContributorLeakageLine(line)) {
      continue;
    }

    if (/^\| \*\*Azure Container Apps\*\*/i.test(line.trim())) {
      result.push(
        "| **Azure Container Apps** (or equivalent compute), **Azure SQL**, **Azure Blob Storage**, **Azure Key Vault**, optional **Azure Service Bus**, **Azure Cache for Redis** (or compatible), **Azure Front Door**, optional **Azure API Management**, monitoring integrations | Host application; store and encrypt data at rest; edge routing; optional queue/cache | Customer architecture content, architecture package data, findings, audit events, stored evidence artifacts (including optional agent trace artifacts), encrypted configuration references via Key Vault | Primary Azure region selected at deployment for your subscription or order (see **Data residency** below) | Microsoft Product Terms and DPA; EU Standard Contractual Clauses where applicable | 2026-07-25 |",
      );
      continue;
    }

    if (/^\| \*\*Microsoft Entra ID\*\*/i.test(line.trim())) {
      result.push(
        "| **Microsoft Entra ID** | Authentication and app roles | User and service principal identifiers; sign-in telemetry per Entra policy | Customer Entra tenant and Microsoft identity infrastructure | Microsoft Product Terms and DPA; EU Standard Contractual Clauses where applicable | 2026-07-25 |",
      );
      continue;
    }

    if (/^\| \*\*Azure OpenAI Service\*\*/i.test(line.trim())) {
      result.push(
        "| **Azure OpenAI Service** | LLM inference for agent workflows | Prompts and completions that may include customer architecture text when submitted by users | Azure OpenAI deployment region (per subscription configuration) | Microsoft Product Terms and DPA; EU Standard Contractual Clauses where applicable | 2026-07-25 |",
      );
      continue;
    }

    if (/^\| \*\*Microsoft Corporation\*\* \| \*\*Azure Container Apps\*\*/i.test(line.trim())) {
      continue;
    }

    if (/^\| \*\*Microsoft Corporation\*\* \| \*\*Microsoft Entra ID\*\*/i.test(line.trim())) {
      continue;
    }

    if (/^\| \*\*Microsoft Corporation\*\* \| \*\*Azure OpenAI Service\*\*/i.test(line.trim())) {
      continue;
    }

    if (/see \[DPA_TEMPLATE\.md\]/i.test(line)) {
      result.push(
        "- **Material change:** Updated DPA schedule or subprocessors exhibit available on request; see [DPA template](/help/dpa-template).",
      );
      continue;
    }

    result.push(line);
  }

  return alignSubprocessorsResidencyHonesty(
    result
      .join("\n")
      .replace(/`?DPA_TEMPLATE\.md`?/gi, "[DPA template](/help/dpa-template)")
      .replace(/DPA_TEMPLATE\.md/gi, "/help/dpa-template")
      .replace(/`?START_HERE\.md`?/gi, "product documentation hub")
      .replace(/START_HERE\.md/gi, "product documentation hub")
      .replace(/`?infra\/[^`\s)]*`?/gi, "hosted infrastructure")
      .replace(/\binfra\//gi, "hosted infrastructure ")
      .replace(/`?terraform-azure-variables\.md`?/gi, "infrastructure configuration documentation")
      .replace(/terraform-azure-variables\.md/gi, "infrastructure configuration documentation")
      .replace(/`?GEO_FAILOVER_DRILL\.md`?/gi, "operational drill documentation")
      .replace(/GEO_FAILOVER_DRILL\.md/gi, "operational drill documentation")
      .replace(/`?CUSTOMER_TRUST_AND_ACCESS\.md`?/gi, "[Security and trust](/help/security-trust)")
      .replace(/CUSTOMER_TRUST_AND_ACCESS\.md/gi, "/help/security-trust")
      .replace(/`?SYSTEM_THREAT_MODEL\.md`?/gi, "security documentation")
      .replace(/SYSTEM_THREAT_MODEL\.md/gi, "security documentation")
      .replace(/`?trust-center\.md`?/gi, "[Security and trust](/help/security-trust)")
      .replace(/trust-center\.md/gi, "/help/security-trust")
      .replace(/\n{3,}/g, "\n\n")
      .trimEnd(),
  );
}

export function alignSubprocessorsResidencyHonesty(markdown: string): string {
  return markdown
    .replace(
      /\*\*Non-Microsoft:\*\* The product codebase does not require[^\n]+/gi,
      "**Non-Microsoft:** Core hosted ArchLucid API functionality runs on Microsoft Azure services listed above. Additional third-party subprocessors (for example observability, CRM, or support tools) are listed here when they process customer content.",
    )
    .replace(
      /Contact your account team during procurement if you need confirmation of the current register\./gi,
      "This register is **current as of 2026-07-25**; material changes are notified per the **Change notification** section below.",
    )
    .replace(
      /Until a single public \*\*primary production region\*\* is published for the ArchLucid SaaS offering, treat the region as \*\*["“]per deployment \/ subscription — confirm in order form or security pack\.["”]\*\*/gi,
      "For **hosted ArchLucid SaaS**, primary data-processing regions are **confirmed in your order or security diligence pack** unless a single public primary region is published on [Security and trust](/help/security-trust). Customer-managed deployments follow the Azure region selected at provisioning.",
    )
    .replace(/update this table before production use/gi, "confirm the current subprocessor register during procurement")
    .replace(/product codebase/gi, "core hosted service")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

export function alignSubprocessorsRegisterProductLanguage(markdown: string): string {
  return markdown
    .replace(/\brun metadata\b/gi, "architecture review records")
    .replace(/\bmanifests\b/gi, "architecture package data")
    .replace(/\bblobs\b/gi, "stored evidence artifacts")
    .replace(/\bsecrets by reference\b/gi, "encrypted configuration references via Key Vault")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

export function stripTenantIsolationContributorLeakage(markdown: string): string {
  const hasTenantIsolationStub =
    /BUYER_SECURITY_PROCUREMENT_PACKET|generate_tenant_isolation_verification_pack|MULTI_TENANT_RLS\.md|0037-tenant-isolation/i.test(
      markdown,
    );

  if (!hasTenantIsolationStub) {
    return markdown;
  }

  let result = markdown
    .replace(/\*\*Canonical buyer overview:\*\*[^\n]*\n?/gi, "")
    .replace(/\*\*Related short handout:\*\*[^\n]*\n?/gi, "")
    .replace(/# ArchLucid — Tenant isolation \(buyer overview\)\s*\n+/gi, "")
    .replace(/\*\*Last reviewed:\*\*[^\n]*\n?/gi, "")
    .replace(/`?BUYER_SECURITY_PROCUREMENT_PACKET\.md[^`\s)]*`?/gi, "[Procurement FAQ](/help/procurement)")
    .replace(/BUYER_SECURITY_PROCUREMENT_PACKET\.md[^\s)`]*/gi, "/help/procurement")
    .replace(/`?SECURITY\.md`?/gi, "security documentation")
    .replace(/contributor-reference\/SECURITY\.md/gi, "security documentation")
    .replace(/`?MULTI_TENANT_RLS\.md`?/gi, "tenant scope enforcement documentation")
    .replace(/MULTI_TENANT_RLS\.md/gi, "tenant scope enforcement documentation")
    .replace(/`?TENANT_ISOLATION_DEFENSE_IN_DEPTH\.md`?/gi, "tenant isolation architecture documentation")
    .replace(/`?\.\.\/architecture\/adrs\/0037[^`\s)]*`?/gi, "tenant isolation architecture decision")
    .replace(/ADR 0037/gi, "tenant isolation architecture decision")
    .replace(/`?scripts\/generate_tenant_isolation_verification_pack\.py`?/gi, "tenant isolation verification materials")
    .replace(/generate_tenant_isolation_verification_pack\.py/gi, "tenant isolation verification materials")
    .replace(/`?scripts\/`/gi, "internal tooling ")
    .replace(/historical procurement-pack path stable[^\n]*/gi, "")
    .replace(/buyer ZIP checklists and CI allowlists[^\n]*/gi, "");

  result = result.replace(
    /## Three layers \{#three-layers\}[\s\S]*?(?=\n## |\n---\n|$)/i,
    `## Three layers {#three-layers}\n\n${TENANT_ISOLATION_THREE_LAYERS_BUYER_BODY}`,
  );

  result = result.replace(
    /Three-layer isolation \(identity, application, database-per-tenant catalogs\)[^\n]*/gi,
    TENANT_ISOLATION_THREE_LAYERS_BUYER_BODY,
  );

  return result.replace(/\n{3,}/g, "\n\n").trimEnd();
}

export function alignDataHandlingIsolationHonesty(markdown: string): string {
  if (!/cross-tenant data access is not part of the product design/i.test(markdown)) {
    return markdown;
  }

  return markdown
    .replace(
      /Each customer tenant uses a dedicated database\.\s*Cross-tenant data access is not part of the product design\./gi,
      "Each customer tenant uses a dedicated database catalog. Tenant identity is decided at the host boundary, and API requests carry a tenant scope that the data layer enforces on tenant-facing queries — that is the standard customer path, not a claim that every staff or platform surface is free of cross-tenant aggregation. For isolation and assurance detail, see [Security and trust](/help/security-trust). For the three-layer isolation deep-dive, see [Data handling and tenant isolation](/help/data-handling).",
    )
    .replace(/\n{3,}/g, "\n\n");
}
