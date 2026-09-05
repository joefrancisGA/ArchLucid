# CR-03 — Historical density prompts are not current-tense product contract

**Do not fork IS-05** (gate). **Do not fork SD-01** (library / quality docs). **Do not re-run ID-01–11.** This file is leftover **engineering prompt docs** that still describe `typed-engine-protected` always Promote as if it were today’s production behavior.

## Goal

Shipped insight-density and weakness-remediation Composer prompt files that speak in **present tense** about the Promote short-circuit get a one-line **Superseded by ADR 0070 / IS-05** banner (or equivalent Status line). Historical *why we measured first* stays. Agents must not re-implement the bypass from those files.

## Why

A later agent (or assessor) reading `INSIGHT_DENSITY_COMPOSER_PROMPTS.md` will treat “scores remain advisory — typed-engine-protected bypass is unchanged” as the contract and undo the livelihood gate. Stale present tense is a career-defense failure.

## Context

- `docs/architecture/INSIGHT_DENSITY_COMPOSER_PROMPTS.md` (Status: scores remain advisory)
- `docs/architecture/INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md` (do not remove typed-engine-protected)
- `docs/architecture/WEAKNESS_REMEDIATION_COMPOSER_PROMPTS.md` (WK density item still present-tense bypass)
- `docs/architecture/adrs/0070-insight-density-controls-typed-engines.md` — **do not change Status** (SD-02)
- `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md` — already names production demotion; cite it

## What to build

1. Inventory those three files (and grep `docs/architecture/*COMPOSER*.md` excluding archive) for present-tense “always Promote” / “bypass is unchanged” / “do not change typed-engine-protected” **as current instruction**.
2. Add a Status / Superseded banner at the top of each stale *current-tense* section. Do not rewrite the original ID-01 measurement story.
3. Leave ID-11 honesty prompts labeled historical. Point new work to IS-05 / SD-01 / CR-01.
4. Do not edit `.cursor/prompts/insight-density*` if those files are archive-only; banner the architecture docs agents actually load.

## Acceptance criteria

- An agent reading the ID prompt Status line is told the Promote short-circuit is superseded and must not be reintroduced.
- ADR 0070 body and Status are untouched.
- Gate method untouched.

## Constraints

- Do not rescore `LATEST_GPT55.md`.
- Do not capture frontier transcripts.
- Do not add a 40th engine.
