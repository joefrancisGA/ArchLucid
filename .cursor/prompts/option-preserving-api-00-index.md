<!-- Option-preserving API split — paste one prompt per session.
     Origin: 2026-09-10 owner agreement: preserve a future SecureNow API host
     by carving capability modules first. Do not implement from this index. -->

# Option-preserving API split — Composer prompt set (OP-01–OP-08)

Keep **one** `ArchLucid.Api` and **one** SQL catalog until a second web project would **fail to compile** if it referenced Architecture-only code. Product line today is UI composition (`NEXT_PUBLIC_ARCHLUCID_PRODUCT`) plus `archlucid-ui/src/lib/product-line/product-line-catalog.ts`. Predecessor hold: [`.cursor/prompts/product-line-05-one-api-hold.md`](product-line-05-one-api-hold.md) (**PL-05**). This set is how to reopen that hold **without** cloning `Application` + `Persistence`.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/option-preserving-api-NN-*.md` file per Composer / Cloud Agent session.

Copy-paste docs index: [`docs/architecture/OPTION_PRESERVING_API_SPLIT_COMPOSER_PROMPTS.md`](../../docs/architecture/OPTION_PRESERVING_API_SPLIT_COMPOSER_PROMPTS.md).

## Diagnosis → prompt

| # | Concern | Prompt | What moves |
|---|---------|--------|------------|
| 1 | No capability cut exists | **OP-01** | JSON map of every API controller (+ Application namespace clusters) |
| 2 | Map will rot; god-assembly leakage grows | **OP-02** | Architecture tests + NetArchTest ratchet |
| 3 | API does not know which product called | **OP-03** | Host deployment + optional product-line header; no required field |
| 4 | Security clients can still hit Architecture routes | **OP-04** | 403 gate from the OP-01 map |
| 5 | Composition is one blob | **OP-05** | Omit-able registrars; host still calls all of them |
| 6 | Worker ownership is unnamed | **OP-06** | Hosted-service capability inventory (still one Worker) |
| 7 | Temptation to add `SecureNow.Api` now | **OP-07** | Hold: second host only as a compile check after 01–06 |
| 8 | Temptation to split SQL now | **OP-08** | Hold: catalog last; do not reopen ADR 0037 |

## Run order

**OP-01** first. **OP-02** immediately after (same branch). **OP-03** then **OP-04** (gate needs the signal and the map). **OP-05** and **OP-06** in parallel after 02. **OP-07** / **OP-08** are holds — paste only if a session starts a second `Program.cs` or a second DDL file.

| Prompt | Parallel? | Depends on | Do not fork |
|--------|-----------|------------|-------------|
| **OP-01** | First | PL-05 still in force | Moving `Application` folders; new csproj |
| **OP-02** | After 01 | Map JSON from 01 | Deleting current namespace leaks; “fix” by widening allowlist forever |
| **OP-03** | After 01 | `ProductLineId` in Core | Required OpenAPI field; renaming `X-ArchLucid-*` |
| **OP-04** | After 02+03 | Map + signal | 403 on `both` / `disputed` / health / OpenAPI |
| **OP-05** | After 02 | Existing `Startup/Modules` | Second composition root; skipping registrars in `Program` |
| **OP-06** | After 01; parallel with 05 | Hosted-service types | Second Worker project |
| **OP-07** | Hold | OP-01–06 complete | `ArchLucid.Host.Security` / `SecureNow.Api` |
| **OP-08** | Hold | Named integration contract | Second `ArchLucid.sql`; RLS revival |

## Global constraints (every prompt)

- Working-tree safety: `.\scripts\agent\check-working-tree-path.ps1 -Path <file>` before editing tracked files.
- Commit only on a named feature branch (`cursor/<short-name>-3024` in Cloud Agent runs, or the branch the owner names). Do **not** use two long-lived git branches as the two products.
- **Do not** add a second Next.js app, a second .NET HTTP host, a second Worker, or a second migration set unless the owner **explicitly** reopens **OP-07** or **OP-08** in that session (quote the reopen).
- **Do not** change INV-006 allow-list to move DI into `ArchLucid.Api` or domain projects.
- **Do not** reopen ADR 0037 (RLS) or split tenant catalogs by product line.
- **Do not** fork finding engines, collectors, or coverage-shaped engines.
- **Do not** hide desktop review tabs behind **More**.
- **Do not** add GTM **M-90 / M-44 / M-91 / M-92** or reopen **TB-135** / **TB-136**.
- One class per file. No `ConfigureAwait(false)` in tests. Prefer concrete types over `var`. Null-check. Blank line before `if` / `foreach` unless first in the method.
- Verification: scoped `dotnet test` on `ArchLucid.Architecture.Tests` and the test project the prompt names. Do not run full-solution `dotnet test`.
- Stage only files the prompt names. Do not shuffle `product-line-catalog.ts` hrefs in an OP session.
- Claim discipline: this work does **not** mean SecureNow is a separate platform, CPA SOC 2 exists, or a third-party pen test is published.

## After each prompt

Summarize: files changed, tests run, whether **one API + one catalog** still holds, disputed map rows remaining, and which prompt is next.
