namespace ArchLucid.Core.Audit;

// Outbound/inbound ITSM, chat and webhook integrations, cloud connections, and extractor package ingest.
public static partial class AuditEventTypes
{
    /// <summary>
    ///     Multipart ZIP accepted for Azure extractor ingest (
    ///     <c>POST /v1/azure-extractor/upload</c>) — payload lists file name and size only.
    /// </summary>
    public const string AzureExtractorPackageUploaded = "AzureExtractorPackage.Uploaded";

    /// <summary>
    ///     Azure extractor ZIP failed manifest or archive parsing after upload (
    ///     <c>POST /v1/azure-extractor/upload</c>).
    /// </summary>
    public const string AzureExtractorPackageParseFailed = "AzureExtractorPackage.ParseFailed";

    /// <summary>
    ///     Azure extractor <c>manifest.json</c> schema version is not supported (
    ///     <c>POST /v1/azure-extractor/upload</c>).
    /// </summary>
    public const string AzureExtractorPackageSchemaRejected = "AzureExtractorPackage.SchemaRejected";

    /// <summary>
    ///     Azure extractor ZIP persisted after successful schema validation (
    ///     <c>POST /v1/azure-extractor/upload</c>).
    /// </summary>
    public const string AzureExtractorPackageIngestSucceeded = "AzureExtractorPackage.IngestSucceeded";

    /// <summary>
    ///     Multipart ZIP accepted for AWS/GCP inventory ingest (
    ///     <c>POST /v1/extractor/{provider}/upload</c>).
    /// </summary>
    public const string CloudInventoryExtractorPackageUploaded = "CloudInventoryExtractorPackage.Uploaded";

    /// <summary>
    ///     AWS/GCP inventory ZIP failed manifest or archive parsing after upload.
    /// </summary>
    public const string CloudInventoryExtractorPackageParseFailed = "CloudInventoryExtractorPackage.ParseFailed";

    /// <summary>
    ///     AWS/GCP inventory <c>manifest.json</c> schema version is not supported.
    /// </summary>
    public const string CloudInventoryExtractorPackageSchemaRejected = "CloudInventoryExtractorPackage.SchemaRejected";

    /// <summary>
    ///     AWS/GCP inventory ZIP persisted after successful schema validation.
    /// </summary>
    public const string CloudInventoryExtractorPackageIngestSucceeded = "CloudInventoryExtractorPackage.IngestSucceeded";

    /// <summary>
    ///     AWS/GCP inventory ZIP download (<c>GET /v1/extractor/{provider}/packages/{packageId}</c>).
    /// </summary>
    public const string CloudInventoryExtractorPackageDownloaded = "Export.CloudInventoryExtractorPackageDownloaded";

    /// <summary>
    ///     Chunked Azure extractor ingest session created (
    ///     <c>POST /v1/azure-extractor/upload-sessions</c>); payload lists <c>sessionId</c>, declared chunk counts, and caps
    ///     only.
    /// </summary>
    public const string AzureExtractorPackageChunkSessionStarted = "AzureExtractorPackage.ChunkSessionStarted";

    /// <summary>
    ///     Operator downloaded a persisted Azure extractor ZIP (
    ///     <c>GET /v1/azure-extractor/packages/{packageId}</c>).
    /// </summary>
    public const string AzureExtractorPackageDownloaded = "Export.AzureExtractorPackageDownloaded";

    /// <summary>Admin configured Tier 2 hosted Azure extractor (customer SP + subscription scope via WIF).</summary>
    public const string IntegrationHostedAzureExtractorConfigured = "Integration.HostedAzureExtractorConfigured";

    /// <summary>Operator connected Tier 2 hosted AWS extractor (IAM role ARN via OIDC federation).</summary>
    public const string CloudConnectionAwsConnected = "CloudConnection.AwsConnected";

    /// <summary>Hosted AWS extractor completed a scheduled or on-demand poll cycle.</summary>
    public const string CloudConnectionAwsPolled = "CloudConnection.AwsPolled";

    /// <summary>Operator disconnected Tier 2 hosted AWS extractor connection.</summary>
    public const string CloudConnectionAwsDisconnected = "CloudConnection.AwsDisconnected";

