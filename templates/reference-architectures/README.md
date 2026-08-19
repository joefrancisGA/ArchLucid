> **Scope:** Reference architecture request payloads (JSON) aligned with `POST /v1/architecture/request` (`ArchitectureRequest`) for pilots and demos.

Copy any template JSON file below into `POST /v1/architecture/request` as the JSON body (after setting scope headers / auth). Descriptions meet the API minimum length; adjust `requestId` per tenant conventions.

Files ending in `.request.json` are **excluded** from `ExemplarCorpusIndexer` (request-only drafts). All rows below are indexed for Topology style-prior retrieval.

| File | Cloud | Domain | Constraints exercised |
|------|-------|--------|------------------------|
| [`standard-3-tier-web.json`](standard-3-tier-web.json) | Azure | Classic web + API + SQL | Private endpoints, no public SQL, managed identity |
| [`azure-serverless-api.json`](azure-serverless-api.json) | Azure | Serverless HTTP API | Functions, Service Bus, Cosmos, private networking |
| [`azure-data-pipeline-batch.json`](azure-data-pipeline-batch.json) | Azure | Batch data lakehouse ingest | No egress, PII masking, partitioned storage |
| [`microservices-api-gateway.json`](microservices-api-gateway.json) | Azure | Microservices + API gateway | Gateway-only north-south, mTLS, independent deploy |
| [`multi-region-dr-active-passive.json`](multi-region-dr-active-passive.json) | Azure | Multi-region DR | RPO/RTO targets, geo-replication, failover drills |
| [`zero-trust-segmentation.json`](zero-trust-segmentation.json) | Azure | Zero-trust hub-spoke | Default deny, conditional access, JIT admin |
| [`regulated-finance-sox.json`](regulated-finance-sox.json) | Azure | Regulated finance / SOX | Segregation of duties, CMK, immutable audit |
| [`event-driven-saga-integration.json`](event-driven-saga-integration.json) | Azure | Event-driven integration | Sagas, idempotency, dead-letter monitoring |
| [`aks-kubernetes-baseline.json`](aks-kubernetes-baseline.json) | Azure | AKS platform baseline | Workload identity, network policies, private ACR |
| [`aws-three-tier-vpc.json`](aws-three-tier-vpc.json) | AWS | Three-tier VPC web app | Private RDS/ECS, VPC endpoints, IAM roles |

**Indexed exemplar count:** 10 (owner-reviewed `ArchitectureRequest` patterns). Re-indexed on deploy via `ExemplarCorpusStartupIndexerHostedService`.

**Curation:** Before adding or editing exemplars, follow [`docs/runbooks/REFERENCE_ARCHITECTURE_EXEMPLAR_CURATION.md`](../../docs/runbooks/REFERENCE_ARCHITECTURE_EXEMPLAR_CURATION.md) (reviewer checklist + CI guard `assert_reference_architecture_exemplars.py`).
