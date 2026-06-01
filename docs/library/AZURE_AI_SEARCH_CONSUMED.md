# Consumed Azure AI Search (TB-096)

Production-like hosted Terraform **does not create** Azure AI Search. Platform subscription owns SKU, semantic ranking, networking, and diagnostics.

## Contract variables

| Variable | App mapping |
|----------|-------------|
| `search_existing_resource_id` | Pass to `terraform-private` `search_service_id` for PE |
| `search_existing_endpoint` | `Retrieval:AzureSearch:Endpoint` |
| `search_index_name` | `Retrieval:AzureSearch:IndexName` |
| `search_semantic_configuration_name` | Semantic reranker config name |
| `search_expected_location` | Default `eastus` (US East pilot) |

Outputs `azure_search_container_app_env` mirror `terraform-container-apps` `azure_search_*` variables.

See `deploy/hosted-prod-terraform/README.md` and `docs/library/IAC_RUNTIME_PARITY.md`.
