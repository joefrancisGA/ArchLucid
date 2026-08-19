> **Scope:** Zoom-in — Integration events, webhooks, Logic Apps / ITSM fan-out.
> **Docs:** [`../../library/INTEGRATION_EVENTS_AND_WEBHOOKS.md`](../../library/INTEGRATION_EVENTS_AND_WEBHOOKS.md)

# ArchLucid — integrations and ITSM

![Integrations ITSM](archlucid-integrations-itsm.svg)

Editable source: [`archlucid-integrations-itsm.mmd`](archlucid-integrations-itsm.mmd)

```mermaid
flowchart TB
  subgraph product["ArchLucid"]
    API["Api lifecycle events"]
    SQL[("IntegrationEventOutbox")]
    WK["Worker outbox publisher"]
  end

  subgraph bus["Optional Azure Service Bus"]
    TOPIC["Queue / topic<br/>event_type properties"]
  end

  subgraph fans["Downstream"]
    WH["HTTPS webhooks<br/>HMAC ± CloudEvents"]
    LA["Logic Apps<br/>Teams / ITSM / ChatOps"]
    EXT["Customer ITSM / email"]
  end

  API --> SQL --> WK --> TOPIC
  WK -.-> WH
  TOPIC --> LA --> EXT
  TOPIC --> WH
```
