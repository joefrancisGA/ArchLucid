> **Reviewed:** 2026-07-25

> **Scope:** Data Processing Agreement (DPA) — Template (ArchLucid), including operational controls for optional cross-tenant patterns (formerly the cross-tenant processing addendum). Full detail, tables, and links in the sections below.


# Data Processing Agreement (DPA) — Template (ArchLucid)

**Important — not legal advice:** This document is a **working template** for negotiation. It is **not** your countersigned Data Processing Agreement and **does not** constitute legal advice. **Qualified legal counsel** must review and adapt it before execution.

**Last reviewed:** 2026-07-25

**Parties:** Complete legal names and registered addresses before execution (see §10A).

| Role | Party |
|------|--------|
| **Controller** | `<<Controller legal name and address>>` |
| **Processor** | `<<Processor legal name and address>>` |

**Effective date:** `<<YYYY-MM-DD>>`

**Reference:** `<<Subscription or order form ID>>`

---

## 1. Definitions

- **“Personal Data”** means any information relating to an identified or identifiable natural person processed by Processor on behalf of Controller under this DPA.
- **“Processing”** has the meaning given in applicable data protection law (including the GDPR where applicable).
- **“Sub-processor”** means a third party engaged by Processor to process Personal Data.
- **“Services”** means the ArchLucid cloud service subscribed to by Controller.

Capitalized terms not defined here follow the `<<Subscription Agreement or Terms of Service title>>` unless otherwise stated.

---

## 2. Scope and roles

2.1 **Processor** processes Personal Data **only** on documented instructions from **Controller** (including this DPA, the agreement, and documented configuration), unless applicable law requires otherwise (in which case Processor informs Controller unless prohibited).

2.2 **Controller** determines the purposes and means of Processing outside Processor’s documented product features (e.g., which users are invited, what content is submitted to architecture reviews).

---

## 3. Categories of data subjects

Employees and contractors of Controller who use the Services; other individuals whose data appears in **free-text** architecture inputs, logs, or exports (e.g., names or identifiers pasted into runs).

---

## 4. Categories of Personal Data

Including where such data appears in user-provided architecture descriptions, Ask threads, audit trails, or exports:

- **Identity and access:** names, email addresses, Entra / OIDC subject identifiers, role assignments.
- **Professional content:** technical descriptions, system names, URLs, pasted logs or documents that may identify individuals or systems.
- **Usage and audit:** operational events recorded in the durable audit log (see product documentation), correlation identifiers, timestamps.

