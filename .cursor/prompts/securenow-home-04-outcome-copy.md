# SN-HOME-04 — Directory summaries say the outcome

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-HOME prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_HOME_WORK_SUMMARY_LUNA_PROMPTS.md`

## Goal

Each SecureNow Home row uses the sidebar label and a one-line summary of what the person can do there. Advisory honesty stays in plain words.

## Why

Home rows still take labels from `OPERATOR_NAV_LINK_LABELS`, so the page says "Resource explorer", "Ask", "Assigned to me", and "Remediation instances" while the sidebar says "Resources", "Ask about your environment", "My findings", and "Remediation tracker". Several summaries describe the implementation: "advisory-only execute honesty", "explainable correspondence rows", and "effective ARC-AMPE rules".

## Read first

- `archlucid-ui/src/lib/product-line/securenow-nav-labels.ts`
- `archlucid-ui/src/lib/product-line/securenow-security-home-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-infrastructure-home-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-compliance-home-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-data-sources-home-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-home-nav-order.test.ts`
- `archlucid-ui/src/lib/product-line/securenow-home-copy-hyperscaler-guard.test.ts`
- `archlucid-ui/src/lib/governance/governance-infrastructure-copy.ts` (`INFRASTRUCTURE_WORKBENCH_ROWS` — Architecture overview, leave it)

## What to build

1. Branch `sn-home/04-outcome-copy` from current `master`.
2. SecureNow Home row labels come from `SECURENOW_NAV_LABELS` for that href. Do not read `OPERATOR_NAV_LINK_LABELS` for those rows.
3. Replace the SecureNow Home summaries with:

| Href | Summary |
|------|---------|
| `/security/assigned-to-me` | Open the findings assigned to you. |
| `/compliance/findings` | Review every open finding, with severity and owner. |
| `/infrastructure/resources` | Search collected resources and open the evidence for one resource. |
| `/infrastructure/diagrams` | See how collected resources connect. |
| `/infrastructure/diagram-reconcile` | Compare an uploaded diagram with what was collected, and see what matches. |
| `/infrastructure/snapshots-drift` | Compare two collections and see what changed. |
| `/infrastructure/ask` | Ask a question about this environment. The answer cites collected evidence. |
| `/infrastructure/terraform` | Review suggested Terraform reconstructed from the collection. SecureNow does not apply it. |
| `/security/remediation-factory` | See which fixes to do first, and group them into waves. |
| `/security/remediation-patterns` | Review reusable fixes for similar findings. |
| `/security/remediation-instances` | See each fix from planned to verified. SecureNow records the plan and the later collection. It does not change Azure. |
| `/compliance/policy-packs` | Choose the frameworks this workspace is measured against. |
| `/compliance/standards-and-rules` | See which rules apply here, and which ones conflict. |
| `/compliance/audit-evidence` | Trace a control to the evidence behind it. |

4. Data source rows already say what the person can do. Leave those three summaries unless one of them still says "advisory-only execute honesty", "explainable correspondence rows", or "ARC-AMPE".
5. Do not put ARC-AMPE on the generic SecureNow Home. If an edition module is already on the branch and the active edition is `uhg`, the Frameworks summary may name ARC-AMPE as the featured pack. If that module is absent, skip the name.
6. Leave `INFRASTRUCTURE_WORKBENCH_ROWS` and Architecture page copy unchanged, including "Resource explorer" on the Architecture overview.
7. Keep hrefs and row order. `securenow-home-nav-order.test.ts` stays true.

## Tests

1. Each SecureNow Home row label equals `SECURENOW_NAV_LABELS` for its href.
2. The three old phrases are absent from SecureNow Home copy: "advisory-only execute honesty", "explainable correspondence rows", "effective ARC-AMPE rules".
3. The remediation tracker summary still says SecureNow does not change Azure.
4. The Terraform summary still says SecureNow does not apply it.
5. The hyperscaler guard still passes.
6. Architecture `INFRASTRUCTURE_WORKBENCH_ROWS` labels are unchanged.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- No new API, no new route, no new package.
- Sentence case.
- From `archlucid-ui`, run the home copy Vitest files you touched and `npx tsc --noEmit -p tsconfig.json`.
- Do not commit.

## Done when

SecureNow Home rows use the sidebar names and the summaries above. Architecture overview copy is unchanged.
