# WS-02 — Accept ADR 0078 — career artifact honesty is the contract

Do not rewrite ADR 0073. Do not re-run FC-01–80 validator implementation.

## Goal

Mark **ADR 0078** **Accepted** with evidence pointers to shipped FC validators (`evaluateCareerArtifactHonesty` / `CareerArtifactCompletenessValidator`). Status lag is the leftover — implementation already merged.

## Why

Career exports can look cleaner than the desk. FC phases shipped the fail-closed contract; the ADR file still says Proposed, so the next `/al-ui-rate` or export PR can treat honesty as optional polish.

## Context

- `docs/architecture/adrs/0078-career-artifact-honesty-contract.md`
- FC shared validators (grep `evaluateCareerArtifactHonesty` and `CareerArtifactCompletenessValidator`)
- `docs/architecture/FALSE_CONFIDENCE_CAREER_ARTIFACT_COMPOSER_PROMPTS.md`

## What to build

1. Set ADR 0078 Status to **Accepted**; add an Implementation / Evidence subsection with file pointers (do not rewrite Decision).
2. Update `docs/architecture/adrs/README.md` row.
3. If the FC prompt index still says “ready to run”, mark shipped leftovers vs remaining (do not paste FC files).

## Acceptance criteria

- README and file agree: 0078 Accepted.
- No validator behavior change in this session unless a named leftover is broken.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0067, 0068, 0069, 0070, 0072, 0074, or 0077 bodies — Related pointers only. This wave **adds ADR 0080** and **Accepts 0078 / 0079**.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037 workspace scope).
- **Do not** re-run SY-01–100, AO-01–50, CA-01–50, FC-01–80, PC-01–13, DR-01–16, DX, or PT overlay waves except as a named leftover. Implement only *What to build*.
- **Do not** ship `/al-ui-rate` buyer-walkthrough remediations onto Working production modules (WS-07). Guided / demo / trial remain eval seats.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary (architecture, review, finding, sealed review record). Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database plus a numbered migration if schema changes.

