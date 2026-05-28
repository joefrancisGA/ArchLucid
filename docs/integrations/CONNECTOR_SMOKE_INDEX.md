> **Scope:** Operator smoke index for first-party integration surfaces — maps each smoke recipe to conformance tests and states what is automated vs live-only.

# Connector smoke recipes (index)

Each recipe under [smoke/](smoke/) is written so an operator can execute it **without reading source** — prerequisites, secret discipline, minimal API actions, and **expected durable audit types**. Recipes do **not** embed tenant ids, webhook URLs, or credentials.

**Catalog entry point:** [go-to-market/INTEGRATION_CATALOG.md](../go-to-market/INTEGRATION_CATALOG.md) · **Readiness matrix (status, tests, code):** [library/CONNECTOR_READINESS_MATRIX.md](../library/CONNECTOR_READINESS_MATRIX.md)

**Scope contract:** [library/V1_SCOPE.md](../library/V1_SCOPE.md) §2.16 (Azure extractor) is **V1**; **§2.13–§2.15** first-party ITSM / Slack / Confluence are **V1.1** — smoke in the ITSM section below validates those surfaces when implemented. **ITSM/chat/doc connectors are not required for V1 first-pilot success.**

**Customer-owned bridges** (Logic Apps / Power Automate), **canonical OpenAPI (`/openapi/v1.json`)**, and **webhook configuration** entry tables: [integrations/recipes/README.md](recipes/README.md).

## V1 GA buyer-contract surfaces — smoke pointers

These shipped surfaces support V1 pilots and workflow handoff. They are **not** the same as V1.1 ITSM/chat connectors below.

| Surface | Smoke / runbook pointer | Primary automated tests | Notes |
|---------|-------------------------|-------------------------|-------|
| **REST / OpenAPI** | [library/RELEASE_SMOKE.md](../library/RELEASE_SMOKE.md) · `GET /openapi/v1.json` | `ArchLucid.Api.Tests/OpenApiContractSnapshotTests.cs` | Contract: [API_CONTRACTS.md](../library/API_CONTRACTS.md) |
| **CLI** | [library/CLI_USAGE.md](../library/CLI_USAGE.md) · `archlucid pilot preflight` | `ArchLucid.Cli.Tests/CliSmokeTests.cs` | Includes `run-support-packet`, `first-value-report` |
| **SCIM 2.0** | [SCIM_PROVISIONING.md](SCIM_PROVISIONING.md) | `ArchLucid.Api.Tests/Scim/ScimUsersPostEntraProvisioningIntegrationTests.cs` | IdP → ArchLucid provisioning |
| **GitHub** (manifest delta) | [GITHUB_PR_MANIFEST_DELTA.md](GITHUB_PR_MANIFEST_DELTA.md), [GITHUB_ACTION_MANIFEST_DELTA.md](GITHUB_ACTION_MANIFEST_DELTA.md) | `ArchLucid.Integrations.AzureDevOps.Tests/AzureDevOpsRequestBodyParityWithPipelineTaskTests.cs` | Manual attach runbook: [V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md](../runbooks/V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md) |
| **Azure DevOps** (pipeline task) | [AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA.md](AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA.md) | `ArchLucid.Integrations.AzureDevOps.Tests/AzureDevOpsRequestBodyParityWithPipelineTaskTests.cs` | Same workflow handoff runbook |
| **Azure extractor ZIP** | [smoke/CONNECTOR_SMOKE_AZURE_EXTRACTOR.md](smoke/CONNECTOR_SMOKE_AZURE_EXTRACTOR.md) | `ArchLucid.Api.Tests/AzureExtractorUploadEndpointTests.cs` | Customer-run collector + upload |
| **Procurement pack ZIP** | [../go-to-market/PROCUREMENT_PACK_INDEX.md](../go-to-market/PROCUREMENT_PACK_INDEX.md) | `scripts/ci/tests/test_procurement_pack_validation.py` | `python scripts/build_procurement_pack.py --dry-run --deal-ready` |

## V1.1 first-party connectors — smoke doc ↔ tests

