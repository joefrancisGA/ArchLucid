> **Scope:** Zoom-in — Export build → persist → replay (Flow B).
> **Flows:** [`../../library/ARCHITECTURE_FLOWS.md`](../../library/ARCHITECTURE_FLOWS.md)

# ArchLucid — export and replay

![Export and replay](archlucid-export-replay.svg)

Editable source: [`archlucid-export-replay.mmd`](archlucid-export-replay.mmd)

```mermaid
flowchart LR
  RUN["Committed review<br/>runId"] --> BUILD["Build export<br/>Markdown / DOCX / PDF"]
  BUILD --> REC["Persist RunExportRecord<br/>metadata + artifact"]
  REC --> REPLAY["Replay by exportRecordId<br/>re-export without re-analysis"]
  REPLAY --> OUT["Download file<br/>or metadata-only"]
```
