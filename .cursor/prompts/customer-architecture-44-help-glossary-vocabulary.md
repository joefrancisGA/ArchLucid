# CA-44 — Help, glossary, and concept vocabulary

**Do not** call a draft a sealed record. **Do not** rewrite ADR 0068.

## Goal

Customer-facing and contributor nouns match ADR 0074:

1. `docs/library/GLOSSARY.md` — **Architecture** is the named durable identity; **Architecture draft** is a child; **Architecture review** is a governed evaluation.
2. `docs/library/CONCEPT_VOCABULARY.md` — reject “architectures list = drafts.”
3. In-app help topic(s) on `/help` that still say the Architectures workspace **is** the draft editor — rewrite for Working; Guided teaching can stay labeled Guided.
4. `docs/architecture/architecture_review_object_model_assessment.md` — add a **2026-09-05 supersede note** at the top: Hypothesis B is stale for Working; do **not** rewrite the July body (archive-style honesty).

## Why

Docs that teach the old object model will recreate the SPA lie in the next assessment.

## Context

- GLOSSARY architecture draft row
- `PRODUCT_DOCUMENTATION_PRESENTATION.md` — in-app help, not GitHub blob links
- ADR 0074

## What to build

1. Doc + help copy updates.
2. A small vocabulary test if one already pins the old glossary sentence.
3. No product code except help content modules.

## Acceptance criteria

- Glossary cannot be read as “Architectures workspace = only drafts” without a Guided qualifier.
- July assessment is marked stale for the “do not add Architectures nav” line **on Working**.

## Constraints

- TB-645. No GitHub blob links in customer help.
- Do not implement GTM cohorts.
