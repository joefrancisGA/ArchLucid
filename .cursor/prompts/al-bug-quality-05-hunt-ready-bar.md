# ABQ-05 — Raise the `/al-bug` hunt-ready and fix-quality bar

**Docs/commands only.** Do not change picker scoring formulas here (ABQ-06) and do not split zones (ABQ-08).

## Goal

A hunt-ready row requires **Reachability** in addition to locus / input / wrong outcome / mechanism. A fix may not append one instance to an open-ended keyword or phrase list. Guard-type code (redaction, validation, authz) treats the **conservative** failure mode as `valid-no-repro` unless a real caller or attacker-controlled input is cited.

## Why

The current bar in `.cursor/commands/al-bug.md` §1.1b allows `beefAccessKey` because it is a concrete input that takes a branch. Nothing requires that ARM, config, OpenAPI, or UI ever emit that string. Combined with “minimal diff,” agents ship one allowlist row per hunt. Sequential `/al-bug` then treats hit rate as success (Goodhart).

## Context

Edit all of:

- `.cursor/commands/al-bug.md` — §1.1b, §1.1c, Phase 2, Phase 4 result table if a new field is needed
- `.cursor/skills/al-bug/SKILL.md` — hunt-ready paragraph must match the command (skill is the short pointer; do not diverge)
- `docs/library/AL_BUG_HUNT_LEDGER.md` — § Hypothesis tags and the “How to use” hit/dry rules; keep historical rows
- `.cursor/commands/al-bug-api.md` — one-line pointer that API hunts use the same 1.1b bar (do not rewrite the API command)

Do **not** edit `scripts/agent/al-bug-pick-zone.ps1` in this prompt.

## What to build

1. **Hunt-ready table** gains a fifth required field:

| Field | Required |
| --- | --- |
| **Reachability** | Cite where the input originates: a real ARM/Terraform property, a config path in this repo, an OpenAPI payload, a UI action, or an attacker-controlled trust-boundary string. Constructed literals without that citation stay `(candidate)` or `(invalid)`. |

2. **Fix-generality (Phase 2):** a shippable fix must close a **class** of inputs. Forbidden as the entire fix: appending one string to a keyword/phrase/allowlist so a single new theory case passes. If the mechanism is substring or phrase matching, either change the mechanism (point to ABQ-01/04 as the pattern) or close the row `(valid-no-repro)` and optionally note a design TB item — do **not** invent a `TB-###` number unless the owner asked.
3. **Failure direction** for guards (redaction, validation, authz, schema readers):
   - Fail-closed / over-redact / reject malformed → usually `(valid-no-repro)`
   - Fail-open / leak / accept malformed as success → eligible hunt
   - Severity must name the user-visible harm (secret in summary, cross-tenant 200, committed bad manifest). “Test disagreed with an allowlist” is not medium/high.
4. Cheap-disproof §1.1c adds step 5: **Reachable?** No citation → `(invalid)` or leave `(candidate)`.
5. Result table: keep Kind/Outcome. Add a one-line reminder that low-severity sequential hits must not auto-push (ABQ-07 owns the script; here just tell the agent to stop and report instead of pushing if the only fix is an instance list).
6. Replacement hypotheses after a miss still need a **different mechanism**, now plus reachability.

## Acceptance criteria

- Command, skill, and ledger how-to agree on five hunt-ready fields.
- A reviewer can reject `beefAccessKey` as not hunt-ready using only the updated 1.1b text.
- No picker formula change in this PR.

## Constraints

- Do not mass-retcon existing ledger `(proven)` rows (ABQ-10 samples them).
- Do not implement scoring cooldown here.
- Do not run `/al-bug`.
- Working-tree safety on the four tracked doc/command files.
