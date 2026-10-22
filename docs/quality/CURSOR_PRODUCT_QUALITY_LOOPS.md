> **Scope:** Owner and coding-agent guidance for product-quality work in Cursor once feature and backlog loops plateau — not a buyer-facing attestation, scorecard, or release gate.

# Cursor product-quality loops beyond the backlog

**Captured:** 2026-08-20.

The existing Cursor loops (assessment-driven backlog, `/ship-next-improvement`, `/al-ui-rate-lowest`, `/al-bug`, `/lucid-ui-audit`, coverage and faithfulness gates) still help. They mostly raise **engineering completeness**. Remaining product quality is different: **would a skilled architect trust the review enough to change a decision?**

The v3 scorecard in `docs/assessments/LATEST_GPT55.md` already points there. The weakest weighted pillars have been **decision-changing insight**, **defensibility vs frontier AI**, **time-to-value**, and **proof of ROI** — not adoption friction or test coverage.

## 1. Grade the product’s actual output, not the screens

Have Cursor sit as a principal architect and score a **real review package** (findings, evidence, sponsor summary, export):

- Would this change a decision a skilled person would otherwise miss?
- Which findings are true but useless?
- Which claims would get dismissed as generic frontier-AI output?
- What is missing that would make someone *act*?

Architect-evaluation packets and dismissal codes already exist under `docs/go-to-market/Architect_Evaluation/`. The unused move is to run that critique **on live or simulator packages every week**, then only ship prompt, pack, or UI changes that raise those grades.

This is the highest-leverage quality work left in the product.

## 2. Shadow-architect bake-off

Give Cursor the same architecture packet twice:

1. As a skilled architect using frontier AI with no ArchLucid.
2. As a reviewer of ArchLucid’s governed package.

Ask only: **what did ArchLucid add that the solo session did not?** Policy mapping, evidence chain, exception path, auditability, a finding the solo pass missed. If the delta is thin, that is a product-quality bug even when the UI scores well.

## 3. Live first-session, not screenshot audits

`/lucid-ui-audit` and route rating catch visual and copy drift. They do not catch *belief*.

Use the browser agent as a first-time operator and time the canonical first-run path (`docs/library/CANONICAL_FIRST_RUN_PATH.md`). Stop at the first moment of “I don’t know what to do next,” “I don’t trust this number,” or “this looks like a demo.” Those pauses are quality defects. Screenshot scoring rarely finds them.

## 4. Quality by subtraction

A lot of remaining friction is **too many surfaces**, not missing ones. Ask Cursor to find:

- Duplicate next actions on the same page
- Help or vocabulary rails that restate the obvious
- Routes nobody needs on the golden path
- Findings that fire but never change a decision
- Policy packs that exist but rarely produce useful hits

Deleting or collapsing those often improves perceived quality more than another polish pass.

## 5. Failure-state quality

Happy-path UI is already mature. Ask Cursor to walk **broken** states as the product:

- Extractor ZIP incomplete
- Model quality-gate reject / retry / tier escalate
- Empty tenant, first review, no evidence
- Permission denied vs not found
- ITSM / Slack / Teams failure
- Stale vs live ROI
- Simulator vs real-mode mismatch

Operators judge quality here more than on the polished demo path.

## 6. Honesty and overclaim pass

A large buyer-demo defect set already shipped. The leftover risk is quieter: copy that *implies* CPA SOC 2, third-party pen test, live proof, or perfect faithfulness.

A useful recurring prompt: **“List every sentence a skeptical CISO or procurement reviewer could call misleading.”** Score help, sponsor export, trust center, empty states, and ROI labels — not just nav vocabulary.

Do not treat closed tech tracking for SOC 2 CPA (**TB-135** / **G-REAL-05**) or third-party pen test (**TB-136** / **G-ASSURANCE-02**) as published artifacts. Buyer docs must not imply those exist unless they actually do.

## 7. Finding-quality eval as a product loop

Nightly real-mode evals and faithfulness gates already exist. Cursor can still do work those gates do not:

- Label findings as *decision-changing / true-but-noise / generic / unsupported*
- Compare live packages against frozen exemplars after a model rev
- Propose prompt or pack changes only when a labeled finding class improves
- Flag the live-vs-nightly tripwire in `docs/library/LIVE_VS_NIGHTLY_FINDING_QUALITY_TRIPWIRE_MAP.md`: offline exemplars can look healthy while production quality quietly drops

This is product QA for the analysis engine, not more unit tests.

## 8. Standing PR quality

On every non-trivial PR, ask for:

- Bugbot-style defect hunt
- Security / tenant-isolation review
- “Would this make the review package less trustworthy?”
- Accessibility as a *journey* (keyboard-only first review), not only axe

That catches quality regressions while they are still small. `/al-bug` hunts zones; this hunts **the change about to ship**.

## 9. Support-ticket simulation

For a route or a completed review, ask: **“Write the 10 tickets a confused operator would file in week one.”** Then fix the top three with copy, empty states, or a single next action. That is often faster than another UX score pass.

## 10. Change the ship loop’s objective

`/ship-next-improvement` and `/al-ui-rate-lowest` will keep finding work until the queue is cosmetic. For a quality plateau, constrain the loop:

- Only ship items that raise insight density, first-review trust, or export credibility
- Refuse UI-only work unless it removes confusion on the golden path
- After N cycles, require a fresh bake-off (section 2) before more polish

Otherwise Cursor will keep optimizing the scorecard already near its ceiling (adoption friction, coverage, visual consistency).

## Default habit

Once a week, pick one real or dogfood review package, have Cursor grade it as a dismissive principal architect, and only then decide what to change. That loop is closer to product quality than another UI-rate or bug-hunt cycle.

Optional follow-up: turn the weekly package grade or the shadow-architect bake-off into a Cursor command (for example `/al-package-grade` or `/al-shadow-architect`) if either becomes the default quality loop.

## Related

| Loop | Where |
| --- | --- |
| Strategic readiness scorecard | `docs/assessments/LATEST_GPT55.md`, `docs/assessments/ASSESSMENT_PROMPT_SERIES.md` |
| First-run path and dismissal codes | `docs/library/CANONICAL_FIRST_RUN_PATH.md`, `docs/go-to-market/Architect_Evaluation/` |
| Finding / RAG quality evidence | `docs/library/AGENT_OUTPUT_EVALUATION.md`, `docs/quality/faithfulness-report.md`, `docs/quality/agent-quality-dashboard.md` |
| Live vs nightly finding-quality tripwire | `docs/library/LIVE_VS_NIGHTLY_FINDING_QUALITY_TRIPWIRE_MAP.md` |
| UI rate / lowest-route / screenshot audit | `.cursor/commands/al-ui-rate-lowest.md`, `.cursor/skills/lucid-ui-audit/SKILL.md` |
| Zone bug hunt | `.cursor/commands/al-bug.md` |
| Backlog ship loop | `.cursor/skills/ship-loop/SKILL.md` |
