> **Scope:** Zoom-in — Operator UI shell and BFF proxy.
> **UI:** [`../../../archlucid-ui/docs/ARCHITECTURE.md`](../../../archlucid-ui/docs/ARCHITECTURE.md)

# ArchLucid — operator UI shell

![Operator UI shell](archlucid-operator-ui-shell.svg)

Editable source: [`archlucid-operator-ui-shell.mmd`](archlucid-operator-ui-shell.mmd)

```mermaid
flowchart TB
  subgraph browser["Browser"]
    MKT["Marketing routes<br/>public"]
    OPS["Operator shell<br/>authenticated"]
  end

  subgraph next["archlucid-ui Next.js"]
    BFF["Server BFF proxy<br/>scope + correlation headers"]
    HEAVY["Deferred heavy clients<br/>Mermaid · React Flow · charts"]
  end

  subgraph api["ArchLucid.Api"]
    V1["/v1/... REST"]
  end

  MKT --> BFF
  OPS --> BFF
  BFF --> V1
  OPS -.-> HEAVY
```
