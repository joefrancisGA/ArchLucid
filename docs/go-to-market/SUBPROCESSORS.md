> **Reviewed:** 2026-07-25

> **Scope:** ArchLucid — Subprocessors - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid — Subprocessors

**Audience:** Customers and prospects who need a **subprocessor list** for security questionnaires and DPAs.

**Last reviewed:** 2026-07-25

This register is **current as of 2026-07-25**. Material changes are notified per the **Change notification** section below.

ArchLucid uses the following **subprocessors** to deliver the hosted service. The list is derived from the **Azure-first** architecture described in [../CUSTOMER_TRUST_AND_ACCESS.md](../library/CUSTOMER_TRUST_AND_ACCESS.md), [../security/SYSTEM_THREAT_MODEL.md](../security/SYSTEM_THREAT_MODEL.md), and repository `infra/` modules.

We will notify customers **at least 30 days** before engaging a **new** subprocessor that processes customer content or personal data, unless a shorter period is required by law or the change is immaterial (e.g., rename of an existing Microsoft service).

---

## Subprocessor register

**Entity:** All subprocessors listed below are **Microsoft Corporation**.

| Service | Processing role | Data categories | Processing location | Transfer safeguards | Added |
|---------|-----------------|-----------------|---------------------|---------------------|-------|
| **Azure Container Apps** (or equivalent compute), **Azure SQL**, **Azure Blob Storage**, **Azure Key Vault**, optional **Azure Service Bus**, **Azure Cache for Redis** (or compatible), **Azure Front Door**, optional **Azure API Management**, monitoring integrations | Host application; store and encrypt data at rest; edge routing; optional queue/cache | Customer architecture content, architecture package data, findings, audit events, stored evidence artifacts (including optional agent trace artifacts), encrypted configuration references via Key Vault | Primary Azure region selected at deployment for your subscription or order (see **Data residency** below) | Microsoft Product Terms and DPA; EU Standard Contractual Clauses where applicable | 2026-07-25 |
| **Microsoft Entra ID** | Authentication and app roles | User and service principal identifiers; sign-in telemetry per Entra policy | Customer Entra tenant and Microsoft identity infrastructure | Microsoft Product Terms and DPA; EU Standard Contractual Clauses where applicable | 2026-07-25 |
| **Azure OpenAI Service** | LLM inference for agent workflows | Prompts and completions that may include customer architecture text when submitted by users | Azure OpenAI deployment region (per subscription configuration) | Microsoft Product Terms and DPA; EU Standard Contractual Clauses where applicable | 2026-07-25 |

**Non-Microsoft:** Core hosted ArchLucid API functionality runs on Microsoft Azure services listed above. Additional third-party subprocessors (for example observability, CRM, or support tools) are listed here when they process customer content.

---

## Data residency

Production deployments are **Azure-region scoped**; the **primary region** is selected when infrastructure is provisioned (see `infra/` Terraform variables and [../terraform-azure-variables.md](../library/terraform-azure-variables.md)).

Until a single public **primary production region** is published for the ArchLucid SaaS offering, treat the region as **“per deployment / subscription — confirm in order form or security pack.”**

**Roadmap:** Document **multi-region** active/active or failover when offered; see [../runbooks/GEO_FAILOVER_DRILL.md](../runbooks/GEO_FAILOVER_DRILL.md) for operational drill context (internal).

---

## Change notification

- **New subprocessor:** **30 days’** advance notice to customer security contacts (email), except where a shorter period is required by law or the change is a **non-material** update (e.g., Microsoft service rename).
- **Material change:** Updated DPA schedule or subprocessors exhibit available on request; see [DPA_TEMPLATE.md](DPA_TEMPLATE.md).

---

## Related documents

| Doc | Use |
|-----|-----|
| [trust-center.md](trust-center.md) | Trust index |
| [DPA_TEMPLATE.md](DPA_TEMPLATE.md) | DPA template (subprocessors schedule) |
| [../security/SYSTEM_THREAT_MODEL.md](../security/SYSTEM_THREAT_MODEL.md) | Product boundary and data flows |
