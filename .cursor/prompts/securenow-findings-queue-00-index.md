<!-- SecureNow findings queue — Composer prompts.
     Origin: 2026-09-24 owner screenshot of /compliance/findings?architectureId=customer-intake
     rendering the ArchLucid Working architecture desk.
     Do not implement from this index. -->

# SecureNow findings queue — Composer prompt set (SN-FQ-01–SN-FQ-04 + hold)

`/compliance/findings` is the SecureNow findings queue. It must not become the ArchLucid Working architecture document when a sample slug such as `customer-intake` is on the query string.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/securenow-findings-queue-0N-*.md` file per session.

Wave doc: [`docs/architecture/SECURENOW_FINDINGS_QUEUE_COMPOSER_PROMPTS.md`](../../docs/architecture/SECURENOW_FINDINGS_QUEUE_COMPOSER_PROMPTS.md).

## Diagnosis → prompt

| # | Concern | Prompt | What moves |
|---|---------|--------|------------|
| 1 | Working + `architectureId` inhabits SecureNow and calls seal-delta | **SN-FQ-01** | Inhabit gate, desk-continuity rewrite, seal-delta mount, desk CTA |
| 2 | Header still speaks architecture reviews | **SN-FQ-02** | Layer guidance, title, subtitle, claim, capability boundary |
| 3 | Empty register falls through to authority reviews | **SN-FQ-03** | `fetchGovernanceFindingQueueRows` Security branch, empty copy |
| 4 | No lock against the screenshot | **SN-FQ-04** | Vitest ratchet |
| 5 | Temptation to accept slugs on seal-delta or delete IH-016 | **SN-FQ-HOLD** | Written hold |

## Run order

**SN-FQ-01** first. **SN-FQ-02** and **SN-FQ-03** in parallel after 01. **SN-FQ-04** after 01–03. **SN-FQ-HOLD** is not implementation.

## Product vs company (every prompt)

- **SecureNow** = Security product shell (`productLine === "security"`).
- **ArchLucid** = Architecture product. Nested findings document stays IH-016.
- `customer-intake` stays the Architecture sample slug. Do not invent a SecureNow architecture with that id.

## Global constraints (every prompt)

- **Do not** change `[HttpGet("{architectureId:guid}/seal-delta")]`.
- **Do not** remove inhabit chrome from `/architecture/architectures/{architectureId}/findings`.
- Working-tree safety before editing a tracked file. Stage only named paths. **No `git add -A`.**

## After each prompt

Summarize: files changed, tests run, Security `/compliance/findings` strings that moved, and confirmation that Architecture nested findings still inhabit.
