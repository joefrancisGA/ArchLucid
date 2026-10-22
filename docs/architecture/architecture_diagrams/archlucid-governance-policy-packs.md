> **Scope:** Zoom-in — Governance engine and hierarchical policy packs.
> **Poster:** [`../../ARCHITECTURE_ON_ONE_PAGE.md`](../../ARCHITECTURE_ON_ONE_PAGE.md) §4.3

# ArchLucid — governance and policy packs

![Governance and policy packs](archlucid-governance-policy-packs.svg)

Editable source: [`archlucid-governance-policy-packs.mmd`](archlucid-governance-policy-packs.mmd)

```mermaid
flowchart TB
  subgraph content["Policy pack content"]
    DRAFT["LLM draft rules"]
    CRITIC["Critic review"]
    SME["Human SME approve"]
    PACK["Policy pack JSON/YAML<br/>rules · alerts · advisories"]
  end

  subgraph assign["Scope assignment"]
    T["Tenant assignment"]
    W["Workspace assignment"]
    P["Project assignment"]
  end

  subgraph resolve["Effective governance"]
    MERGE["Hierarchical merge<br/>tenant → workspace → project"]
    EFF["EffectiveGovernance<br/>resolved rule set"]
  end

  subgraph apply["Decisioning & surfaces"]
    ENG["Governance / advisory engine<br/>ArchLucid.Decisioning"]
    FIND["Findings · alerts · digests"]
    MAN["Golden manifest sections"]
  end

  DRAFT --> CRITIC --> SME --> PACK
  PACK --> T
  PACK --> W
  PACK --> P
  T --> MERGE
  W --> MERGE
  P --> MERGE
  MERGE --> EFF --> ENG
  ENG --> FIND
  ENG --> MAN
```