    public const string CloudConnectionGcpConnected = "CloudConnection.GcpConnected";

    public const string CloudConnectionGcpPolled = "CloudConnection.GcpPolled";

    public const string CloudConnectionGcpDisconnected = "CloudConnection.GcpDisconnected";

    /// <summary>
    ///     Outbound subscriber URL probe without persistence (<c>POST /v1/webhooks/dry-run</c>). Payload excludes shared
    ///     secrets and response bodies.
    /// </summary>
    public const string OutboundWebhookDryRunProbeExecuted = "OutboundWebhookDryRunProbeExecuted";

    /// <summary>Synthetic <c>AuthorityRunCompleted</c> webhook simulation executed via integrations API.</summary>
    public const string WebhookAuthorityRunCompletedSimulationExecuted = "WebhookAuthorityRunCompletedSimulationExecuted";

    /// <summary>
    ///     Operator pinged a persisted alert-routing webhook subscription to verify connectivity
    ///     (<c>POST /v1/integrations/webhooks/{id}/test</c>). Payload includes subscription ID, transport outcome, and
    ///     status code; never the destination URL or response body.
    /// </summary>
    public const string AlertRoutingWebhookPingExecuted = "AlertRoutingWebhookPingExecuted";

    /// <summary>
    ///     Tenant Microsoft Teams incoming-webhook Key Vault reference upserted (
    ///     <c>POST /v1/integrations/teams/connections</c>).
    /// </summary>
    public const string TenantTeamsIncomingWebhookConnectionUpserted = "TenantTeamsIncomingWebhookConnectionUpserted";

    /// <summary>
    ///     Tenant ITSM outbound settings upserted (<c>PUT /v1/integrations/itsm/settings</c>).
    /// </summary>
    public const string TenantItsmOutboundSettingsUpserted = "TenantItsmOutboundSettingsUpserted";

    /// <summary>
    ///     Tenant ITSM connector credential reference upserted (<c>POST /v1/integrations/itsm/connections/{provider}</c>).
    /// </summary>
    public const string TenantItsmConnectorConnectionUpserted = "TenantItsmConnectorConnectionUpserted";

    /// <summary>
    ///     Tenant ITSM connector credential reference removed (<c>DELETE /v1/integrations/itsm/connections/{provider}</c>).
    /// </summary>
    public const string TenantItsmConnectorConnectionRemoved = "TenantItsmConnectorConnectionRemoved";

    /// <summary>
    ///     Tenant Microsoft Teams incoming-webhook Key Vault reference removed (
    ///     <c>DELETE /v1/integrations/teams/connections</c>).
    /// </summary>
    public const string TenantTeamsIncomingWebhookConnectionRemoved = "TenantTeamsIncomingWebhookConnectionRemoved";

    /// <summary>Inbound Jira webhook mapped an issue status to finding <c>HumanReviewStatus</c>.</summary>
    public const string IntegrationJiraIssueStatusSynced = "Integration.JiraIssueStatusSynced";

    /// <summary>Inbound ServiceNow webhook mapped an incident state to finding <c>HumanReviewStatus</c>.</summary>
    public const string IntegrationServiceNowIncidentStatusSynced = "Integration.ServiceNowIncidentStatusSynced";

    /// <summary>Inbound Jira webhook rejected — invalid payload, unknown status, missing finding, or other validation guard.</summary>
    public const string IntegrationJiraInboundWebhookRejected = "Integration.JiraInboundWebhookRejected";

    /// <summary>Inbound ServiceNow webhook rejected — invalid payload, unknown status, missing finding, or other validation guard.</summary>
    public const string IntegrationServiceNowInboundWebhookRejected = "Integration.ServiceNowInboundWebhookRejected";

    /// <summary>Inbound ITSM webhook body exceeded the configured UTF-8 size limit (vendor-agnostic).</summary>
    public const string IntegrationItsmInboundWebhookPayloadRejected = "Integration.ItsmInboundWebhookPayloadRejected";

    /// <summary>Inbound ITSM webhook replay ignored — duplicate delivery/event id within retention; no status mutation (TB-968).</summary>
    public const string IntegrationItsmInboundWebhookReplayIgnored = "Integration.ItsmInboundWebhookReplayIgnored";

