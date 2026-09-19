# SN-PE-06 — Data Flow honesty legend and ordinal bands

**Wave:** SecureNow probable-evidence Data Flow (**SN-PE**). **Depends on:** SN-PE-03. **Do not** implement SN-PE-07 except if legend strings are asserted there.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Data Flow caption/legend states that edges are **evidence families** (declared / authorized / network path / inferred), not observed traffic, and shows **ordinal** bands. Never print percents. Network mermaid must not gain this paragraph.

## Why

SN-DF-04 locked: “Declared pipeline wiring, not observed traffic…” That stays true for ADF and is now incomplete: **May access** and **Private network path** would otherwise be read as ETL. Owner advice’s `Confidence 95` on the canvas is the failure mode SA-21 already forbids.

## Context

- `docs/securenow/EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md` §§1–2
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramDataFlowHonestyLegend.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramDataFlowCompileSupport.cs` (`DiagramDataFlowCaptionBuilder`)
- AX-DC-03 strokes (Executive) — reuse visual kind if already mapped; do **not** re-run AX-DC-03 as greenfield
- `PathConfidenceBand` names: Confirmed, HighlyLikely, Probable, Possible, InsufficientEvidence

## What to build

1. Replace or extend `PrimarySentence` so it covers families without implying packets. Locked meaning (wording may be tightened, not softened):

   > Evidence of possible or declared movement, not observed traffic. **Reads from** / **Writes to** are pipeline wiring. **May access** is identity authorization. **Private network path** is a DNS-joined private endpoint hop, not usage.

2. When at least one AuthorizedAccess edge is present, add a caption line that names the band **Probable** (word, not `80%`).
3. When at least one `peReachableTarget` is present, add a line that it requires a private DNS zone link to the app’s VNet.
4. When only ADF edges exist, do not scare the operator with PE/DNS sentences (keep the original SN-DF-04 sentence as the first line; extra lines are conditional).
5. **Forbidden** in legend/labels/tests: `%`, `95`, `confidence:`, “data flowed”, “confirmed dependency” for RBAC, “exfiltrat”.
6. Tests:
   - ADF-only fixture → first line is the declared-wiring sentence; no PE/DNS sentence.
   - Fixture with **May access** → legend mentions authorization / May access / Probable (or “not observed traffic”).
   - `string.Contains("%")` on legend constants is false.
   - Network-mode compile of the same graph does **not** include the Data Flow primary sentence (SN-DF-04 regression).

## Acceptance criteria

- Operators can distinguish families without a percent.
- No Confidential / TLS badges.

## Constraints

- Do **not** add a workbench filter UI (later). Outline inspector is AX-DC-06 — do not re-open it unless a one-line Data Flow caption is insufficient; prefer captions.
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DataFlowHonesty|DiagramDataFlow'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8s if >15s.

## Done when

Legend tests lock family language and forbid `%`.
