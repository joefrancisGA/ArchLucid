<!-- Proof-claim scoping prompt set — paste one prompt per Composer session.
     Last updated: 2026-08-03. Origin: principal-architect critique #1
     ("Architecture Proof Engine — proof of what, exactly?").
     Fix strategy: (1) scope the word "proof" everywhere the category name appears,
     (2) reframe as proof-of-diligence vs. no-record, (3) earn more of the word via
     a finding verification loop (spec only). -->

# Proof-claim scoping — Composer prompt set

**Problem being fixed:** the category name "Architecture Proof Engine" lets a skeptical buyer hear *proof of architectural soundness* (survives load, audits, incidents), when the product actually proves *provenance and diligence* (evidence-linked findings, append-only audit chain, hash-verified package). The docs hedge ("proof-oriented", "hash-verified, not PKI") but never pre-commit to one crisp answer to "proof of what?".

**Run order:** P1 → P2 → P3 → P4 → P5 → P6. P1 defines the canonical copy the others reuse; each prompt is otherwise independently shippable. Run one prompt per Composer session.

**Global constraints (apply to every prompt):**

- Do not imply CPA SOC 2 attestation or a published third-party pen test anywhere (see `.cursor/rules/V1_1-assurance-backlog.mdc`).
- Every claim must map to a shipped V1 capability (`docs/go-to-market/POSITIONING.md` grounding rule).
- Respect working-tree safety: run `.\scripts\agent\check-working-tree-path.ps1 -Path <file>` before editing tracked files; stop and report if blocked.
- Docs-only prompts need no compile check. UI prompts: scoped Vitest only, no full build.

---

## Canonical copy (single source — P1 installs it, P2–P4 reference it)

**Long form (docs, sponsor brief, datasheet):**

> ArchLucid proves that a rigorous, evidence-linked architecture review happened — who reviewed what, against which policy packs, with which findings, confidence limits, and explicit non-conclusions where evidence was missing. It does not prove the architecture will perform under load, in an audit, or in an incident. It proves the decision can be defended with evidence.

**Short form (marketing / buyer surfaces):**

> Proof of diligence, not a performance guarantee: every finding traces to evidence, and the finalized package is hash-verified and auditable.

Do not paraphrase these when installing them; drift guards (P2) will pin the long form's key clauses.

---

## P1 — Install the canonical proof-scope statement in the docs spine

```text
ArchLucid names its category "Architecture Proof Engine" but never states in one canonical
sentence what "proof" does and does not mean. Fix that in the docs spine.

Canonical long-form statement (install verbatim, do not paraphrase):

"ArchLucid proves that a rigorous, evidence-linked architecture review happened — who reviewed
what, against which policy packs, with which findings, confidence limits, and explicit
non-conclusions where evidence was missing. It does not prove the architecture will perform
under load, in an audit, or in an incident. It proves the decision can be defended with
evidence."

Edits:

1. docs/go-to-market/POSITIONING.md §5 "Category definition": add a "What proof means here"
   subsection containing the statement, immediately after the three-numbered-capabilities list
   and before the EA-management comparison paragraph.
2. docs/go-to-market/POSITIONING.md §7 messaging table: add a Do/Don't row —
   Do: 'Answer "proof of what?" with the canonical proof-scope statement (§5)';
   Don't: 'Imply the package proves runtime soundness, load behavior, or incident resilience'.
3. docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md: add the statement where the category is
   introduced (§1 or nearest category/promise section), phrased as a callout so sellers quote
   it when a design authority asks "proof of what?".
4. docs/go-to-market/POSITIONING.md #product-datasheet section: in "The solution", append the
   statement as a one-line footnote-style sentence (short adaptation allowed here only:
   "ArchLucid proves the review happened and is defensible — not that the design will perform
   in production.").
5. docs/library/CONCEPT_VOCABULARY.md (or docs/library/GLOSSARY.md if that is where category
   terms live — check both): add/extend the "Architecture Proof Engine" entry with the
   statement.

Constraints: docs-only; no code, no UI. Do not touch trust-center or assurance docs. Do not
imply CPA SOC 2 or third-party pen test. Keep the "Reviewed:" front-matter date convention —
update it to today on files you edit. docs/CHANGELOG.md is dirty in the working tree; do NOT
edit it unless the working-tree check passes, and if blocked just note the skipped changelog
entry in your summary.

Acceptance: the long-form statement appears verbatim in POSITIONING.md §5,
EXECUTIVE_SPONSOR_BRIEF.md, and the vocabulary/glossary entry; §7 has the new row; datasheet
has the one-liner. No other rewording of surrounding positioning copy.
```

