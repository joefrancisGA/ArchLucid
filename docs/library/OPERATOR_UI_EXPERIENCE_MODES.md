> **Scope:** Next.js architect workspace experience flags (`NEXT_PUBLIC_*`) — documents buyer-default vs full architect workspace only, not API auth or backend behavior.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Architect workspace experience modes

**Audience:** Deployers wiring `archlucid-ui` for pilots or production.

**Legacy filename / env:** doc path and `NEXT_PUBLIC_OPERATOR_EXPERIENCE` keep the historical `operator` identifier; product language is **architect workspace**.

## Production default: Working desk (TB-643 history)

**Production identity (2026-09):** authenticated **Working** seats on env-unset builds use **dense architect-workspace chrome** via `resolveProductionDeskChrome()` / `useProductionDeskChrome()`. Demo, static showcase, frictionless trial, and **Guided** mode use eval/teaching chrome via `resolveProductionEvalChrome()`.

`isBuyerPolishedOperatorShellEnv()` is **false** on production Working builds (PT-01). It remains **true** only for demo, static-showcase, and frictionless trial — not for Guided mode (Guided uses workspace mode via the production desk resolver).

**TB-643 history:** deploy docs previously described buyer-oriented chrome as the production default before Working desk landed. Vocabulary (TB-645) stays buyer-polished on all customer surfaces regardless of density.

## Buyer-default shell (omitted `NEXT_PUBLIC_OPERATOR_EXPERIENCE`)

When **`NEXT_PUBLIC_OPERATOR_EXPERIENCE`** is **unset** or not equal to `operator`, production **Working** seats get architect-workspace density (shortcut chips, nav metadata, identifiers behind disclosures) without setting this flag. **Guided** mode and demo/trial/static builds keep eval/teaching chrome.

**Does not change:** API authorization, RBAC, or progressive disclosure toggles in the sidebar footer (`Show analysis & investigation tools`, `Show governance, audit & admin controls`). Those still gate Operate-layer links per [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md).

## Full architect workspace (`NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`)

Set to **`operator`** (case-insensitive) for **internal** or **power-user** deployments that opt into **engineering chrome**: dense nav metadata, shortcut hints, technical identifiers, COGS/telemetry surfaces, and LLM budget admin widgets. **Buyer-polished vocabulary remains the default** even with this flag — it does not revert labels to raw run/manifest jargon (see **TB-645** for the vocabulary pass).

Local `next dev` sets this in **`archlucid-ui/.env.development`** so engineers keep the historical full-workspace layout.

## Demo / static showcase builds

**`NEXT_PUBLIC_DEMO_MODE`** and **`NEXT_PUBLIC_DEMO_STATIC_OPERATOR`** still force **buyer-polished** chrome and curated static payloads where documented. They are independent of `NEXT_PUBLIC_OPERATOR_EXPERIENCE`: demo builds stay buyer-safe, and production operator builds no longer need demo flags for buyer-default language (TB-643).

## Working-mode architect chrome (production default)

**Working** workspace mode unlocks dense architect-workspace chrome on production builds without setting `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`: shortcut chips, denser nav metadata, and technical identifiers behind existing disclosures. Guided mode and all demo / trial / static-showcase flags keep buyer-polished chrome.

Implementation: `resolveArchitectWorkspaceChrome()` / `useArchitectWorkspaceChrome()` in `archlucid-ui/src/lib/architect-workspace-chrome.ts`.

## Guided vs Working workspace mode

Personal preference stored in `dbo.UserSettings` (`WorkspaceMode`). **Missing/null server values default to Working** (repeat-professional default).

| Mode | Behavior |
|------|----------|
| **Working** (default) | Teaching chrome off — Overview leads with the work queue; full authorized nav unlocks even before first commit; dense architect chrome on production builds; Getting started demoted from main nav. **Career / Rehearsal door** chooser in the operator top bar (`WorkingCareerRehearsalChooser`) — explicit execute intent for livelihood gravity (ADR 0086 / AS-077+). New first-run Working tenants default to **Career** (AS-080); legacy Simulator clones grandfather **Rehearsal**. **Working is not an `/al-ui-rate` buyer-confidence target** — that command rates Working screenshots as an all-day instrument (ADR 0080 / WS-07). |
| **Guided** | Teaching chrome on — tours, first-finding strips, shortcut coaches, Where to go next strips, sample reviews on Overview when enabled. Live architecture packages only. **No Career / Rehearsal chooser** — Guided keeps Simulator teaching and eval hand-holding per ADR 0067/0080 (AS-081 / WS-23). |

