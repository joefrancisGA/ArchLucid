> **Scope:** Inventory of review/desk search params that can imply Career vs Rehearsal door or host Mode. **Do not steal** wizard `mode` or clone `intent`. CG-013 owns the resolver.

> **Spine:** ADR **0091** · ADR **0086** · CG-011 · CG-013

# Career-gravity URL/query door inventory

**Last reviewed:** 2026-09-11

`?career=1` on a Simulator run is screenshot fraud. Deep links must not launder rehearsal into unlabeled Career chrome.

Resolver: `archlucid-ui/src/lib/governance/working-career-rehearsal-door-query.ts`. Vitest: `working-career-rehearsal-door-query.test.ts`. Working overlay is chrome-only (no PUT, no localStorage write from the query).

## Door-implying keys (honored)

| Key | Example | Parse | Notes |
|-----|----------|-------|-------|
| `workingCareerRehearsalDoor` | `?workingCareerRehearsalDoor=rehearsal` | `career` / `rehearsal` | Same tokens as UserSettings |
| `workingDoor` | `?workingDoor=career` | `career` / `rehearsal` | Short alias |
| `door` | `?door=rehearsal` | `career` / `rehearsal` | First explicit key that parses wins after the two above |
| `career` | `?career=1` | truthy or `career` | Screenshot-fraud exhibit |
| `rehearsal` | `?rehearsal=1` | truthy or `rehearsal` | Wins over `career` when both flags are set |

## Not door (do not honor as Career chrome)

| Key | Used for | Why ignored |
|-----|----------|-------------|
| `mode` | New-run wizard (`quick` / `full`) and replay validation | Not Career/Rehearsal |
| `reviewMode` | Governance review URL | Not execute door |
| `replayMode` | Compare replay | Not execute door |
| `graphMode` | Evidence graph scope | Not execute door |
| `mermaidMode` | Infra diagrams | Not execute door |
| `inputMode` | Policy pack authoring | Not execute door |
| `intent` | `revised-clone` continuation | Not a door token |
| `executionMode` | Would look like host Mode | **Do not flip** `AgentExecution:Mode` (no G-REAL-06) |

## Honesty rule (Working)

| Query wants | Structural `AgentExecution:Mode` | Overlay |
|-------------|-------------------------------------|---------|
| none | any | Stored door (CG-011) |
| Rehearsal | any | Rehearsal (labeled) |
| Career | `Real` | Career overlay (chrome only) |
| Career | `Simulator` or unknown | **Ignore** — stored door unchanged; cannot mint unlabeled Career |

Guided: query is not applied (AS-081).