---

## P2 — Claim-boundary rule + CI drift guard for unscoped proof claims

```text
ArchLucid has a claim-discipline CI script (scripts/ci/check_buyer_claim_drift.py) and a claim
boundary guide (docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md). Extend both so "proof"
overclaiming is machine-checked, matching the canonical proof-scope statement installed in
POSITIONING.md §5 ("What proof means here").

1. docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md: add a "Proof-scope boundary" rule section:
   - Allowed: proof of review rigor, evidence linkage, provenance, auditability, tamper
     evidence ("hash-verified"), defensibility of the decision.
   - Forbidden without explicit qualification: claims that ArchLucid proves/validates/
     guarantees architecture soundness, production readiness, runtime performance, load
     behavior, security posture of the reviewed system, or incident resilience.
   - Point to POSITIONING.md §5 as the canonical answer to "proof of what?".
2. scripts/ci/check_buyer_claim_drift.py: add forbidden-pattern entries (follow the existing
   pattern/message tuple style around the existing real-LLM proof regex) that catch, in
   buyer-facing doc scope, phrases like:
   - "proves (that )?(your|the) architecture (is|will be) (sound|secure|correct|resilient)"
   - "prov(es|en) (production|runtime) (readiness|performance)"
   - "guarantees? (that )?(your|the) (architecture|design|system)"
   Case-insensitive. Each with a one-line remediation message pointing at
   PUBLIC_CLAIM_BOUNDARY_GUIDE.md#proof-scope-boundary.
3. Add/extend unit tests in scripts/ci/tests/ (mirror the existing test style for this script)
   with at least: one fixture per new pattern that must FAIL, and passing fixtures for the
   allowed vocabulary ("proves the review happened", "hash-verified", "defensible").

Constraints: do not loosen or reorder existing patterns; do not widen the script's file scope;
Python only, no new dependencies. Run only the focused test file for this script to verify.

Acceptance: new guide section exists; new regexes present with tests; focused pytest for the
claim-drift tests passes locally.
```

---

## P3 — Surface the proof-scope line on marketing/UI category surfaces

```text
ArchLucid's buyer-facing category name "Architecture Proof Engine" is centralized in
archlucid-ui/src/lib/brand-category.ts (BRAND_CATEGORY), guarded by
scripts/ci/assert_brand_category_seam.py. Marketing surfaces (the /why page under
archlucid-ui/src/app/(marketing)/why/ and any page rendering BRAND_CATEGORY as a category
explainer) should carry a one-line proof-scope qualifier.

Canonical short-form line (install verbatim):

"Proof of diligence, not a performance guarantee: every finding traces to evidence, and the
finalized package is hash-verified and auditable."

1. archlucid-ui/src/lib/brand-category.ts: export a new constant
   BRAND_PROOF_SCOPE_STATEMENT with the short-form line, JSDoc pointing to
   docs/go-to-market/POSITIONING.md §5. Keep existing exports untouched.
2. archlucid-ui/src/app/(marketing)/why/: render BRAND_PROOF_SCOPE_STATEMENT as quiet
   supporting copy directly beneath wherever the category name / lead promise is presented
   (muted body text per the Carbon-based design system — no new card, no pastel callout,
   no new component; follow docs/library/UI_DESIGN_SYSTEM.md restraint rules).
3. Update the affected Vitest snapshots (the why-page snapshot exists at
   archlucid-ui/src/app/(marketing)/why/__snapshots__/) by running the focused tests, and
   extend the page test with one assertion that the statement text renders.
4. Check whether scripts/ci/assert_brand_category_seam.py or the internal-concept-leakage
   guard (archlucid-ui/src/lib/internal-concept-leakage-guard.test.ts) needs the new constant
   allowlisted; update minimally if so.

Constraints: marketing surface only — do not touch operator workspace pages. Several files in
archlucid-ui/src/lib/ are dirty in the working tree (internal-concept-leakage-guard.test.ts is
one); run .\scripts\agent\check-working-tree-path.ps1 on each tracked file before editing and
stop/report if blocked rather than overwriting. Imports at top of file. Verify with focused
Vitest only (npx vitest run <files> from archlucid-ui/), not the full suite or a build.

Acceptance: constant exported; /why renders the line; focused tests + updated snapshots pass;
brand seam check (python scripts/ci/assert_brand_category_seam.py from repo root) passes.
```