See also conversation retention and security documentation in [Security and trust](/help/security-trust) and [Data handling and tenant isolation](/help/data-handling#isolation).

---

## 5. Duration

Processing continues for the **subscription term** and until deletion or return in accordance with §12, subject to backup retention and legal hold limitations disclosed in the Security & Trust documentation.

---

## 6. Processor obligations

6.1 **Confidentiality:** Personnel authorized to process Personal Data are bound by confidentiality obligations.

6.2 **Security:** Processor implements appropriate technical and organizational measures, including those described in [Security and trust](/help/security-trust), [Procurement FAQ](/help/procurement), and the security documentation linked from the Trust Center.

6.3 **Sub-processors:** Processor may engage Sub-processors listed in [Subprocessors](/help/subprocessors). Processor will impose data protection terms on Sub-processors. Controller may object to a **new** Sub-processor in accordance with the notification commitment in [Subprocessors](/help/subprocessors).

6.4 **Assistance:** Processor assists Controller with **data subject requests** and **DPIAs** as described in the agreement and applicable law, within reasonable scope.

6.5 **Breach notification:** Processor notifies Controller **without undue delay** after becoming aware of a **personal data breach**, in line with the incident communications policy described in [Security and trust](/help/security-trust) and applicable law (including **72 hours** where GDPR Article 33 applies and Processor is responsible).

6.6 **Deletion / return:** At end of contract, Processor deletes or returns Personal Data per §9.

6.7 **Audit:** Processor makes available **SOC 2** reports when available (see assurance status in [Security and trust](/help/security-trust)) and reasonable information necessary to demonstrate compliance.

---

## 7. International transfers

Where Personal Data is processed in jurisdictions requiring safeguards, Processor uses mechanisms appropriate to the transfer (e.g., **Standard Contractual Clauses** or equivalent), aligned with Microsoft’s offerings and Controller’s Azure / Entra configuration. Document the **primary Azure region(s)** in the order form or security pack.

---

## 8. Security incidents

See the incident communications policy described in [Security and trust](/help/security-trust) for severity classification and customer communication expectations.

---

## 9. Termination and data return

9.1 **Export:** Controller may export data using product features (e.g., DOCX/ZIP exports, audit CSV) subject to RBAC; see [Security and trust](/help/security-trust) (exports may contain sensitive content).

9.2 **Deletion:** After termination, Processor deletes Customer Data within **90 days** except where retention is required by law or documented backup cycles; backups roll off per Processor’s retention schedule.

---

## 10. Cross-tenant patterns opt-in {#10-cross-tenant-patterns-opt-in}

**Purpose (product):** Where the Services offer **anonymised industry guidance** (patterns derived from multiple customers’ committed architecture manifests, surfaced only when a statistical privacy floor is met), that processing is **optional** and **separate** from core tenant-private processing.

Former standalone operational addendum: cross-tenant processing addendum → this section.

10.1 **Default:** Cross-tenant pattern participation is **OFF** unless Controller **explicitly** enables it in the product controls and, where required, documents that choice in the subscription or order form.

10.2 **What is processed:** only non-identifying structural fingerprints and coarse aggregates, as documented below and in the cross-tenant pattern library architecture decision; **not** free-text titles, URLs, user names, or customer-identifying labels in the operator-facing guidance surface.

10.3 **Privacy mechanism:** Processor applies a minimum cohort size (**k >= 5** distinct contributing tenants per published bucket, unless a stricter value is agreed in writing) before showing any pattern to other tenants.

10.4 **Withdrawal:** When Controller disables the feature, Processor removes Controller’s contributions from publishable aggregates within **24** hours, subject to documented backup and rebuild windows.

10.5 **Processor role:** For this optional feature, Processor processes only the data classes listed in this section solely to compute aggregate patterns. Controller warrants it has lawful basis and authority for any Personal Data included in opted-in processing.

**Important:** Qualified legal counsel must review this section for jurisdiction-specific language and reconcile it with Controller’s DPIA, industry rules, and the main agreement. This section is operational guidance for negotiation and does not replace legal review.

### Operational controls (data classes, privacy floor, audit)

**Included (when opt-in is enabled)**

- Non-identifying structural architecture fingerprints.
- Coarse-grained aggregate counters used to generate generalized guidance.
- Event metadata required to enforce minimum cohort thresholds and audit setting changes.

**Explicitly excluded**

- Free-text architecture descriptions.
- URLs, hostnames, and endpoint strings.
- User names, email addresses, and identity claims.
- Tenant names, workspace names, project names, and customer labels.
- Raw run artifacts and export document content.

**Privacy floor and publication**

- Cross-tenant outputs are only published when at least **k >= 5** distinct contributing tenants are present in a bucket (unless a stricter value is agreed in writing — see 10.3).
- If a bucket drops below threshold after withdrawal or data hygiene events, that bucket is removed from publishable output.
- Threshold is enforced before output rendering, not after rendering.

**Opt-in and withdrawal (product)**

- **Enablement:** Explicit tenant admin action in product controls plus contractual acknowledgment where required (see 10.1).
- **Withdrawal:** Tenant admin can disable at any time; publishable-aggregate removal target is **24 hours** (see 10.4).

**Audit evidence**

The system should emit auditable records for:

- Feature opt-in enabled.
- Feature opt-in disabled.
- Privacy-floor enforcement decision for each publishable bucket class.

These records support procurement and compliance evidence requests and should map to typed audit events in the standard audit pipeline.

---

## 10A. Unresolved negotiation variables

- `<<Controller legal name and address>>` / `<<Processor legal name and address>>` in the parties table.
- `<<YYYY-MM-DD>>` (effective date) and `<<Subscription or order form ID>>` (reference).
- Transfer-mechanism specifics where regional law requires additional annex language.
- Any stricter customer-requested cohort threshold above `k >= 5`.

---

## 11. Signature

| Controller | Processor |
|------------|-----------|
| Name: `<<Controller signatory>>` | Name: `<<Processor signatory>>` |
| Title: `<<Controller signatory title>>` | Title: `<<Processor signatory title>>` |
| Date: `<<YYYY-MM-DD>>` | Date: `<<YYYY-MM-DD>>` |

---

## Related documents

| Doc | Use |
|-----|-----|
| [Subprocessors](/help/subprocessors) | Current subprocessor list |
| [Security and trust](/help/security-trust) | Trust index |