Users switch modes in **Account → Preferences → Workspace mode**. After the user's first sealed review, Working-mode users may see a dismissible offer to switch to Guided for teaching chrome — never an auto-switch.

API: `GET /v1/user/preferences` returns `workspaceMode` and `workspaceModeGraduationOffer`; `PUT /v1/user/preferences/workspace-mode` and `PUT /v1/user/preferences/workspace-mode-graduation-offer` persist changes.

Frontend: `WorkspaceModeProvider` in `archlucid-ui/src/app/layout.tsx`; `useTeachingChromeVisible()` gates teaching surfaces.

**WS-23 ratchet:** `resolveProductionEvalChrome()` must stay **true** for Guided, demo, static showcase, and frictionless trial; production **Working** must stay **false**. Vitest: `production-desk-chrome.test.ts`, `*.working-eval-leakage.test.tsx`, and `ArchitecturesHubBuyerChrome.working-eval-leakage.test.tsx`. Working = all-day instrument; Guided = eval teaching product — do not auto-switch modes.

## Working Career vs Rehearsal door (ADR 0086 / AS-081)

The **Career / Rehearsal** segmented control is **Working-only** product chrome — not a host `AgentExecution:Mode` flip and not shown on Guided, demo, static showcase, or frictionless trial seats.

| Door | Execute posture | UI contract |
|------|-----------------|-------------|
| **Career** | Real when available (AS-078 may block with honesty dialog when host is Simulator-pinned or live AI is not ready) | Career artifacts, sponsor/export honesty under ADR 0078 |
| **Rehearsal** | Simulator or Fallback with rehearsal labeling | Teaching and dry-runs — cannot screenshot as career-ready (AS-079) |

**Guided split (AS-081):** `WorkingCareerRehearsalChooser` returns `null` when `isWorkingWorkspaceMode(mode)` is false. Guided screenshots and teaching flows keep Simulator coaching without requiring the Career door. Vitest ratchet: `working-career-rehearsal-guided-split.test.ts`. C# ratchet: `ArchitectureSpineAs081GuidedKeepsSimulatorTeachingArchitectureTests`.

**Account persist (CG-011):** GET `/v1/user/preferences` returns `workingCareerRehearsalDoor` and `workingCareerRehearsalDoorIsExplicit`. `PUT /v1/user/preferences/working-career-rehearsal-door` stores an explicit Working pick in UserSettings. Working reads the server first when the row is explicit; `localStorage` is interrupt recovery only. Guided does not PUT this field.

**Cross-tab (CG-012):** Sibling Working tabs share the door on the LW-083 `archlucid.session.idle` bus. Receivers patch chrome only — no second PUT and no draft CAS.

**Share URL (CG-013):** `?career=1` (and `door` / `workingDoor` / `workingCareerRehearsalDoor`) cannot mint unlabeled Career chrome when structural execute is Simulator. Rehearsal query overlays stay labeled. Query never PUTs. Inventory: [`CAREER_GRAVITY_URL_QUERY_DOOR_INVENTORY.md`](../architecture/CAREER_GRAVITY_URL_QUERY_DOOR_INVENTORY.md).

**New tenant (CG-014):** unset GET and empty-browser first-run Working default to **Career**. Implicit GET does not PUT. Legacy Simulator usage signals still grandfather **Rehearsal** (banner is CG-015). Host `AgentExecution:Mode` stays Simulator.

**Simulator clones (CG-015):** local/dev hosts with `AgentExecution:Mode=Simulator` keep Working usable and obviously **Rehearsal**. A persistent shell banner (`WorkingSimulatorCloneRehearsalBanner`) labels the clone as rehearsal — not a sample workspace and not Guided teaching. Effective execute chrome is Rehearsal. Explicit Career still uses AS-078 blocked honesty (no silent Career execute, no auto-switch to Guided, no host Mode flip). AOAI-less clones must not mint career packets.

**Execute posture stamp (CG-019):** First execute writes `workingCareerRehearsalDoor` and `executePostureCapturedUtc` onto the run header (plus existing `structuralExecutionMode`). Career honesty reads the **stamp**, not a later chooser change. A Rehearsal execute cannot later look like Career because the operator moved the door. Host `AgentExecution:Mode` stays Simulator. Full export block is CG-022.

