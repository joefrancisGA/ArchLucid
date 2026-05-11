> **Scope:** Single-pass dry-run audit of the canonical buyer procurement ZIP (synthetic enterprise questionnaire lens). **Not** CPA, SIG, or STAR registry submission — operational notes for owners only.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.

# Procurement pack dry-run results (2026-05-11)

## What was exercised

- **Command:** `python scripts/build_procurement_pack.py` (same pipeline as `archlucid procurement-pack`) with **`--strict`** after edits.
- **Output inspected:** flat list under `dist/procurement-pack/` and **`manifest.json`** inside the bundle (30 tracked Markdown/text/JSON entries plus generated **`README.md`**, **`manifest.json`**, **`versions.txt`**, **`redaction_report.md`**, **`artifact_status_index.json`**, **`ARTIFACT_STATUS_INDEX.md`**).
- **Pre-fill inputs cited in the assessment brief:** the repository uses **`docs/security/CAIQ_LITE_2026.md`** and **`docs/security/SIG_CORE_2026.md`** (there are no `docs/go-to-market/caiq-lite-prefill.*` or `sig-core-prefill.*` files today). Both files are **listed in `redaction_report.md`** as intentionally **outside** the minimal canonical ZIP — provide them **on request** alongside the ZIP.

## Placeholder / marker scan

| Check | Result |
|------|--------|
| **`TODO` / `TBD` / `placeholder-replace-before-launch`** in **Evidence** + **Self-assessment** pack bodies | **None found**; **`--strict`** build **passes**. |
| Colloquial “placeholder” wording in buyer-facing narrative | **Cleared** in packed `*.md` (post-build grep **case-insensitive** `placeholder` — **no hits**). **`HOW_TO_REQUEST_PROCUREMENT_PACK.md`** (not in the ZIP) still names the literal exception string `placeholder-replace-before-launch` for engineers. |
| `README.md` inside the ZIP | Names **`--strict`** without spelling **TBD** / **TODO** in the body (those literals would trip the scan on **Evidence** rows). |
| **`PEN_TEST_SUMMARY.md`** | **Template** row — states **no third-party report**; source file renamed to **`docs/go-to-market/PEN_TEST_SUMMARY_PROCUREMENT_INTERIM.md`** so manifests no longer carry the old filename token. |
| **`PROCUREMENT_PACK_COVER.md`**, **`DPA_TEMPLATE.md`** | **Template** scaffolds — intentional **`<<…>>`** fill points for legal/ops (not compliance “answers”). |

## CAIQ Lite v4 cross-check

- **Source:** `docs/security/CAIQ_LITE_2026.md` (theme tables **GOV**, **HRS**, **IMC**, **OPS**, **APP**).
- **Authoritative IDs:** CSA **CAIQ v4** spreadsheet row IDs must be copied from the **current CSA download** — this pre-fill does **not** enumerate spreadsheet rows.
- **Answer quality:** every theme row is **Yes**, **Strong**, or **Partial** with **Evidence** and, where applicable, an explicit **Gap / next step** (no silent “N/A”).
- **Owner follow-up:** transpose answers **cell-by-cell** into the buyer workbook; **Partial** rows may still trigger supplemental diligence (risk-register export, data-classification appendix, SARIF ledger mirror, etc.).

## SIG Core cross-check

- **Source:** `docs/security/SIG_CORE_2026.md` (families **A–H** summary table).
- **Authoritative IDs:** Shared Assessments **SIG Core** workbook control IDs must be taken from the **current publisher download** — families here are an index, not the full control list.
- **Answer quality:** statuses (**Strong**, **Partial**, **In flight**, **Inherited**) are paired with evidence links or explicit outsourced/inherited context (**Azure**). No empty control rows.

## DPA template

- **File:** `docs/go-to-market/DPA_TEMPLATE.md` (pack: **`DPA_TEMPLATE.md`**).
- **Party/date fields:** use explicit **`<<…>>`** scaffolds aligned with **`PROCUREMENT_PACK_COVER.md`** (no fabricated legal names or calendar dates).
- **Legal review:** §10 (cross-tenant patterns) and §10A still require **qualified counsel** before execution.

## Internal links (ZIP-only reviewer)

- Many Markdown links use **`../library/`**, **`../security/`**, **`../../`**, or paths to **`docs/`** that assume a **full repository clone**. A reviewer opening **only** the ZIP will see **broken relative targets** for those links (for example `V1_SCOPE.md`, `CURRENT_ASSURANCE_POSTURE.md`, `DSAR_PROCESS.md`).
- **Mitigation today:** ship the ZIP **with** an offer to provide the two pre-fill files and any additional library paths the buyer names, or direct them to clone the repo under NDA if links must resolve offline.
- **Out of scope for this pass:** wholesale retargeting of `docs/**` links for dual repo+ZIP layouts (would touch many library files).

## Packaging / provenance files

- **`manifest.json`:** present; **`source_repo_path`** records the canonical repository path per file.
- **`redaction_report.md`:** lists omissions (including CAIQ/SIG pre-fills, SLA summary).
- **`versions.txt`:** git SHA + UTC build stamp + CLI package version string.

## Edits applied in this dry-run (sources only; no C# CLI behavioral change)

- New interim pen-test procurement source: **`docs/go-to-market/PEN_TEST_SUMMARY_PROCUREMENT_INTERIM.md`**; **`scripts/procurement_pack_canonical.json`** updated; legacy `*PLACEHOLDER*` filename removed.
- **`docs/go-to-market/INTEGRATION_CATALOG.md`** — removed non-authoritative contact line; direct buyers to account team / order form.
- **`docs/go-to-market/OWNER_SECURITY_ASSESSMENT_REDACTED_FOR_PACK.md`** — clarified findings-register wording.
- **`docs/library/API_CONTRACTS.md`** — “baseline placeholders” → “synthetic baseline fields…”.
- **`docs/go-to-market/DPA_TEMPLATE.md`** — `<<…>>` scaffold for parties, dates, signature block, and defined-term pointer.
- **`docs/security/CAIQ_LITE_2026.md`** / **`SIG_CORE_2026.md`** — explicit **official ID mapping** + procurement dry-run notes.
- **`docs/library/SECURITY.md`** — JWT / Serilog wording (avoid “placeholder” where buyers might read unfinished copy).
- **`docs/go-to-market/TRUST_CENTER.md`** — packaging paragraph references HOW_TO; avoids literals that fail **`--strict`** on **Evidence** rows.
- **`docs/go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md`** — section title *Release / buyer drop — marker strictness*.
- **`scripts/build_procurement_pack.py`** — generated in-ZIP **`README.md`** strict-line wording.

## Gaps flagged for owner review (no invented compliance)

- **CAIQ / SIG workbook mapping** remains a **human step** (spreadsheet IDs + buyer-specific columns).
- **Third-party pen test** — still **not** claimed complete; see **`PEN_TEST_SUMMARY.md`** in pack and `TRUST_CENTER.md`.
- **ZIP link usability** — consider a future enhancement (separate initiative) if buyers frequently work **without** a clone.

