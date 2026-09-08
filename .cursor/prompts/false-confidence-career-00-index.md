<!-- False-confidence career-artifact Composer prompts — paste one prompt per session.
     Origin: owner request to solve false confidence on career artifacts (stamp,
     finalize, sponsor PDF, exports) — livelihood-grade honesty, not evaluator polish.
     Wave FC after DR-01–16, LK-01–15, PC-01–13, CA/AO waves. 80 prompts.
     Do not implement from this index. -->

# False-confidence career-artifact mitigations — Composer prompt set (FC-01–FC-80)

ArchLucid sells a **seat for a repeat professional** (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13). Career artifacts are what architects email to sponsors, paste into ARBs, and attach to audit packets. **False confidence** is any artifact that looks **more certain** than the desk allows: missing transparency trail, implied density demotion, `Ready` tags on decision-grade findings, simulator output packaged as Real, sponsor PDFs cleaner than the review, or exports that omit skipped MUST / quiet engines.

This wave **does not replace** prior honesty work (LK-08/09, DR-01–05, CD-05–15, CR-12, FD-13). It **systematizes** remaining surfaces and adds **one contract ADR (0078)** plus shared TS/C# validators so 80 targeted prompts do not drift.

**Do not implement from this index.** Paste one `false-confidence-career-NN-*.md` file per Composer session.

**Do not treat as a V1 assessment scorecard.** No GTM cohorts **M-90 / M-44 / M-91 / M-92**; no reopen **TB-135 / TB-136**. **TB-645** vocabulary stays.

## What this set changes

| Layer | Prompts | Outcome |
|-------|---------|---------|
| **Contract + shared kernel** | FC-01–08 | ADR 0078; TS + C# validators; CI inventories |
| **Transparency trail (R4)** | FC-09–18 | Trail complete or blocked on every career path |
| **Decision-grade / density** | FC-19–28 | No false demotion; neutral tags; advisory generic hide |
| **Feasibility / reasoned no** | FC-29–34 | Hard/soft honesty; compare deltas |
| **Finding trust / provenance** | FC-35–42 | Wire labels on exports; clipboard/Jira/ADR |
| **Sponsor / executive exports** | FC-43–52 | Execution mode, ROI basis, infra labeling |
| **Print / JSON / bundles** | FC-53–60 | Meeting packet, receipt placement, ZIP caps |
| **Ask / Compare / Graph** | FC-61–68 | Scoped answers; assumption deltas; PNG disclaimer |
| **Desk / pipeline honesty** | FC-69–75 | Activity %, Ready when blocked, legacy re-export |
| **Governance / audit artifacts** | FC-76–79 | CSV language; quick approve friction; demo verify |
| **Test corpus honesty** | FC-80 | Docs/tests must not pin always-Promote fiction |

## What this set does *not* change

- **`DeterministicInsightDensityGate` demotion predicate** (ADR 0070 / IS-05) — honesty presentation only.
- **Sealed record immutability** (ADR 0039) — honesty banners on re-export, no byte rewrite.
- **Two kernels / two SQL tables** (ADR 0068) — no merge.
- **300s mutation undo toast** — FC does not lengthen; document undo is LK-01/02.
- **Desktop review tabs** — full strip, no **More** menu.
- **40th coverage engine** — forbidden (`HOLD_NO_COVERAGE_ENGINES.md`).

## Relationship to prior sets

| Set | Role | FC relationship |
|-----|------|-----------------|
| **LK-08/09, ADR 0073** | Trail finalize gate | FC-09 verifies + extends to all exports |
| **DR-01–05** | Fail-closed completeness | FC-19/71/72 implement UI/export leftovers |
| **CD-05–07, CD-12, CD-15** | Stamp/print/sponsor | FC-23, 53, 45, 52 — do not fork bodies |
| **CR-01, CR-12, SD-01/12** | Tests + sponsor Ready | FC-05, 46, 80 |
| **WA-07/08/09/13/22** | Ask/sponsor/compare/receipt | FC-61–66, 56, 69 |
| **FD-02/05/07/13** | Founding honesty | FC-11, 10, 40, 21 |
| **PC-01/13, DR-01** | Measurement floor | FC-19, 02/03 |
| **ENTERPRISE_TRUST T01–03** | Governance trust | FC-76–78 |