**Career finalize gate (CG-021):** Working **Career** door + structural **Simulator** or **Fallback** cannot finalize — server returns a governance block (4xx) and the UI disables the finalize CTA with blocked-honesty copy (no Ready label). **Rehearsal** door on Simulator/Fallback may still seal as rehearsal-incomplete per LP-06; Ready-to-finalize labels stay suppressed (AS-079) even when finalize is allowed. `MapForFinalize` passes the CG-019 door stamp into `CareerArtifactCompletenessValidator`; TS uses `shouldBlockFinalizeForCareerHonesty` for mutation parity.

**Sponsor PDF gate (CG-022):** Working **Career** door + Simulator/Fallback cannot produce an unwatermarked sponsor PDF — `MapForExport` is door-stamp aware (not Mode-assumed banner), `FirstValueReportBuilder` blocks via `CareerArtifactExportCompletenessGate`, and `EmailRunToSponsorBanner` disables download when `evaluateCareerArtifactHonesty` fails. **Rehearsal** door on Simulator may export with rehearsal labeling (LP-06). Demo/sample waiver paths stay off Working Career.

**Package print rehearsal strip (CG-023):** Ctrl+P / Save as PDF on Working Career keeps print enabled but adds a **print-only** rehearsal honesty strip when structural Mode is Simulator/Fallback and the CG-019 door stamp is not career-complete. `PackagePrintPageClient` resolves the stamped door via `resolveCareerArtifactExportHonestyDoorFields`; `PackagePrintRehearsalHonestyStripView` is hidden on screen and visible in print CSS. Repeating page watermarks are CG-041.

**ADR export gate (CG-024):** `GenerateAdrFromRunModal` calls `evaluateCareerArtifactHonesty` with CG-019 door stamp and door-aware `simulatorRehearsalBannerOnArtifact`. Working **Career** door + Simulator/Fallback **hard-blocks** ADR copy/download (no incomplete-export confirm bypass). **Rehearsal** door on Simulator prepends a rehearsal header in the exported Markdown before the `# ADR:` body so rehearsal exports cannot look sealed-Career. ADR vocabulary is unchanged.

**Decision receipt posture (CG-025):** Committed-run decision receipt JSON from `DecisionReceiptService` and the client `decision-receipt-export` helper stamp `structuralExecutionMode`, `workingCareerRehearsalDoor`, and `rehearsalIncomplete` after sealed-hash verification (posture is an export overlay, not part of `receiptHashSha256`). Working **Career** door + Simulator/Fallback remains **blocked** server-side. **Rehearsal** door on Simulator exports with `rehearsalIncomplete: true` so forwarded receipts cannot omit Mode/door.

**Audit CSV posture (CG-026):** Run-scoped audit CSV (`GET /v1/audit/export/csv?runId=…`) prepends CG-026 `#` honesty comment lines and adds `StructuralExecutionMode`, `WorkingCareerRehearsalDoor`, and `RehearsalIncomplete` columns on every row. Working **Career** door + Simulator/Fallback is **blocked** server-side; **Rehearsal** exports use a `-rehearsal` filename suffix. Audit event rows stay immutable — posture is export overlay only.

**CLI proof-packet posture (CG-027):** `archlucid proof-packet` / `pilot proof-packet` read execute posture from `pilot-run-deltas` (`structuralExecutionMode`, `workingCareerRehearsalDoor`). Working **Career** door + Simulator/Fallback **fails closed** before the ZIP is written. **Rehearsal** door on Simulator stamps `careerPosture: REHEARSAL` (plus Mode/door fields) in `artifact-manifest.json` and the sponsor index so automation cannot archive an unlabeled Simulator bundle as Career.

**Working tests** that assert Career / Rehearsal chrome must mock `useWorkingCareerRehearsalDoor` / `useEffectiveWorkingCareerRehearsalDoor` and set workspace mode to **Working**. **Guided tests** must not require `working-career-rehearsal-chooser` test ids.

**Help (AS-082):** In-app topic [`/help/career-rehearsal-doors`](/help/career-rehearsal-doors) — Rehearsal is practice; Career is the sealed-record path; Simulator output is not sponsor proof.

## Related

- [operator-shell.md](operator-shell.md) — workflow and nav behavior
- [DEMO_FLAGS_AND_UNIT_TESTS.md](../../archlucid-ui/docs/DEMO_FLAGS_AND_UNIT_TESTS.md) — Vitest and demo env pitfalls
- [nav-shell-visibility.ts](../../archlucid-ui/src/lib/nav-shell-visibility.ts) — thin nav surface for **public demo** builds only (not buyer-default production)
