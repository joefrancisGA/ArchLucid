<!-- Understand and use, wave B — Luna prompts. Paste one numbered file per session.
     Origin: 2026-09-26. Empty-state actions, scope, evidence labels, status
     explanations, readiness, saved views, finding actions, snapshot compare,
     diagram legend, and visible queue shortcuts.
     Do not implement from this index. -->

# Understand and use — Luna prompt set (UU-11–UU-20)

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/understand-use-1N-*.md` file per GPT-5.6 Luna session.

Canonical wave doc: [`docs/architecture/UNDERSTAND_USE_WAVE_B_LUNA_PROMPTS.md`](../../docs/architecture/UNDERSTAND_USE_WAVE_B_LUNA_PROMPTS.md).

Wave A is [`understand-use-00-index.md`](understand-use-00-index.md). Do not redo UU-01–UU-10 here.

## What this set changes

| Step | From | To | Prompt |
|------|------|----|--------|
| **Empty start** | Some empty screens describe the gap and stop. | Three empty screens offer one existing start action. | **UU-11** |
| **Scope crumbs** | Path rows name a finding without the snapshot scope. | Subscription, resource group, and snapshot sit above the result when those labels already exist. | **UU-12** |
| **Evidence badges** | Provenance words differ by surface. | One helper renders the existing provenance labels, with a one-line meaning. | **UU-13** |
| **Status why** | Status chips name a state and stop. | Selected chips open one sentence that says why that state is showing. | **UU-14** |
| **Readiness list** | Start review has three checklist steps. | Missing evidence, scope, and unresolved inputs are listed before analysis. | **UU-15** |
| **Saved views** | Path filters are rebuilt by hand. | Named views for exposure, privilege, shared controls, and insufficient evidence live in the URL. | **UU-16** |
| **Action shape** | Advisory remediation is a block of prose. | Problem, evidence, consequence, change, owner, and verification are labeled lines. | **UU-17** |
| **Path compare** | Drift compare is property-level. | Two snapshots also list new, removed, and changed paths. | **UU-18** |
| **Diagram legend** | The canvas does not say what a box or a line means. | Three questions sit under the diagram and answer from the selected mode. | **UU-19** |
| **Queue keys** | Next and previous already exist as shortcuts. | The queue shows those keys, plus open evidence, open remediation, and return. | **UU-20** |

## What this set does not change

Do not hide review workspace tabs. Do not add a numeric confidence. Do not call Azure write APIs. Do not add a collector. Do not rename provenance enum values. Do not treat Configured diagram currency as an observed fact.

## Run order

The sessions are independent. **UU-13** before **UU-14** when both will land, so status copy uses the shared evidence labels. **UU-17** can follow **UU-09** if that block exists. Do not revert another UU change that has already landed.

Each implementation prompt ends **before commit**. The owner looks, then says whether to commit.

## Prompt files (paste one per session)

| # | File | Branch to create |
|---|------|------------------|
| 11 | `understand-use-11-empty-start-here.md` | `uu/11-empty-start-here` |
| 12 | `understand-use-12-scope-breadcrumbs.md` | `uu/12-scope-breadcrumbs` |
| 13 | `understand-use-13-evidence-badges.md` | `uu/13-evidence-badges` |
| 14 | `understand-use-14-status-why.md` | `uu/14-status-why` |
| 15 | `understand-use-15-review-readiness.md` | `uu/15-review-readiness` |
| 16 | `understand-use-16-saved-views.md` | `uu/16-saved-views` |
| 17 | `understand-use-17-finding-action-shape.md` | `uu/17-finding-action-shape` |
| 18 | `understand-use-18-snapshot-path-compare.md` | `uu/18-snapshot-path-compare` |
| 19 | `understand-use-19-diagram-legend.md` | `uu/19-diagram-legend` |
| 20 | `understand-use-20-queue-shortcuts.md` | `uu/20-queue-shortcuts` |

## Wave C (UU-21–UU-30)

Paste from [`understand-use-c-00-index.md`](understand-use-c-00-index.md). Do not implement wave C from this file.
