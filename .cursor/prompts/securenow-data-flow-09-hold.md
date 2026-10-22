# SN-DF-HOLD — Written hold (not implementation)

**Wave:** SecureNow data flow (**SN-DF**). **Not an implementation prompt.** Paste only when a session starts to mint observed traffic, classification badges, classic process DFDs, a second collector, or fake Fabric/Power BI nodes.

Contract: [`docs/securenow/DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md`](../../docs/securenow/DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md) · Architect hold: [`docs/library/SECURENOW_ARCHITECT_HOLD.md`](../../docs/library/SECURENOW_ARCHITECT_HOLD.md)

## Goal

Keep Data Flow diagrams inside declared Azure wiring. Do not turn SecureNow into a SIEM, an ER modeler, or a narrator of packets and Confidential stamps.

## Do not implement from SN-DF sessions

| Temptation | Hold |
|-----------|------|
| “Data flowed” / exfiltration from ADF or ARG | DerivedFact / DeterministicInference only; copy = declared wiring |
| TLS 1.3 / encryption badges as ObservedFact | Not collected |
| Confidential / classification on nodes or edges | Needs HumanAssertion or a separate class source |
| Classic Level-1 DFD (`Order Processing` processes) | Inventory has resources, not business processes |
| Fake Databricks / Fabric / Power BI nodes | Only if the ARM type is in the snapshot |
| App → MI → SQL as this set | Collected **AX-DE-03**; Data Flow paint is **SN-PE** — not SN-DF |
| Customer → App Gateway → Web App on Data Flow | Diagram 1 (network) or a later app-flow overlay |
| ADLS Raw vs Curated as ObservedFact | Heuristic only in a later slice, labeled inference |
| Second ZIP collector / SQL DMV table harvest | One collector family; no ER diagrams in SN-DF |
| `terraform apply` / ARM writes | IE plane |
| Desktop review tab collapse | Workspace rule |
| GTM **M-90 / M-44 / M-91 / M-92**; **TB-135 / TB-136** | Owner/GTM |
| Re-running **IE-DD-01–04** as greenfield | Dependency; separate chats |
| LLM-authored Mermaid as source of truth | DAU / ADR 0101 |

## Authorized first slice (SN-DF-01–08)

```text
ADF linked services + pipeline flows (+ external source nodes)
        → stage catalog
              → DiagramMode.DataFlow (movement) + DataArchitecture (catalog)
                    → workbench modes dataFlow / dataArchitecture
                          → honesty + missing-companion captions
```

## When to start a *new* prompt set instead

- App/MI/RBAC **on Data Flow**, Event Grid family, DNS-joined PE hop, ordinal bands — **SN-PE** ([`securenow-probable-evidence-00-index.md`](securenow-probable-evidence-00-index.md)). Do not implement SN-PE from an SN-DF chat.
- Power BI / Fabric tenant collection.
- SQL table/FK ER diagrams.
- Zone-name heuristics for Raw/Curated.

Until SN-PE, empty Consumer/Transform is still correct when those ARM types are absent.