---

## P4 — Reframe: proof of diligence vs. no record (objection handling)

```text
ArchLucid's strongest honest answer to "proof means it survived load/audit/incident" is:
today's manual review proves nothing at all — no durable record, no evidence linkage, no
answer when a regulator asks "who reviewed this and what did they find?". Make that the
explicit comparison frame in the seller-facing materials.

1. docs/go-to-market/DIFFERENTIATION_PROOF_PACKET.md: add an objection-handling entry titled
   "Proof of what, exactly?" with:
   - the skeptic's objection verbatim ("proof means the system behaved correctly under load,
     in an audit, or in an incident"),
   - the two-part response: (a) canonical proof-scope statement from POSITIONING.md §5
     (quote it, link the section), (b) the comparison frame: the alternative is not runtime
     validation, it is an undocumented meeting — ArchLucid's claim is proof-of-diligence vs.
     no-record.
   - the two verbatim differentiator terms already standardized in POSITIONING.md §2
     ("audit chain", "signed manifest") with their existing careful definitions — do not
     restate them loosely.
2. docs/go-to-market/DEMO_QUICKSTART.md demo scripts section: add one short talk-track beat
   (2–3 sentences) for when a live-demo audience asks "proof of what?", consistent with the
   packet entry.
3. docs/go-to-market/POSITIONING.md #product-datasheet "The problem": no rewrite — verify the
   existing "who reviewed this design and what did they find?" line survives; strengthen only
   if the diligence-vs-no-record frame is absent.

Constraints: docs-only. Do not add competitive claims about named vendors beyond what
COMPETITIVE_LANDSCAPE.md already supports. Do not imply CPA SOC 2 / third-party pen test.
Update "Reviewed:" dates on edited files.

Acceptance: packet has the objection entry with both parts; demo script has the beat; no
contradictions with EXECUTIVE_SPONSOR_BRIEF.md (it remains the dominant narrative — if
wording conflicts, tighten the packet, not the brief).
```

---

## P5 — Finding verification loop: ADR + backlog rows (spec only, no implementation)

