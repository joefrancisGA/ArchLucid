# SN-COL-04 — Run now and schedule

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`

**Depends on:** SN-COL-03 and the accepted SN-COL-01 ADR.

## Goal

The Collection agent page shows the agent's schedule and offers **Run now**, which triggers one on-demand run through exactly the mechanism the accepted ADR chose.

## Read first

- The accepted SN-COL-01 ADR, sections on the on-demand run and permissions. It overrides this prompt wherever they differ.
- SN-COL-02 services and SN-COL-03 page
- `docs/library/UI_DESIGN_SYSTEM.md` § Button variant/color matrix

## What to build

- **Interface:** `ICollectionRunTrigger`, with one implementation for the mechanism the ADR chose (for example a storage queue message, or starting the agent job with the narrowly scoped role the ADR named). No second mechanism.
- **API:** `POST /v1/collection-runs:trigger`, execute authority, scoped, idempotent for a short window so a double click does not start two runs. It returns the pending run id. Audit the trigger with the actor.
- **Schedule:** show the schedule the agent last reported in its manifest, read-only. Do not edit the schedule from SecureNow.
- **UI:** an outline `Run now` button on the Collection agent page. While a run is pending or running, the button is disabled and the page shows the pending run at the top of the table. The page refreshes the run list on an interval while a run is in progress, then stops.
- A failed trigger shows the API reason inline. It does not use a toast for a known validation case.

## Tests

1. Trigger returns a run id and writes an audit entry with the actor.
2. A second trigger inside the idempotency window returns the same run id.
3. A caller without execute authority gets 403.
4. The button is disabled while a run is pending or running.
5. The trigger implementation never calls an ARM write API other than the one the ADR permits.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One class per file. Explicit types over `var`. Null-check inputs. No `ConfigureAwait(false)` in tests.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Api/ArchLucid.Api.csproj'`
- Regenerate contracts through the repo scripts. Do not hand-edit the JSON.
- From `archlucid-ui`, run the Vitest files you touched and `npx tsc --noEmit -p tsconfig.json`.
- Do not commit.

## Done when

A security architect can press Run now, see the run appear as pending, watch it finish, and see the agent's schedule, with SecureNow holding no permission beyond what the ADR allows.
