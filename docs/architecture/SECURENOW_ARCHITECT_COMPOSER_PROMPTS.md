> **Scope:** Copy-paste Composer/Cloud Agent prompts for SecureNow automated security-architect engines over live Azure inventory. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/securenow-architect-00-index.md`](../../.cursor/prompts/securenow-architect-00-index.md) (**SA-01–SA-22**)
> **Contract:** [`../library/SECURENOW_ARCHITECT_PLANE.md`](../library/SECURENOW_ARCHITECT_PLANE.md)
> **Depends on:** [`INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md) and IE snapshot / operational-finding / remediation seams
> **Do not fork:** second Azure collector; `IFindingEngine` coverage engines; customer ARM writes; mega-graph of every node type; GTM **M-90 / M-44 / M-91 / M-92**; closed assurance **TB-135 / TB-136**; desktop review tab collapse

# SecureNow architect — Composer prompts (SA-01–SA-22)

**Created:** 2026-09-10 · **Status:** ready to run · **Audience:** Cursor Composer implementing attack-path / capability-to-flow reasoning on the operational security stream.

Paste **one** `.cursor/prompts/securenow-architect-NN-*.md` file per Composer session. **Do not implement from this document’s tables.**

## Why this set exists

The infrastructure-evidence plane already collects Azure snapshots, diffs them, matches operational findings to advisory remediations, and verifies on the next snapshot. Review-graph engines (`identity-blast-radius`, `data-flow-trust-boundary`) reason over **declarations**, not live inventory paths.

SecureNow still behaves like a scanner if it ranks “public storage with marketing PDFs” above “private store reachable by a privileged workload with unrestricted egress.” These prompts make **paths** first-class over **proven snapshot evidence**, keep AI bounded, and refuse to apply customer Azure.

## Diagnosis → prompt

See [`.cursor/prompts/securenow-architect-00-index.md`](../../.cursor/prompts/securenow-architect-00-index.md) for the full table, run order, holds, and global constraints.

## Sequencing

| Wave | Prompts | Intent |
|------|---------|--------|
| 0 Types | **SA-01**, **SA-02** | Path model + live-inventory security edges |
| 1 Privilege | **SA-03**, **SA-04** | Privilege-path engine + path inspector API |
| 2 Network | **SA-05**, **SA-06** | Intended reachability + toxic combinations |
| 3 Flow / radius | **SA-07**, **SA-08** | Capability-to-flow + shared-control blast radius |
| 4 Rank | **SA-09**, **SA-10**, **SA-11** | Independent dimensions, cut points, outcome metrics |
| 5 Drift | **SA-12**, **SA-13** | Four-reality path drift + incremental invalidation |
| 6 Fix | **SA-14**, **SA-15** | Path-aware advisory remediation + org routing |
| 7 Desk | **SA-16**, **SA-17**, **SA-18**, **SA-21** | UI, constrained AI, human assertions, honesty copy |
| 8 Adapters | **SA-19**, **SA-20** | CI federated identity + optional Entra (fail soft) |
| Hold | **SA-22** | Written hold — not implementation ([`SECURENOW_ARCHITECT_HOLD.md`](../library/SECURENOW_ARCHITECT_HOLD.md)) |

**SA-01** first. **SA-03** after **SA-02**. Adapters **SA-19/SA-20** must not block waves 1–2.

## Intentional — do not “fix”

- Do **not** add `IFindingEngine` types or golden-corpus coverage engines.
- Do **not** put findings on the graph as traversable nodes.
- Do **not** claim observed data flow or packet reachability from ARM/ARG alone.
- Do **not** `terraform apply` or request write roles.
- Do **not** collect every lecture node (pods, full CMDB, SIEM) before Azure RBAC + network work.
- Do **not** display confidence as a percentage.
- Do **not** re-run IE-01–IE-22 collector bodies; extend them.

## Global constraints

See [`.cursor/prompts/securenow-architect-00-index.md`](../../.cursor/prompts/securenow-architect-00-index.md). Plane wins on conflict. Working-tree safety; one class per file; no `ConfigureAwait(false)` in tests; scoped compile; stage only files the prompt names.