```text
ArchLucid's "proof" claim today covers provenance/diligence only. The long-term fix is a
product loop that scores past findings against later observed reality, so the word earns
predictive validity. Write the design record and backlog rows — DO NOT implement.

Context to read first: docs/go-to-market/POSITIONING.md §4-§5 (drift detection, two-review
comparison with verify mode, ComplianceDriftTrendService), docs/library/V1_SCOPE.md,
docs/library/TECH_BACKLOG.md conventions (TB-### row format), an existing ADR under
docs/architecture/adrs/ for format.

1. New ADR docs/architecture/adrs/ (next free number): "Finding verification loop
   (proof-of-prediction)". Contents:
   - Decision: introduce a post-review verification pass that re-ingests customer evidence
     (same customer-run read-only extractor path as V1) N months after finalize and scores
     each finding as Materialized / Mitigated / Not observed / Not verifiable, attached to the
     original finding ID without mutating the finalized package (immutability is load-bearing —
     verification results are a NEW linked artifact, never an edit to the signed manifest).
   - First-principles framing: inputs (finalized package findings, later evidence snapshot,
     optional operator incident annotations), outputs (verification report artifact +
     aggregate "findings confirmed" metric), constraints (tenant isolation ADR 0037, append-only
     audit, no vendor credentials in customer cloud, LLM budget guardrails).
   - Decomposition: interfaces / services / data model / orchestration, consistent with the
     existing .NET layout (Decisioning, Persistence with Dapper-style access, Worker
     orchestration). Concrete types over vague boxes. Include trade-offs: verification lag vs.
     freshness, false "Not observed" from partial extracts, cost of re-analysis; and why the
     simple snapshot-diff MVP is chosen over continuous monitoring (which would contradict the
     "not a runtime control plane" positioning).
   - Explicit non-goals: no runtime agents in customer estates, no load-test execution, no
     incident-management product.
   - Security / scalability / reliability / cost sections per repo convention.
   - Status: Proposed, target V1.1.
2. docs/library/TECH_BACKLOG.md: add 3–5 TB rows (next free IDs, match existing row format)
   sequencing the MVP: (a) verification data model + linked artifact, (b) re-ingest + scoring
   pass, (c) verification report export, (d) aggregate metric on the scorecard, (e) claim-copy
   unlock (marketing may only cite confirmation rates once real pilot data exists — gate the
   copy behind evidence, consistent with PUBLIC_CLAIM_BOUNDARY_GUIDE.md).
3. Do NOT add rows to GTM backlog, do not touch V1_SCOPE.md (this is V1.1), do not write code.

Acceptance: ADR follows house format with all four decomposition layers and explicit
trade-offs; TB rows compile against backlog format conventions; zero code/UI changes.
```

---

## P6 — Verification sweep

```text
A multi-session docs+UI change set just landed scoping ArchLucid's "proof" claim (canonical
statement in docs/go-to-market/POSITIONING.md §5, new claim-drift regexes in
scripts/ci/check_buyer_claim_drift.py, BRAND_PROOF_SCOPE_STATEMENT in
archlucid-ui/src/lib/brand-category.ts rendered on the marketing /why page, objection entry
in DIFFERENTIATION_PROOF_PACKET.md, ADR + TB rows for a finding verification loop).

Verify, fixing only what fails:

1. python scripts/ci/assert_brand_category_seam.py (repo root) — brand seam intact.
2. Focused pytest for scripts/ci/tests covering check_buyer_claim_drift.py — new patterns
   pass their fixtures.
3. Run check_buyer_claim_drift.py itself against the repo — the newly edited buyer-facing
   docs must not trip their own guard.
4. From archlucid-ui/: focused Vitest for the why-page tests, brand-category consumers, and
   internal-concept-leakage-guard — snapshots current, no internal vocabulary leaked to
   customer surfaces.
5. Grep buyer-facing docs (docs/go-to-market/, docs/library/customer-facing/) for remaining
   unscoped soundness-proof phrasing the new regexes would flag; fix stragglers with minimal
   edits.
6. Confirm the canonical long-form statement is byte-identical in POSITIONING.md §5,
   EXECUTIVE_SPONSOR_BRIEF.md, and the vocabulary/glossary entry (drift here defeats the
   whole point).

Constraints: verification + minimal fixes only — no new copy, no refactors, no full builds or
full test suites. One scoped shell command at a time per repo shell-hygiene rules. Report
pass/fail per step with the exact commands run.
```

---

## Model guidance

- **Composer-safe:** P1, P4, P6 (mechanical doc installs, verbatim copy, verification).
- **Composer with care:** P2 (regex design — keep patterns narrow; overbroad patterns will false-positive on legitimate "proof" vocabulary), P3 (snapshot churn — touch only the why page).
- **Strong-model review recommended before merge:** P5 (proof semantics + architecture decomposition; the ADR's immutability stance — verification as linked artifact, never manifest mutation — is load-bearing).
