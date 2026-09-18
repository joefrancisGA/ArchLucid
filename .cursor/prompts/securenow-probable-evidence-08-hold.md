# SN-PE-HOLD — Written hold (not implementation)

**Wave:** SecureNow probable-evidence Data Flow (**SN-PE**). **Not an implementation prompt.** Paste only when a session starts numeric confidence, PE hops without a DNS join, Kudu/secret harvest, observed-traffic labels, Service Bus-as-Event-Grid, or a second collector.

Library copy: [`docs/library/SECURENOW_PROBABLE_EVIDENCE_HOLD.md`](../../docs/library/SECURENOW_PROBABLE_EVIDENCE_HOLD.md). Design: [`docs/securenow/EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md`](../../docs/securenow/EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md).

## Goal

Keep Diagram 3 as **evidence-based probable flows**. Do not ask Azure to prove packets. Do not store percents. Do not fan out hub private endpoints onto every spoke.

## Do not implement from SN-PE sessions

| Temptation | Hold |
|-----------|------|
| `"confidence": 80` / canvas `95%` / path product of percents | `PathConfidenceBand` + `ProvenanceKind` only |
| Web App → SQL from VNet integration + any PE | Require `peDnsZoneGroup` + `privateDnsVnetLink` to the **app** VNet |
| Promote PE hop or **May access** to ObservedFact | DerivedFact; not traffic |
| Service Bus / Event Hub ARM “destinations” | Nodes + Sender/Receiver RBAC + capture |
| `diagnosticToDestination` on Data Flow | Telemetry |
| ADF **Reads from** for RBAC | **May access** / **May read** / **May write** |
| Mint Customer / Power BI / Fabric / Confidential / TLS | SN-DF-HOLD |
| Kudu / VM disk / AKS ConfigMap / source parse / secrets | AX-DE-HOLD |
| Flow logs / App Insights as architecture arrows | Runtime plane |
| Re-run AX-DE / AX-DC / SN-DF collection as greenfield | Consume |
| `terraform apply` / second ZIP | Plane |
| GTM **M-90 / M-44 / M-91 / M-92**; **TB-135 / TB-136** | Owner/GTM |
| Desktop review tabs behind **More** | workspace rule |

## Authorized slice (SN-PE-01–07)

```text
Family catalog (no percents)
        → Application + messaging stages
              → Data Flow allow-list + Application endpoints
                    → peReachableTarget after DNS join (hub-spoke negative test)
                          → Sender/Receiver role map
                                → honesty legend + AST contract
```

## If a session is already implementing a hold item

Stop. Revert uncommitted hold-item code. Point at **SN-PE-01–07** and the plane.

## Done when

The hold is written. No code from this file.
