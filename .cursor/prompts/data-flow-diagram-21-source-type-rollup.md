# DFV-21 — Roll up a crowded Source column by connector type

**Model:** GPT-5.6 Luna. Paste this file as the whole task only after DFV-12 is on `master` and the owner says the Source column is still hard to read. Do not implement DFV-16, DFV-17, or DFV-20 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** DFV-12 and DFV-14 on current `master`. Do not redo host collapse, column wrap, or horizontal scroll.

## Goal

On **Data flow — what may connect**, the Source stage rolls up more than three cards that share a connector type, even when their neighbors differ. Other stages keep the DFV-14 rule: same type, same stage, and the same neighbors. Click still lists the members. PNG export still lists them under the legend.

## Why

DFV-14 groups cards only when the type, the stage, and the neighbor set match. After DFV-12, one host is one card, but the Source column can still be a stack of different HTTP or SFTP links that do not share neighbors. The owner asked to leave that rule alone until a look after DFV-12. This prompt is that follow-up, and only that follow-up.

## Read first

- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestDataFlowRollup.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeSvgEmitter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLegendSvgEmitter.cs`
- `.cursor/prompts/data-flow-diagram-14-rollup-repeated-cards.md`

## What to build

1. Branch `dfv/21-source-type-rollup` from current `master`.
2. Keep the DFV-14 rule for every stage except Source: more than three cards with the same type, the same stage, and the same neighbor set become one card.
3. In the Source stage only, more than three cards with the same connector or resource type become one card even when the neighbor sets differ. Three or fewer stay separate.
4. The rollup title, the `[n]` ordinal, `data-member-ids`, `data-member-names`, click focus, and the PNG member list stay the DFV-14 behavior.
5. Do not roll up a Source card into a card from another stage. Do not change Application, Ingestion, Storage, Transform, Consumer, or Not staged.
6. Tests:
    - Four Source cards of type SFTP with four different neighbors become one Source rollup. The member list names all four.
    - Three Source cards of type SFTP stay three cards.
    - Four Storage cards of one type with different neighbors stay four cards.
    - Four Storage cards of one type with the same neighbors still become one rollup, as DFV-14 already does.

## Acceptance criteria

- Source collapses a large set of one connector type.
- A Source group of three or fewer stays expanded.
- Other stages still require matching neighbors.
- Click and PNG still list members.
- Workspace tabs are unchanged.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not hide unconnected cards. Do not lower the threshold below four cards.
- Working-tree safety. Stage only the rollup rule and the tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~Rollup|FullyQualifiedName~DataFlow"
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8s on the compile. One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner to restart the API and open Data flow on `Hmd_HI_HAP_Non_Prod`. The Source column should show one card per connector type when that type has more than three cards, with a member list on click and on Export PNG. Storage rollups that do not share neighbors should stay separate. Wait for that look before any commit.
