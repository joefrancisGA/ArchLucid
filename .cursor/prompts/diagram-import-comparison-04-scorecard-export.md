# DIC-04 — Accuracy counts and a CSV

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DIC-05 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Diagram import comparison (**DIC**). **Depends on:** DIC-01, DIC-02, and DIC-03 on `master`.

## Goal

The comparison opens with one count strip and a CSV. Inventory-only results are grouped by resource group and type. The denominator says which resources were excluded.

## Why

`DiagramInfrastructureMatcher` appends one InfrastructureOnly row per visible resource. A real subscription fills the table. Week 3 needs a figure and a file a sponsor can forward. `AzureInventoryVisibleSnapshotProjection` and `AzureInventoryNeverShowArmTypes` already drop dashboards, Log Analytics workspaces, DNS zones, and peering child records. The page has to say that, or the room argues with the portal count.

## Read first

- `ArchLucid.Application/InfraEvidence/DiagramReconciliation/DiagramInfrastructureMatcher.cs`
- `AzureInventoryVisibleSnapshotProjection` and `AzureInventoryNeverShowArmTypes`
- `DiagramInfrastructureReconciliationResult`
- `DiagramReconcileWorkbenchClient.tsx`
- `docs/optum/WEEK_03_DOCUMENTATION_ACCURACY_GOALS.md` item 4

## What to build

1. Branch `cursor/dic-04-scorecard-export` from current `master`.
2. Above the table, show counts in sentence case:
   - **Matched** — Exact, Probable, and Confirmed
   - **Possible** — name-only
   - **Diagram only**
   - **Inventory only** — count of resources, not count of grouped rows
   - **Conflicts**
   - **Connector gaps** — `EdgeGaps` count from DIC-03
3. Under the counts, one sentence: the inventory side is the visible capture after the never-show list, and it names that dashboards, Log Analytics workspaces, DNS zones, and peering child records are outside the denominator. Use the live `InventoryResourceCount`. Do not invent a portal total.
4. In the table, replace per-resource InfrastructureOnly rows with one row per resource group and type, with a count. A disclosure on that row lists the resource names. Exact, Probable, Possible, Confirmed, DiagramOnly, Conflict, and Unknown stay one row each.
5. A **Download CSV** button is enabled after a comparison exists. The file contains the count strip, the grouped inventory-only rows, the ungrouped node rows, and the connector gaps. Columns are stable and headed in sentence case.
6. Tests: twenty storage accounts in one resource group become one grouped row with count 20 and an inventory-only count of 20; the denominator sentence includes the visible count; CSV has a header and that grouped row; Confirmed and edge-gap rows are present in the CSV.

## Acceptance criteria

- A large capture does not render one table row per unmatched resource.
- The CSV matches the counts on the page.
- The copy stays advisory documentation accuracy. It does not say compliance, attestation, or observed traffic.

## Constraints

- Before editing any tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not paint match kinds on a canvas (DIC-05).
- Do not add a DOCX or PDF exporter in this session.
- Stage only the scorecard, grouping, CSV, and tests. **No `git add -A`.**
- **Do not commit.**
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

Scoped matcher and workbench tests, plus a Vitest test for the CSV builder if it lives in the UI. One compile check, plus one retry if it exits 1. Heartbeat every 8s.

## How to check

Restart the API and the UI. Hard-refresh **Diagram reconciliation**. Compare a small drawing to a capture that has many resources the drawing does not name.

1. The count strip shows Matched, Possible, Diagram only, Inventory only, Conflicts, and Connector gaps. Inventory only equals the number of resources, not the number of group rows.
2. The sentence under the strip states the visible-capture denominator and the excluded kinds (dashboards, Log Analytics workspaces, DNS zones, peering child records).
3. Inventory-only table rows read like a resource group, a type, and a count. Opening one lists the names.
4. **Download CSV** produces a file whose inventory-only count matches the strip.
5. A Confirmed mapping from DIC-02 still counts as Matched. A connector gap from DIC-03 still counts as Connector gaps.

Wait for that look before any commit.
