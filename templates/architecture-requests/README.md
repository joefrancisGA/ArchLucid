> **Scope:** Curated `ArchitectureRequest` JSON for common pilot scenarios (Improvement 5). Same contract as `POST /v1/architecture/request`. For field meanings see [`docs/library/ARCHITECTURE_REQUEST_WIRE_FORMAT.md`](../../docs/library/ARCHITECTURE_REQUEST_WIRE_FORMAT.md).

# Architecture request templates (scenario pack)

Starter files for evaluations when teams need **scenario-named** payloads (distinct from pattern samples in [`../reference-architectures/README.md`](../reference-architectures/README.md)). For **context-ingestion-focused** snippets (`inlineRequirements`, `documents`, `policyReferences`, declarations), see [`../context-ingestion/README.md`](../context-ingestion/README.md).

## Usage

```bash
curl -sS -X POST "$BASE/v1/architecture/request" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: pilot-cloud-migration" \
  --data-binary "@templates/architecture-requests/cloud-migration-review.json"
```

Replace paths, names, and constraints with your environment. All JSON must validate as **`ArchLucid.Contracts.Requests.ArchitectureRequest`** (no extra properties).

## Files

| File | Intent |
|------|--------|
| `cloud-migration-review.json` | On-prem to Azure migration review |
| `microservices-decomposition-review.json` | Monolith decomposition |
| `cost-optimization-review.json` | Spend and architecture efficiency |
| `security-baseline-review.json` | Security / compliance baseline |
| `greenfield-design-review.json` | Net-new system design |
