> **Scope:** Zoom-in — Comparison persist → replay → drift (Flow C).
> **Flows:** [`../../library/ARCHITECTURE_FLOWS.md`](../../library/ARCHITECTURE_FLOWS.md) · [`../../library/COMPARISON_REPLAY.md`](../../library/COMPARISON_REPLAY.md)

# ArchLucid — comparison and drift

![Comparison and drift](archlucid-comparison-drift.svg)

Editable source: [`archlucid-comparison-drift.mmd`](archlucid-comparison-drift.mmd)

```mermaid
flowchart TB
  subgraph create["Create comparison"]
    E2E["End-to-end compare<br/>two runIds"]
    EXP["Export-record diff<br/>two export records"]
  end

  subgraph persist["Persist"]
    REP["EndToEndReplayComparisonReport<br/>or ExportRecordDiffResult"]
    CR["ComparisonRecord<br/>PayloadJson + SummaryMarkdown"]
  end

  subgraph replay["Replay modes"]
    ART["artifact"]
    REGEN["regenerate"]
    VER["verify"]
  end

  subgraph out["Outputs"]
    FILE["MD / HTML / DOCX / PDF"]
    DRIFT["Drift analysis"]
  end

  E2E --> REP
  EXP --> REP
  REP --> CR
  CR --> ART
  CR --> REGEN
  CR --> VER
  ART --> FILE
  REGEN --> FILE
  VER --> DRIFT
  VER --> FILE
```
