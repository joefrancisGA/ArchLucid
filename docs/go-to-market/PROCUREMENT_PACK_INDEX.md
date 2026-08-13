> **Reviewed:** 2026-07-31

> **Scope:** Single canonical procurement evidence index — file paths are source of truth for CI; statuses are buyer-safe labels aligned with **[`BUYER_SECURITY_PROCUREMENT_PACKET.md#procurement-response-accelerator`](BUYER_SECURITY_PROCUREMENT_PACKET.md#procurement-response-accelerator)** (`PROCUREMENT_RESPONSE_ACCELERATOR.md` path-stable alias), not attestations — plus the deal-ready one-pager (formerly `PROCUREMENT_DEAL_READY_ONE_PAGER.md`) and how to request/build the ZIP (formerly `HOW_TO_REQUEST_PROCUREMENT_PACK.md`). The **Procurement artifact status map** below uses a fixed vocabulary (`Implemented`, `Self-attested`, `Template`, `Deferred`, `Not applicable`, `External/NDA-gated`) enforced by **`scripts/ci/check_procurement_pack_index.py`** (links, **90-day** freshness on **Implemented** / **Self-asserted** canonical rows, buyer-placeholder strictness, and forbidden assurance wording). Release operators: **`docs/library/RELEASE_EVIDENCE_SUMMARY.md`** §8.

# Procurement evidence pack — buyer index (canonical)

**Audience:** Security, procurement, and GRC reviewers.
**Last reviewed:** 2026-07-31

**How to cite:** Prefer **Evidence Artifact** titles and **`Source File`** links below rather than improvising statuses in questionnaires. Use **`trust-center.md`** for high-level posture; use this file for granular artifact inventory.

## Procurement artifact status map (buyer-safe classification)

Use this table for RFP spreadsheets and security portals that need a **single status column**. Labels are **not** attestations: **Deferred** items follow **[`V1_DEFERRED.md`](../library/V1_DEFERRED.md)** (especially **section 6c** for assurance). **Template** means legal or vendor execution is still required. **External/NDA-gated** means distribution depends on contract or assessor agreements, not public download.

| Procurement Artifact | Status | Source File | Notes |
|---|---|---|---|
| Data Processing Agreement (DPA) | Template | [DPA_TEMPLATE.md](DPA_TEMPLATE.md) | Template until executed; not legal advice. |
| Subprocessors register | Self-attested | [SUBPROCESSORS.md](SUBPROCESSORS.md) | In-repo list; buyer policy applies. |
| CAIQ Lite pre-fill | Self-attested | [../security/CAIQ_LITE_2026.md](../security/CAIQ_LITE_2026.md) | Questionnaire-aligned draft; map to CSA CAIQ. |
| SIG Core pre-fill | Self-attested | [../security/SIG_CORE_2026.md](../security/SIG_CORE_2026.md) | Questionnaire-aligned draft. |
| SOC 2 self-assessment (CC mapping) | Self-attested | [../security/SOC2_SELF_ASSESSMENT_2026.md](../security/SOC2_SELF_ASSESSMENT_2026.md) | Internal narrative — **not** a CPA opinion. |
| SOC 2 procurement status statement | Self-attested | [SOC2_STATUS_PROCUREMENT.md](SOC2_STATUS_PROCUREMENT.md) | Honest posture; confirms **no** CPA Type II issued today. |
| SOC 2 program roadmap | Deferred | [ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap](ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap) | Planning only; CPA examination **not** V1/V1.1 headline gate — see [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) section 6c. |
| SOC 2 Type I / II examination report (CPA-issued) | Deferred | [ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap](ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap) | **No issued report** in-repo; timing owner-driven — [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) section 6c. |
| Owner-conducted penetration-style assessment | Self-attested | [../security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md](../security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md) | Not third-party attestation; V1-appropriate. |
| Third-party penetration test (vendor-led program) | Deferred | [../library/V1_DEFERRED.md](../library/V1_DEFERRED.md) | **V2** per [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) section 6c; no V1 vendor commitment. |
| Third-party pen-test SoW (planning template) | Template | [../security/pen-test-summaries/2026-Q2-SOW.md](../security/pen-test-summaries/2026-Q2-SOW.md) | For use when a vendor is selected. |
| Third-party pen-test redacted summary (when executed) | External/NDA-gated | [../security/pen-test-summaries/2026-Q2-REDACTED-SUMMARY.md](../security/pen-test-summaries/2026-Q2-REDACTED-SUMMARY.md) | Working surface; not a public assurance claim. |
| Audit coverage matrix | Self-attested | [../library/AUDIT_COVERAGE_MATRIX.md](../library/AUDIT_COVERAGE_MATRIX.md) | Typed audit event surface mapping. |
| Tenant isolation (database-per-tenant) | Implemented | [../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md) | ADR 0037 adopted; SQL RLS not used in production. |
| security.txt | Self-attested | [../../archlucid-ui/public/.well-known/security.txt](../../archlucid-ui/public/.well-known/security.txt) | Coordinated disclosure routing (published path). |
| SLA summary (targets) | Self-attested | [SLA_SUMMARY.md](SLA_SUMMARY.md) | Summary targets — contractual SLA only if MSA/order form says so. |
| Trust Center evidence pack (ZIP download) | Self-attested | [trust-center.md](trust-center.md) | Anonymous download; contents listed in Trust Center section. |
| PGP coordinated-disclosure key | Deferred | [../security/PGP_KEY_GENERATION_RECIPE.md](../security/PGP_KEY_GENERATION_RECIPE.md) | **V1.1** drop per [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) section 6c; CI turns green when key file lands. |
| ISO 27001 certificate | Not applicable | [../library/V1_SCOPE.md](../library/V1_SCOPE.md) | No certificate claimed; buyer friction is informational — [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) / scope narratives. |

| Evidence Artifact | Evidence Type | Last Reviewed UTC | Source File | Buyer-safe Claim |
|---|---|---|---|---|
| Trust Center (buyer index) | Self-asserted | 2026-07-31 | [trust-center.md](trust-center.md) | Central index links only to in-repo evidence; distinguishes self-assessed vs deferred third-party artefacts. |
| Security overview | Self-asserted | 2026-07-31 | [docs/library/contributor-reference/SECURITY.md](../library/contributor-reference/SECURITY.md) | Describes scanning, boundaries, authentication modes documented in-repo. |
| System threat model (STRIDE) | Self-asserted | 2026-07-31 | [docs/security/SYSTEM_THREAT_MODEL.md](../security/SYSTEM_THREAT_MODEL.md) | Internal architectural threat enumeration — not substitute for customer architecture review. |
| Tenant isolation (database-per-tenant) | Implemented | 2026-06-06 | [ADR 0037](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md) | Database-per-tenant catalogs + app-layer scope predicates per ADR 0037. SQL RLS was evaluated and not adopted. |
| SOC 2 procurement statement | Self-asserted | 2026-07-23 | [docs/go-to-market/SOC2_STATUS_PROCUREMENT.md](SOC2_STATUS_PROCUREMENT.md) | States Type II issuance not yet claimed; directs to roadmap and self-assessment. |
| SOC 2 self-assessment narrative | Self-asserted | 2026-07-23 | [docs/security/SOC2_SELF_ASSESSMENT_2026.md](../security/SOC2_SELF_ASSESSMENT_2026.md) | Internal CC mapping narrative — explicitly not a CPA audit opinion. |
| SOC 2 roadmap | Deferred V1.1 | 2026-04-24 | [docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap](ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap) | Planned program timing only; confirms no SOC 2 report yet. |
| CAIQ-lite pre-fill | Self-asserted | 2026-07-31 | [docs/security/CAIQ_LITE_2026.md](../security/CAIQ_LITE_2026.md) | Questionnaire-aligned draft sourced from documented controls posture. |
| SIG Core pre-fill | Self-asserted | 2026-07-31 | [docs/security/SIG_CORE_2026.md](../security/SIG_CORE_2026.md) | Questionnaire-aligned draft referencing library evidence pointers. |
| SCIM + Entra ID provisioning recipe | Self-asserted | 2026-07-31 | [docs/integrations/SCIM_ENTRA_ID_SETUP.md](../integrations/SCIM_ENTRA_ID_SETUP.md) | Documents `/scim/v2` URLs, bearer secret issuance (`POST /v1/admin/scim/tokens`), automated Api.Tests Entra-shaped fixtures (no Entra tenant in CI), and parser guardrails for common Entra filter literals. |
| Tenant isolation narrative | Self-asserted | 2026-07-27 | [docs/go-to-market/TENANT_ISOLATION.md](TENANT_ISOLATION.md) | Path-stable pack alias → [`BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview`](BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview). Logical isolation framing for diligence — contract-specific items via MSA/DPA. |
| DPA template | Self-asserted | 2026-07-31 | [docs/go-to-market/DPA_TEMPLATE.md](DPA_TEMPLATE.md) | Template wording only until executed under customer legal review. |
| Subprocessors register | Self-asserted | 2026-07-31 | [docs/go-to-market/SUBPROCESSORS.md](SUBPROCESSORS.md) | Lists subprocessors acknowledged in-repo; customer due diligence completes against their policy. |

## Fast-lane starter

| Starter need | Evidence type / deferral | Source file |
| --- | --- | --- |
| Buyer-wide index | Self-asserted | [trust-center.md](trust-center.md) |
| Engineering security narrative | Self-asserted | [Security overview](../library/contributor-reference/SECURITY.md) |
| STRIDE / boundary threat model | Self-asserted | [System threat model](../security/SYSTEM_THREAT_MODEL.md) |
| Tenant isolation (database-per-tenant) | Implemented | [ADR 0037](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md) |
| SOC 2 procurement wording (status, not issuance) | Self-asserted | [Assurance status canonical](ASSURANCE_STATUS_CANONICAL.md) |
| SOC 2 self-assessment (not CPA audit) | Self-asserted | [SOC 2 self-assessment](../security/SOC2_SELF_ASSESSMENT_2026.md) |
| SOC 2 roadmap / timing | Deferred V1.1 | [ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap](ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap) |
| CAIQ / SIG pre-fills | Self-asserted | [CAIQ](../security/CAIQ_LITE_2026.md) · [SIG](../security/SIG_CORE_2026.md) |
| DPA / subprocessors | Template / self-asserted | [DPA](DPA_TEMPLATE.md) · [Subprocessors](SUBPROCESSORS.md) |
| **Route ↔ tier ↔ policy ↔ nav crosswalk** | Engineering-maintained | [ROUTE_TIER_POLICY_NAV_MATRIX.md](../library/ROUTE_TIER_POLICY_NAV_MATRIX.md) |

## Deal-ready one-pager

**Audience:** Procurement reviewers, security champions, and founders before sending the full evidence ZIP.  
**Canonical assurance wording:** [`ASSURANCE_STATUS_CANONICAL.md`](ASSURANCE_STATUS_CANONICAL.md).

**Target segment:** Mid-market CTO, fractional CTO, cloud consulting buyer, regulated startup — not Fortune 500 rigid RFP.

### What is available now (V1) — required before paid pilot

| Artifact | What it proves |
| --- | --- |
| DPA template | Contractual data-processing terms (legal review required) |
| Subprocessor list | Third-party processors |
| Trust Center narrative | Security, privacy, data handling posture |
| Tenant isolation summary | Design intent for paying-client isolation |
| Security architecture overview | Controls map for reviewers |
| SOC 2 self-assessment + roadmap | **Not CPA attestation** — honest readiness narrative |
| CAIQ Lite / SIG-style responses | Standard questionnaire answers (self-attested) |
| Support policy | Escalation and response expectations |
| SLA/SLO target summary | **Targets**, not contractual SLA unless executed |
| Incident communications policy | Breach / outage comms posture |
| AI output limits / decision-support disclaimer | Human-review boundaries |
| Pilot evidence bundle | Real or clearly labeled controlled run |
| Order form / paid pilot SOW | Commercial terms |

### Acceptable as deferred-scope disclosures

| Item | Label |
| --- | --- |
| CPA-issued SOC 2 Type I/II | **DEFERRED / (B)** — GTM **G-REAL-05** (tech TB-135 Done) |
| Third-party penetration test publication | **DEFERRED / (B)** — GTM **G-ASSURANCE-02** (tech TB-136 Done) |
| ISO 27001 certification | **DEFERRED / (B)** |
| Named public reference customer | **DEFERRED / (B)** |
| Live Marketplace / Stripe checkout | **DEFERRED / (B)** |
| PGP security contact key | Deferred unless buyer asks |
| First-party ITSM/chat/docs connectors, MCP, multi-cloud AWS/GCP | **DEFERRED V1.1/V2** |

| Artifact | What it proves | Link |
| --- | --- | --- |
| Trust Center narrative | Security, privacy, subprocessors, data handling posture | [`trust-center.md`](trust-center.md) |
| CAIQ / SIG responses | Standard questionnaire answers (self-attested) | Procurement pack build |
| DPA template | Contractual data-processing terms (legal review required) | [`DPA_TEMPLATE.md`](DPA_TEMPLATE.md) |
| Subprocessor list | Third-party processors | Trust Center + pack |
| SOC 2 roadmap + self-assessment | Readiness narrative — **not CPA attestation** | Trust Center · [`SOC2_STATUS_PROCUREMENT.md`](SOC2_STATUS_PROCUREMENT.md) · [`SOC2_SELF_ASSESSMENT_2026.md`](../security/SOC2_SELF_ASSESSMENT_2026.md) |
| Tenant isolation + security architecture | Design intent and controls map | Trust Center · security architecture docs |
| API SLO targets | **Targets**, not contractual SLA | [`API_SLOS.md`](../library/API_SLOS.md) |
| `--deal-ready` dry-run | Required V1 assurance **sources exist** and placeholders are buyer-safe | [`PROCUREMENT_DEAL_READY.md`](../runbooks/PROCUREMENT_DEAL_READY.md) |

Full pack request: [`#how-to-request-and-build-the-pack`](#how-to-request-and-build-the-pack)

### What `--deal-ready` proves and does not prove

**Proves:** Required deal-ready doc paths exist; blocking placeholder language is absent; deferred **(B)** items are labeled **DEFERRED_SCOPE** rather than hidden.

**Does not prove:** CPA-issued SOC 2 report, third-party penetration test publication, named reference customer, production contractual SLA, or live Marketplace checkout.

### `(B)` procurement realism (zero weight on headline `(A)` score)

| Buyer ask | V1 posture | Label |
| --- | --- | --- |
| SOC 2 Type I/II CPA report | Roadmap + self-assessment only | **DEFERRED / (B)** |
| Third-party pen test report | Internal testing narrative; no published third-party report | **DEFERRED / (B)** |
| Named public reference | Not in repo | **DEFERRED / (B)** |
| Live commerce / Marketplace transact | Sales-led order form | **DEFERRED / (B)** |

Objection handling: [`BUYER_SECURITY_PROCUREMENT_PACKET.md#procurement-objection-playbook`](BUYER_SECURITY_PROCUREMENT_PACKET.md#procurement-objection-playbook) (`PROCUREMENT_OBJECTION_PLAYBOOK.md` alias)

### How to request the full pack

See [`#how-to-request-and-build-the-pack`](#how-to-request-and-build-the-pack) for CLI, `--strict`, and `--deal-ready` steps.

First-pilot proof collection writes the same classification under the proof folder (`procurement-deal-ready-check.txt`, `procurement-deal-ready-classification.md`).

### Accessibility procurement honesty

- Automated **axe-core** / **jsx-a11y** evidence exists for architect workspace top routes.
- **VPAT** drafts mark manual gaps — do not claim full manual WCAG conformance without completed AT user testing.
- Contact: Trust Center accessibility row · root [`ACCESSIBILITY.md`](../../ACCESSIBILITY.md)

### Legal review required before external send

- DPA redlines, order form, and customer-specific security schedules
- Any buyer-specific naming in cover letters (never commit buyer legal names to the repo)

Former standalone: `docs/go-to-market/PROCUREMENT_DEAL_READY_ONE_PAGER.md` → this section.

## How to request and build the pack

**Audience:** Buyers / procurement requesting a single documentation drop; sales engineering / customer success assembling a diligence bundle without hand-picking Markdown paths.

### One command (recommended)

From a clone of the ArchLucid repository (with the .NET SDK and **Python 3** installed):

```bash
archlucid procurement-pack --out archlucid-procurement-pack.zip
```

```powershell
archlucid procurement-pack --out .\archlucid-procurement-pack.zip
```

The command runs `scripts/build_procurement_pack.py`, verifies **every canonical file** exists, writes `dist/procurement-pack/` (staging) and the ZIP. Inside the ZIP you will find:

- `README.md` — **start here** — pointers to artifact classification and provenance files
- `manifest.json` — each file’s **size**, **SHA-256**, **`artifact_status`**, and a **`quality`** summary object
- `procurement-pack-quality.md` — pass/fail precondition, freshness, strict placeholder, and redaction index for the build
- `versions.txt` — **git commit**, build timestamp, and **CLI package version**
- `redaction_report.md` — repository paths **intentionally omitted** from the canonical checklist and why
- `artifact_status_index.json` — machine-readable **`artifact_status`** per packed path (mirrors `scripts/procurement_pack_canonical.json`)
- `ARTIFACT_STATUS_INDEX.md` — **Evidence** vs **Template** vs **Self-assessment** vs **Deferred** table for buyers

### Validate without writing a ZIP (CI / pre-commit)

```bash
python scripts/build_procurement_pack.py --dry-run
```

### Release / buyer drop — marker strictness

For a **release** or **procurement** drop, run the builder with **`--strict`** (or set environment variable **`PROCUREMENT_PACK_STRICT=1`**) so **Evidence** and **Self-assessment** text files are scanned for buyer-unsafe stub markers (work-in-progress tokens and pre-launch placeholder strings per the procurement pack validator). **`Template`** and **`Deferred`** pack rows are excluded from this scan by design.

```bash
python scripts/build_procurement_pack.py --strict
```

```powershell
$env:PROCUREMENT_PACK_STRICT = "1"
python scripts/build_procurement_pack.py
```

### Script-only (advanced)

```bash
./scripts/build_procurement_pack.sh
```

```powershell
./scripts/build_procurement_pack.ps1
```

Both wrappers invoke the same Python builder. **Default CI** should keep using **`--dry-run`** (assemblability only). Use **`--strict`** or **`PROCUREMENT_PACK_STRICT`** only on release/procurement jobs so merge-blocking gates do not depend on draft markers inside **Template**/**Deferred** pack rows.

### Deal-ready preflight (recommended before sending to buyer)

Run deal-ready mode for a stricter gate that includes canonical assurance coherence references, required buyer-contact checks, and **Last reviewed** freshness for required buyer-facing docs.

```bash
python scripts/build_procurement_pack.py --deal-ready
```

```powershell
$env:PROCUREMENT_PACK_DEAL_READY = "1"
python scripts/build_procurement_pack.py
```

By default, deal-ready mode fails when required buyer-facing docs are more than **120 days** past their `**Last reviewed:** YYYY-MM-DD` marker. Override only with an explicit owner decision:

```bash
python scripts/build_procurement_pack.py --deal-ready --max-review-age-days 180
```

Quick preflight (dry-run + deal-ready):

```powershell
python scripts/build_procurement_pack.py --dry-run --deal-ready
```

### After generating the ZIP

1. Complete a buyer-specific cover letter using [`PROCUREMENT_PACK_COVER.md`](PROCUREMENT_PACK_COVER.md) **outside** the committed tree (see scaffold warnings there).
2. Send the ZIP **or** upload it to the buyer’s secure file exchange — do not email large binaries to unauthenticated mailboxes.

### Pilot close-out gate

Before a Readiness Review close-out or annual conversion ask, use **deal-ready** mode rather than a plain dry run. This is the procurement input named in [`QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist`](QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist). It checks source presence, freshness, buyer-unsafe placeholders, and assurance wording coherence. It does **not** change the assurance posture: SOC 2 CPA attestation, public third-party pen-test results, public reference customers, live marketplace checkout, MCP, and V1.1 connectors remain deferred unless separately shipped.

### Trust Center index

For narrative context and deep links, start at [`trust-center.md`](trust-center.md).

Former standalone: `docs/go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md` → this section.

## Additional navigation

- [MSA outline](MSA_TEMPLATE.md) and [incident communications](INCIDENT_COMMUNICATIONS_POLICY.md) are available for legal and operational diligence.
- [API SLO narrative](../library/API_SLOS.md) describes service targets; contractual commitments require an executed MSA or order form.
- Intentionally not bundled: an independent SOC 2 report and live third-party pen-test deliverables. See [ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap](ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap) and [pen-test summaries](../security/pen-test-summaries/README.md).