    /// <summary>Operator registered a finding ↔ ITSM external key correlation for inbound webhooks.</summary>
    public const string IntegrationItsmFindingCorrelationRegistered = "Integration.ItsmFindingCorrelationRegistered";

    /// <summary>Operator updated external tracking metadata on an existing finding ↔ ITSM correlation.</summary>
    public const string IntegrationItsmFindingCorrelationUpdated = "Integration.ItsmFindingCorrelationUpdated";

    /// <summary>Operator removed a finding ↔ ITSM external key correlation.</summary>
    public const string IntegrationItsmFindingCorrelationRemoved = "Integration.ItsmFindingCorrelationRemoved";

    /// <summary>Outbound Jira issue create succeeded (payload: finding id, issue key; never secrets or full external URLs).</summary>
    public const string IntegrationJiraIssueCreateSucceeded = "Integration.JiraIssueCreateSucceeded";

    /// <summary>Outbound Jira issue create failed after vendor call or correlation persistence (payload: reason, status code when known).</summary>
    public const string IntegrationJiraIssueCreateFailed = "Integration.JiraIssueCreateFailed";

    /// <summary>Outbound Jira issue create skipped — unconfigured connector, missing project key, or informational severity dropped.</summary>
    public const string IntegrationJiraIssueCreateSkipped = "Integration.JiraIssueCreateSkipped";

    /// <summary>Durable async outbound ITSM create enqueued (payload: job id, finding id, provider label).</summary>
    public const string IntegrationItsmOutboundCreateEnqueued = "Integration.ItsmOutboundCreateEnqueued";

    /// <summary>Outbound ServiceNow incident create succeeded.</summary>
    public const string IntegrationServiceNowIncidentCreateSucceeded = "Integration.ServiceNowIncidentCreateSucceeded";

    /// <summary>Outbound ServiceNow incident create failed after vendor call or correlation persistence.</summary>
    public const string IntegrationServiceNowIncidentCreateFailed = "Integration.ServiceNowIncidentCreateFailed";

    /// <summary>Outbound ServiceNow incident create skipped — unconfigured connector or prerequisite not met.</summary>
    public const string IntegrationServiceNowIncidentCreateSkipped = "Integration.ServiceNowIncidentCreateSkipped";

    /// <summary>Outbound Azure Boards work item create succeeded.</summary>
    public const string IntegrationAzureBoardsWorkItemCreateSucceeded = "Integration.AzureBoardsWorkItemCreateSucceeded";

    /// <summary>Outbound Azure Boards work item create failed after vendor call or correlation persistence.</summary>
    public const string IntegrationAzureBoardsWorkItemCreateFailed = "Integration.AzureBoardsWorkItemCreateFailed";

    /// <summary>Outbound Azure Boards work item create skipped — unconfigured connector or informational severity dropped.</summary>
    public const string IntegrationAzureBoardsWorkItemCreateSkipped = "Integration.AzureBoardsWorkItemCreateSkipped";

    /// <summary>Per-tenant Azure Boards outbound settings upserted (project, work item type, optional paths).</summary>
    public const string TenantAzureBoardsOutboundSettingsUpserted = "TenantAzureBoardsOutboundSettingsUpserted";

    /// <summary>Azure Boards connection test executed (no work item created).</summary>
    public const string IntegrationAzureBoardsConnectionTested = "Integration.AzureBoardsConnectionTested";

    /// <summary>Admin or CLI re-queued one or more integration outbox dead-letter rows for publish retry.</summary>
    public const string IntegrationOutboxDeadLetterRetried = "Integration.OutboxDeadLetterRetried";

    /// <summary>Admin suppressed an integration outbox dead-letter row without republishing.</summary>
    public const string IntegrationOutboxDeadLetterSuppressed = "Integration.OutboxDeadLetterSuppressed";

    /// <summary>
    ///     Admin published the canonical first-value Markdown for a run as a new Confluence Cloud page (
    ///     <c>POST /v1/admin/integrations/confluence/first-value-report</c>). Payload: <c>runId</c>, <c>externalPageId</c>.
    /// </summary>
    public const string IntegrationConfluenceFirstValueReportPublished =
        "Integration.ConfluenceFirstValueReportPublished";
}
