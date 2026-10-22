# LK-14 — Stamp names the measurement denominator

**Do not fork SD-03 / CR-10** inventory or CI guard. **Do not fork IS-06** classification counts. **Do not add a 40th engine.** This file is the leftover **career surface**: the stamp / print / JSON the architect takes into the ARB must say how much of the built-in engine catalog was **measured** on the career corpus vs listed absent.

## Goal

Working sealed-record stamp (and the print/PDF/JSON that reuse it) includes one honest denominator line: registered harness engine count vs catalog size, plus that absent engines are listed in the quality inventory (link to in-app help or the existing miss-clause topic — not a GitHub blob). Do not imply unmeasured engines ran. Do not hide checklist vs Decision-grade counts (IS-06).

## Why

A package can look Decision-grade after ADR 0070 and still be bounded by a 16-engine slice. If the stamp is silent, sponsors screenshot certainty. R4 requires the architect to see the floor.

## Context

- `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md` corpus-limit paragraph
- `docs/quality/insight-density-engine-distribution.md`
- Stamp / print / sponsor export formatters (IS-06 / CD-05)
- `BuiltInFindingEngineTypeCatalog` vs `CreateEngines()` length
- Help topic presentation (`PRODUCT_DOCUMENTATION_PRESENTATION.md`) — in-app `/help/{topic}` only

## What to build

1. Single helper that formats the denominator from committed catalog/harness counts (CR-10 / SD-03 sources, or a generated constant those owners already pin). Do not hand-edit a stale “16 of 39” in three formatters.
2. Stamp + print + JSON include the line. CLI grade dump if SD-12 leftover still overclaims Ready.
3. Vitest: Working stamp fixture contains the denominator; does not say unmeasured engines were scored.
4. If CR-10 / SD-03 have not landed, still format counts from the same catalog/harness sources those files name; do not invent engines.

## Acceptance criteria

- An architect can answer “how much of the engine catalog is this stamp based on?” from the artifact without opening Decisioning tests.
- No GitHub blob links in customer chrome.

## Constraints

- Do not change demotion behavior.
- Do not check in fake frontier transcripts.