If an FC row lists a prior owner, **implement only the leftover** in that prompt's *What to build*.

## Run order (recommended)

**Phase 0 — contract:** FC-01 → FC-02 → FC-03 → FC-04 → FC-05 → FC-06 → FC-07 → FC-08

**Phase 1 — trail gates:** FC-09 → FC-10 → FC-11 → FC-12 → FC-13 → FC-14 → FC-15 → FC-16 → FC-17 → FC-18

**Phase 2 — density/classification:** FC-19 → FC-20 → FC-21 → FC-22 → FC-23 → FC-24 → FC-25 → FC-26 → FC-27 → FC-28

**Phase 3 — feasibility:** FC-29 → FC-30 → FC-31 → FC-32 → FC-33 → FC-34

**Phase 4 — trust/provenance:** FC-35 → FC-36 → FC-37 → FC-38 → FC-39 → FC-40 → FC-41 → FC-42

**Phase 5 — sponsor/executive:** FC-43 → FC-44 → FC-45 → FC-46 → FC-47 → FC-48 → FC-49 → FC-50 → FC-51 → FC-52

**Phase 6 — print/bundles:** FC-53 → FC-54 → FC-55 → FC-56 → FC-57 → FC-58 → FC-59 → FC-60

**Phase 7 — analysis surfaces:** FC-61 → FC-62 → FC-63 → FC-64 → FC-65 → FC-66 → FC-67 → FC-68

**Phase 8 — desk + governance:** FC-69 → FC-70 → FC-71 → FC-72 → FC-73 → FC-74 → FC-75 → FC-76 → FC-77 → FC-78 → FC-79 → FC-80

Parallel OK within a phase when files do not overlap. **FC-02/03** should land before most export refactors in Phases 5–6.

## Prompt catalog