| Connector | Smoke recipe | Primary automated tests (repository paths) | Evidence type for those tests |
|-----------|--------------|--------------------------------------------|-------------------------------|
| **Jira** | [CONNECTOR_SMOKE_JIRA.md](smoke/CONNECTOR_SMOKE_JIRA.md) | `ArchLucid.Application.Tests/Integrations/Itsm/Outbound/ItsmOutboundConnectorConformanceTests.cs`, `ItsmOutboundJiraVendorHttpConformanceTests.cs`, `ItsmFindingAuthorityPayloadMapperConformanceTests.cs`, `ItsmOutboundIssueCreationServiceTests.cs`; inbound mapping `ArchLucid.Application.Tests/Integrations/Itsm/ItsmInboundWebhookSyncServiceTests.cs` | Automated (mocked) + **manual / live-provider** for real Jira smoke |
| **ServiceNow** | [CONNECTOR_SMOKE_SERVICENOW.md](smoke/CONNECTOR_SMOKE_SERVICENOW.md) | Same outbound folder: `ItsmOutboundConnectorConformanceTests.cs`, `ItsmOutboundServiceNowVendorHttpConformanceTests.cs`, `ServiceNowUrgencyImpactResolverConformanceTests.cs`, `ItsmOutboundIssueCreationServiceTests.cs`; inbound `ItsmInboundWebhookSyncServiceTests.cs` | Automated (mocked) + **manual / live-provider** for real instance smoke |
| **Confluence** | [CONNECTOR_SMOKE_CONFLUENCE.md](smoke/CONNECTOR_SMOKE_CONFLUENCE.md) | `ArchLucid.Application.Tests/Integrations/Confluence/ConfluenceFirstValueReportPublisherConformanceTests.cs` | Automated (mocked) + **manual / live-provider** for Cloud publish proof |
| **Slack** | [CONNECTOR_SMOKE_SLACK.md](smoke/CONNECTOR_SMOKE_SLACK.md) | `ArchLucid.Decisioning.Tests/Alerts/Delivery/AlertSlackWebhookVendorConformanceTests.cs`, `AlertSlackWebhookDeliveryChannelTests.cs`, `FirstPartyAlertWebhookDeliveryConformanceTests.cs`; digest path `ArchLucid.Decisioning.Tests/Advisory/Delivery/DigestSlackWebhookDeliveryChannelTests.cs` | Automated (mocked) + **manual / live-provider** for real workspace webhook |

**API controllers (reference only):** `ArchLucid.Api/Controllers/Integrations/ItsmOutboundIssuesController.cs`, `ItsmInboundWebhooksController.cs`, `ArchLucid.Api/Controllers/Admin/ConfluencePublishingAdminController.cs`, `ArchLucid.Api/Controllers/Alerts/AlertRoutingSubscriptionsController.cs`, `ArchLucid.Api/Controllers/Advisory/DigestSubscriptionsController.cs`, `ArchLucid.Api/Controllers/Integrations/WebhookConnectionsController.cs`.

## Evidence types (legend)

| Label | Meaning |
|-------|---------|
| **Automated (mocked)** | Unit/Core tests with mocked HTTP or webhook posters — safe for CI; **no** live vendor calls. |
| **Automated (API host)** | HTTP tests against a controlled API fixture (e.g. in-memory / test DB) — still **not** a substitute for your tenant’s live ITSM. |
| **Manual / live-provider** | Operator or pilot validates against **real Jira, ServiceNow, Confluence, or Slack** — required for end-to-end vendor proof; **not** fully reproducible in OSS CI. |

## Related — Azure extractor smoke (detail)

| Connector | Smoke recipe | Primary automated tests | Evidence type |
|-----------|--------------|-------------------------|---------------|
| **Azure extractor ZIP** | [CONNECTOR_SMOKE_AZURE_EXTRACTOR.md](smoke/CONNECTOR_SMOKE_AZURE_EXTRACTOR.md) | `ArchLucid.Application.Tests/AzureExtractor/AzureExtractorManifestReaderTests.cs`, `AzureExtractorEvidenceBundleMergerTests.cs`; API ingest `ArchLucid.Api.Tests/AzureExtractorUploadEndpointTests.cs` | Automated (mocked) + **Automated (API host)** for upload route |

---

| Connector | Recipe |
|-----------|--------|
| **Azure extractor** | [CONNECTOR_SMOKE_AZURE_EXTRACTOR.md](smoke/CONNECTOR_SMOKE_AZURE_EXTRACTOR.md) |
| **ServiceNow** | [CONNECTOR_SMOKE_SERVICENOW.md](smoke/CONNECTOR_SMOKE_SERVICENOW.md) |
| **Confluence** | [CONNECTOR_SMOKE_CONFLUENCE.md](smoke/CONNECTOR_SMOKE_CONFLUENCE.md) |
| **Jira** | [CONNECTOR_SMOKE_JIRA.md](smoke/CONNECTOR_SMOKE_JIRA.md) |
| **Slack** | [CONNECTOR_SMOKE_SLACK.md](smoke/CONNECTOR_SMOKE_SLACK.md) |
