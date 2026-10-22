> **Scope:** Zoom-in — Artifact synthesis and packaging.
> **Containers:** [`../../library/ARCHITECTURE_CONTAINERS.md`](../../library/ARCHITECTURE_CONTAINERS.md)

# ArchLucid — artifact synthesis

![Artifact synthesis](archlucid-artifact-synthesis.svg)

Editable source: [`archlucid-artifact-synthesis.mmd`](archlucid-artifact-synthesis.mmd)

```mermaid
flowchart LR
  MAN["Golden manifest<br/>+ snapshots"] --> SYN["ArtifactSynthesisService"]
  SYN --> G1["IArtifactGenerator…"]
  G1 --> BUNDLE["ArtifactBundle"]
  BUNDLE --> VAL["Validate bundle"]
  VAL --> PACK["ArtifactPackagingService<br/>ZIP / DOCX / package"]
  PACK --> UI["Review detail downloads"]
```