| # | File | Primary artifact / surface |
|---|------|----------------------------|
| 01 | `false-confidence-career-01-adr-career-artifact-honesty-contract.md` | ADR 0078 contract |
| 02 | `false-confidence-career-02-shared-career-artifact-honesty-module.md` | TS shared module |
| 03 | `false-confidence-career-03-shared-career-artifact-validator-csharp.md` | C# shared validator |
| 04 | `false-confidence-career-04-ci-career-export-path-inventory.md` | Export path inventory |
| 05 | `false-confidence-career-05-ci-no-ready-tag-on-decision-grade.md` | StatusTag guard |
| 06 | `false-confidence-career-06-ci-export-must-call-completeness.md` | Formatter guard |
| 07 | `false-confidence-career-07-ci-grandfather-list-ratchet.md` | Eval chrome ratchet |
| 08 | `false-confidence-career-08-openapi-export-honesty-fields.md` | OpenAPI blockReason |
| 09 | `false-confidence-career-09-finalize-api-trail-fail-closed.md` | Finalize API |
| 10 | `false-confidence-career-10-finalize-scorecard-trail-first-viewport.md` | Finalize scorecard UI |
| 11 | `false-confidence-career-11-stamp-band-trail-sections-visible.md` | Stamp band |
| 12 | `false-confidence-career-12-pre-finalize-trail-not-collapsed.md` | Overview trail |
| 13 | `false-confidence-career-13-asserted-empty-blocks-evidence-claims.md` | Asserted vs claims |
| 14 | `false-confidence-career-14-inferred-trail-matches-trust-labels.md` | Inferred vs trustLabel |
| 15 | `false-confidence-career-15-skipped-must-blocks-finalize-api.md` | Skipped MUST API |
| 16 | `false-confidence-career-16-skipped-must-on-export-headers.md` | Export headers |
| 17 | `false-confidence-career-17-decision-receipt-json-trail-gate.md` | Decision receipt JSON |
| 18 | `false-confidence-career-18-sealed-record-export-cta-honesty.md` | Sealed record CTAs |
| 19 | `false-confidence-career-19-measurement-floor-null-fail-closed.md` | Floor null fail-closed |
| 20 | `false-confidence-career-20-stamp-denominator-every-finalize.md` | Denominator strip |
| 21 | `false-confidence-career-21-decision-grade-chip-neutral-not-ready.md` | Decision-grade chip |
| 22 | `false-confidence-career-22-findings-list-grade-includes-honesty.md` | Findings list |
| 23 | `false-confidence-career-23-snapshot-banner-lead-clause.md` | Snapshot banner |
| 24 | `false-confidence-career-24-hide-generic-labeled-advisory.md` | Hide generic toggle |
| 25 | `false-confidence-career-25-checklist-band-separate-from-decision-grade.md` | Checklist band |
| 26 | `false-confidence-career-26-curation-message-no-false-demote.md` | Curation message |
| 27 | `false-confidence-career-27-finding-inspect-density-honesty.md` | Finding inspect |
| 28 | `false-confidence-career-28-governance-queue-density-advisory-copy.md` | Governance queue |
| 29 | `false-confidence-career-29-infeasible-receipt-primary-surface.md` | Infeasible receipt |
| 30 | `false-confidence-career-30-hard-infeasible-citation-on-export.md` | Hard infeasible export |
| 31 | `false-confidence-career-31-soft-infeasible-envelope-not-failed.md` | Soft infeasible copy |
| 32 | `false-confidence-career-32-sponsor-summary-feasibility-honesty.md` | Sponsor summary |
| 33 | `false-confidence-career-33-empty-state-after-infeasible.md` | Empty states |
| 34 | `false-confidence-career-34-compare-infeasible-delta-honesty.md` | Compare delta |
| 35 | `false-confidence-career-35-ui-prefers-wire-trust-label.md` | trustLabel UI |
| 36 | `false-confidence-career-36-export-includes-trust-label-reason.md` | Export trust labels |
| 37 | `false-confidence-career-37-sponsor-pdf-heuristic-exclusion-or-label.md` | Sponsor PDF findings |
| 38 | `false-confidence-career-38-decision-grade-provenance-on-export.md` | Provenance validator export |
| 39 | `false-confidence-career-39-finding-inspect-citation-required-grade.md` | Inspect citations |
| 40 | `false-confidence-career-40-clipboard-copy-coverage-honesty.md` | Clipboard |
| 41 | `false-confidence-career-41-jira-paste-strips-no-honesty.md` | Jira paste |
| 42 | `false-confidence-career-42-adr-export-provenance-section.md` | ADR export |
| 43 | `false-confidence-career-43-sponsor-pdf-execution-mode-banner.md` | Execution mode banner |
| 44 | `false-confidence-career-44-email-sponsor-banner-hold-blocks.md` | Email sponsor CTA |
| 45 | `false-confidence-career-45-first-value-report-pdf-trail-floor.md` | First-value PDF |
| 46 | `false-confidence-career-46-sponsor-kpi-not-ready-from-grade.md` | Sponsor KPI tiles |
| 47 | `false-confidence-career-47-roi-basis-labels-on-sponsor-exports.md` | ROI basis |
| 48 | `false-confidence-career-48-pilotstrict-blocks-external-sponsor.md` | PilotStrict external |
| 49 | `false-confidence-career-49-whitelabel-consulting-export-honesty.md` | Whitelabel export |
| 50 | `false-confidence-career-50-executive-dashboard-infra-not-customer.md` | Exec dashboard infra |
| 51 | `false-confidence-career-51-sponsor-deferred-scope-reasons.md` | Deferred scope |
| 52 | `false-confidence-career-52-product-documentation-pdf-honesty.md` | Product doc PDF |
| 53 | `false-confidence-career-53-print-meeting-packet-trail-sections.md` | Print packet |
| 54 | `false-confidence-career-54-print-quiet-engines-visible.md` | Print quiet engines |
| 55 | `false-confidence-career-55-sealed-json-export-trail-arrays.md` | Sealed JSON |
| 56 | `false-confidence-career-56-decision-receipt-at-stamp-not-appendix.md` | Receipt placement |
| 57 | `false-confidence-career-57-export-markdown-measurement-floor.md` | Export markdown |
| 58 | `false-confidence-career-58-docx-export-honesty-if-present.md` | DOCX export |
| 59 | `false-confidence-career-59-zip-bundle-readme-honesty.md` | ZIP README |
| 60 | `false-confidence-career-60-replay-verify-not-recertification.md` | Replay verify |
| 61 | `false-confidence-career-61-ask-scoped-to-open-package.md` | Ask scope |
| 62 | `false-confidence-career-62-ask-answers-name-skipped-engines.md` | Ask skipped engines |
| 63 | `false-confidence-career-63-ask-no-citation-no-claim.md` | Ask citations |
| 64 | `false-confidence-career-64-compare-assumption-delta-visible.md` | Compare UI assumptions |
| 65 | `false-confidence-career-65-compare-export-correlation-metadata.md` | Compare export meta |
| 66 | `false-confidence-career-66-what-if-branch-billable-label.md` | What-if label |
| 67 | `false-confidence-career-67-evidence-graph-png-disclaimer.md` | Graph PNG |
| 68 | `false-confidence-career-68-graph-unknown-nodes-labeled.md` | Graph unknown nodes |
| 69 | `false-confidence-career-69-activity-no-fake-percent-complete.md` | Activity timeline |
| 70 | `false-confidence-career-70-pipeline-status-not-ready-when-blocked.md` | Pipeline status |
| 71 | `false-confidence-career-71-quality-gate-warnonly-not-ready.md` | Quality gate WarnOnly |
| 72 | `false-confidence-career-72-precommit-gate-off-blocks-career-export.md` | Pre-commit gate off |
| 73 | `false-confidence-career-73-demo-static-banner-on-career-export.md` | Demo/static banner |
| 74 | `false-confidence-career-74-sample-row-cannot-export-unlabeled.md` | Sample export |
| 75 | `false-confidence-career-75-legacy-sealed-reexport-honesty-banner.md` | Legacy seal re-export |
| 76 | `false-confidence-career-76-governance-audit-csv-no-quick-approve.md` | Audit CSV |
| 77 | `false-confidence-career-77-governance-quick-approve-confirmation.md` | Quick approve |
| 78 | `false-confidence-career-78-audit-trail-verify-demo-labeled.md` | Demo audit verify |
| 79 | `false-confidence-career-79-decision-register-export-honesty.md` | Decision register export |
| 80 | `false-confidence-career-80-distribution-tests-no-always-promote.md` | Test corpus |

## Global constraints (every prompt)

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'` before editing tracked files.
- **Do not** hide desktop review tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** change `DeterministicInsightDensityGate` demotion predicate.
- **Do not** add a 40th coverage engine or fake frontier transcripts.
- Claim discipline: `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`. **TB-645** vocabulary.
- Verification: focused Vitest + scoped C# tests; `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes.
- UI: Carbon density, sentence case, **TB-2005** form validation.
- New ADRs: Trade-offs, Constraints, Expected impact per template.

## After each prompt

Summarize: files changed, tests run, residual risk, Working vs Guided behavior, **which career artifact** was hardened, and whether FC-02/FC-03 parity holds. Link ADR 0078 section if applicable.

## Expanding beyond 80

If a surface needs split PRs, fork by **artifact** (e.g. FC-45a sponsor PDF body vs FC-45b sponsor PDF appendix) — keep the same honesty contract. Do not add prompts that only rephrase shipped LK/DR/CD bodies without a new surface.

**Owner doc:** [`docs/architecture/FALSE_CONFIDENCE_CAREER_ARTIFACT_COMPOSER_PROMPTS.md`](../docs/architecture/FALSE_CONFIDENCE_CAREER_ARTIFACT_COMPOSER_PROMPTS.md)
