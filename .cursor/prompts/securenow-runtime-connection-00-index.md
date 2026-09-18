<!-- SecureNow runtime declared / observed Data Flow connections — Composer prompts.
     Origin: 2026-09-18 owner (ArchLucid DEV 19 nodes / 0 edges; prefer no Terraform;
     logs/SQL/upload+confirm OK). Do not implement from this index. -->

# SecureNow runtime connections — Composer prompt set (SN-RT-01–SN-RT-10, SN-RT-12–13 + hold)

The ArchLucid DEV Data flow canvas is empty because **Container Apps env is not collected**, SQL catalogs are not parsed, and several RBAC/PaaS types never become Data Flow nodes. Five options: **A** Reader-only ARM, **B** Log Analytics overlay, **C** SQL principal probe, **D** upload + confirm, **E** inference questionnaire.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/securenow-runtime-connection-NN-*.md` file per Composer / Cloud Agent session.

Canonical design: [`docs/securenow/RUNTIME_DECLARED_AND_OBSERVED_DATA_FLOWS.md`](../../docs/securenow/RUNTIME_DECLARED_AND_OBSERVED_DATA_FLOWS.md). Wave doc: [`docs/architecture/SECURENOW_RUNTIME_CONNECTION_COMPOSER_PROMPTS.md`](../../docs/architecture/SECURENOW_RUNTIME_CONNECTION_COMPOSER_PROMPTS.md). Hold: [`docs/library/SECURENOW_RUNTIME_CONNECTION_HOLD.md`](../../docs/library/SECURENOW_RUNTIME_CONNECTION_HOLD.md).

DEV expected picture: [`docs/securenow/ARCHLUCID_DEV_DATA_FLOW_CONNECTION_REFERENCE.md`](../../docs/securenow/ARCHLUCID_DEV_DATA_FLOW_CONNECTION_REFERENCE.md).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays. Do **not** implement G-REAL-06.

## Diagnosis (already closed — do not re-diagnose)

1. Container Apps env (including SQL connection-string **hosts** and KV/blob URIs) is on the ARM GET. `Get-ArchLucidAzureAppSettingHostCompanionRows` only POSTs App Service `config/list`.
2. Parser misses `Initial Catalog=` / `Database=` and bare `https://` URLs. Host index maps SQL FQDN → **server**, not database.
3. Queue / OpenAI User / Search roles return `None`. Cognitive / Search types have no Data Flow stage.
4. DEV SQL auth is in-database Entra users, not `SQL DB Contributor`.
5. Logs and SQL DMVs are **not** declared wiring.

**This is not** AX-DE-18 greenfield (do not add hosted POST). **This is not** SN-PE greenfield (consume the family catalog). **This is not** SN-DF mode creation.

## What this set *does* change

| Option | Bet | From | To | Prompt |
|--------|-----|------|----|--------|
| **A** | Container Apps env | App Service `config/list` only | ARM GET env + `secretRef` names into `app-settings-hosts.json` | **SN-RT-01** |
| **A** | Value parse | `Server=tcp:` + KV SecretUri only | Catalog names + bare HTTPS hosts | **SN-RT-02** |
| **A** | SQL grain | Server host only | Database ARM id when catalog unique; UI FQDN → API app | **SN-RT-03** |
| **A** | PaaS stages/hosts | OpenAI/Search/CS drop | Host index + Data Flow stages when ARM type present | **SN-RT-04** |
| **A** | RBAC allowlist | Queue/OpenAI/Search unknown | Exact built-in names → May access / May read / May write | **SN-RT-05** |
| **B** | Collection | No logs | Opt-in LAW companion, redacted | **SN-RT-06** |
| **B** | Canvas | Would look like declared | Separate **Observed** family + honesty | **SN-RT-07** |
| **C** | DB membership | Invisible | Opt-in `sys.database_principals` names only | **SN-RT-08** |
| **D** | Upload | Terraform show-json exists; no appsettings | Parsers for appsettings.json / `.env` / compose env | **SN-RT-09** |
| **D** | Confirm | Silent inference | Operator confirm → HumanAssertion | **SN-RT-10** |
| **E** | Candidates | `{0}` / unresolved stay blank | Named-rule questionnaire items | **SN-RT-12** |
| **E** | Ask | Silent same-RG guesses | Yes / No / Skip → HumanAssertion | **SN-RT-13** |

## What this set does *not* change

Keep: SN-DF modes, SN-PE families, AX-DE companions (extend rows, do not fork ZIP). Hosted GET-only. Network mode. `flowchart LR` only if Data Flow already uses it.

Do **not** hide desktop review workspace tabs behind **More**. Do **not** persist secret values.

## Run order

**A first:** **01 → 02 → 03.** **04** and **05** after 03 (may parallel each other). **E on top of A:** **12** then **13** (after 03; reuse 10 persist if landed). **B:** **06** then **07** (after A if you want join keys). **C:** **08** anytime after 01 (needs compute principal ids). **D:** **09** then **10** (independent of A; better after 03 so confirm UI can show inventory matches). **11** is a written hold.

Suggested Cloud Agent branch per prompt: `cursor/sn-rt-<short-name>-a7c1`. Implementation sessions use a **new** feature branch per prompt. This prompt-set PR may live on `cursor/runtime-connection-prompts-30fc`.

## Prompt files (paste one per session)

| # | File | Option | Flaw it mitigates |
|---|------|--------|-------------------|
| 00 | `securenow-runtime-connection-00-index.md` | — | This index |
| 01 | `securenow-runtime-connection-01-container-apps-env.md` | A | Env never collected |
| 02 | `securenow-runtime-connection-02-setting-value-parser.md` | A | Catalog + HTTPS dropped |
| 03 | `securenow-runtime-connection-03-sql-catalog-and-fqdn.md` | A | Server-only SQL; UI→API missing |
| 04 | `securenow-runtime-connection-04-paas-hosts-and-stages.md` | A | OpenAI/Search/CS invisible |
| 05 | `securenow-runtime-connection-05-rbac-allowlist.md` | A | Queue/OpenAI/Search RBAC dropped |
| 06 | `securenow-runtime-connection-06-log-analytics-companion.md` | B | No observed collection |
| 07 | `securenow-runtime-connection-07-observed-family.md` | B | Logs painted as declared |
| 08 | `securenow-runtime-connection-08-sql-principals.md` | C | In-DB Entra users invisible |
| 09 | `securenow-runtime-connection-09-uploaded-config-parsers.md` | D | No appsettings/.env ingest |
| 10 | `securenow-runtime-connection-10-confirm-human-assertion.md` | D | Silent upload inference |
| 11 | `securenow-runtime-connection-11-hold.md` | — | Written hold |
| 12 | `securenow-runtime-connection-12-inference-questionnaire-items.md` | E | `{0}` / unresolved never asked |
| 13 | `securenow-runtime-connection-13-inference-questionnaire-ui.md` | E | Questionnaire looks like auto-declared |

## After each prompt

Summarize: files changed, tests run, whether secret **values** are absent from fixtures, whether hosted stayed GET-only, Network mode unchanged, residual risk, SN-RT-HOLD still holds.

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. Visible-boundary `Button` (no ghost/link).
- Plane wins. One Azure collector family. No `terraform apply` / ARM writes.
- Mermaid stays dynamically imported on UI hot paths (`mermaid-import-policy`).
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.
- Implement only *What to build*.
- Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.
