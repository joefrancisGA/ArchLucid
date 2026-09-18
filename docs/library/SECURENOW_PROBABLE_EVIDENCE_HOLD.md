> **Scope:** Contributor-reference — written hold for SecureNow probable-evidence Data Flow (**SN-PE-HOLD**). Internal engineering only.
> **Spine:** [`INFRA_EVIDENCE_PLANE.md`](INFRA_EVIDENCE_PLANE.md) · **Design:** [`../securenow/EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md`](../securenow/EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md) · **Prompts:** [`../architecture/SECURENOW_PROBABLE_EVIDENCE_DATA_FLOW_COMPOSER_PROMPTS.md`](../architecture/SECURENOW_PROBABLE_EVIDENCE_DATA_FLOW_COMPOSER_PROMPTS.md) · **Collection (closed):** [`AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_HOLD.md`](AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_HOLD.md)

# SecureNow probable-evidence Data Flow hold (SN-PE-HOLD)

**Status:** Active written hold — **not implementation**. Paste [`.cursor/prompts/securenow-probable-evidence-08-hold.md`](../../.cursor/prompts/securenow-probable-evidence-08-hold.md) only when a session starts numeric confidence, PE hops without a DNS join, Kudu/secret harvest, observed-traffic labels, or a second collector.

## Authorized spine

```text
AX-DE collection (shipped) + SN-DF Data Flow compile (ADF spine)
    → evidence-family catalog (ordinal bands, not percents)
    → stage catalog (Application + messaging)
    → DiagramDataFlowEdgeFilter allow-list + endpoint inclusion
    → peReachableTarget only after DNS zone join
    → honesty legend (declared vs authorized vs network path vs inferred)
```

No new ZIP collector. No Azure HTTP at render.

## Do not implement (ever from SN-PE sessions)

| Temptation | Hold |
|-----------|------|
| `"confidence": 80` / `95%` / multiplying bands along a path | `PathConfidenceBand` + `ProvenanceKind` only (SA-21) |
| Web App → SQL from VNet integration + any PE in the subscription | Require `peDnsZoneGroup` + `privateDnsVnetLink` to **the app’s VNet** |
| Promote `peReachableTarget` or `appAuthorizedAccess` to ObservedFact | DerivedFact; authorization/reachability ≠ traffic |
| Service Bus / Event Hub as Event Grid–style ARM destinations | Nodes + RBAC Sender/Receiver + capture only |
| `diagnosticToDestination` on Data Flow | Telemetry, not business movement |
| ADF **Reads from** for RBAC | **May access** / **May read** / **May write** |
| Mint `Customer` / Power BI / Fabric / Confidential / TLS 1.3 | SN-DF-HOLD |
| Kudu, VM disk, AKS ConfigMap, source parse, secret values | AX-DE-HOLD |
| Flow logs / App Insights as Diagram 3 arrows | Runtime plane |
| Re-run AX-DE / AX-DC / SN-DF as greenfield collection | Consume; this wave is Data Flow families |
| `terraform apply` / ARM writes / second ZIP | Plane |
| GTM M-90 / M-44 / M-91 / M-92; TB-135 / TB-136 | Owner/GTM |
| Desktop review tabs behind **More** | workspace rule |

## If a session is already implementing a hold item

Stop. Revert uncommitted hold-item code. Point at **SN-PE-01–07**, the design note, and the plane.
