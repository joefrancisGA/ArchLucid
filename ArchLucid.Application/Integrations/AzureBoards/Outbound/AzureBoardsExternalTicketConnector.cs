using System.Net.Http.Headers;
using System.Text.Json;

using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Integrations;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Integrations.AzureBoards.Outbound;

public sealed class AzureBoardsExternalTicketConnector(
    IItsmFindingCorrelationRepository correlations,
    IItsmTenantConnectorCredentialResolver credentialResolver,
    IOptionsMonitor<PublicSiteOptions> publicSiteOptions,
    ITenantAzureBoardsOutboundSettingsRepository azureBoardsSettings,
    AzureBoardsOutboundIssueClient azureBoardsClient,
    IItsmOutboundHttpAuthenticator httpAuthenticator) : IExternalTicketConnector
{
    private const string ProjectNameMissingMessage = "Azure Boards connector not configured: project name required.";

    private const string WorkItemTypeMissingMessage = "Azure Boards connector not configured: default work item type required.";

    private readonly IItsmFindingCorrelationRepository _correlations =
        correlations ?? throw new ArgumentNullException(nameof(correlations));

    private readonly IItsmTenantConnectorCredentialResolver _credentialResolver =
        credentialResolver ?? throw new ArgumentNullException(nameof(credentialResolver));

    private readonly IOptionsMonitor<PublicSiteOptions> _publicSiteOptions =
        publicSiteOptions ?? throw new ArgumentNullException(nameof(publicSiteOptions));

    private readonly ITenantAzureBoardsOutboundSettingsRepository _azureBoardsSettings =
        azureBoardsSettings ?? throw new ArgumentNullException(nameof(azureBoardsSettings));

    private readonly AzureBoardsOutboundIssueClient _azureBoardsClient =
        azureBoardsClient ?? throw new ArgumentNullException(nameof(azureBoardsClient));

    private readonly IItsmOutboundHttpAuthenticator _httpAuthenticator =
        httpAuthenticator ?? throw new ArgumentNullException(nameof(httpAuthenticator));

    public ItsmOutboundIssueProvider ProviderId => ItsmOutboundIssueProvider.AzureBoards;

    public string ProviderLabel => "Azure Boards";

    public string CreateFailedAuditEventType => AuditEventTypes.IntegrationAzureBoardsWorkItemCreateFailed;

    public string CreateSkippedAuditEventType => AuditEventTypes.IntegrationAzureBoardsWorkItemCreateSkipped;

    public string CreateSucceededAuditEventType => AuditEventTypes.IntegrationAzureBoardsWorkItemCreateSucceeded;

    public async Task<ItsmOutboundIssueCreationResult> TryCreateForFindingAsync(
        ExternalTicketCreateContext context,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);
        ScopeContext scope = context.Scope;
        FindingInspectResponse inspect = context.Inspect;

        ResolvedItsmOutboundCredentials? credentials = await _credentialResolver
            .TryResolveOutboundAsync(scope.TenantId, TenantItsmConnectorProvider.AzureBoards, cancellationToken)
            .ConfigureAwait(false);

        if (credentials is null)
        {
            AuditEvent ev = ExternalTicketConnectorSupport.SkippedAudit(
                CreateSkippedAuditEventType,
                scope,
                inspect,
                "azure_boards_connector_missing_credentials");

            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.Skipped,
                UserMessage = "Azure Boards outbound connector is not configured (organization URL and PAT are required).",
                AuditEvents = [ev]
            };
        }

        TenantAzureBoardsOutboundSettings? settingsRow =
            await _azureBoardsSettings.TryGetAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (settingsRow is null || string.IsNullOrWhiteSpace(settingsRow.ProjectName))
        {
            AuditEvent ev = ExternalTicketConnectorSupport.SkippedAudit(
                CreateSkippedAuditEventType,
                scope,
                inspect,
                ProjectNameMissingMessage);

            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.Skipped,
                UserMessage = ProjectNameMissingMessage,
                AuditEvents = [ev]
            };
        }

        if (string.IsNullOrWhiteSpace(settingsRow.DefaultWorkItemType))
        {
            AuditEvent ev = ExternalTicketConnectorSupport.SkippedAudit(
                CreateSkippedAuditEventType,
                scope,
                inspect,
                WorkItemTypeMissingMessage);

            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.Skipped,
                UserMessage = WorkItemTypeMissingMessage,
                AuditEvents = [ev]
            };
        }

        int? priority = AzureBoardsPriorityMapper.TryMapPriority(context.Severity);

        if (priority is null)
        {
            AuditEvent ev = ExternalTicketConnectorSupport.SkippedAudit(
                CreateSkippedAuditEventType,
                scope,
                inspect,
                "informational_severity_dropped");

            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.Skipped,
                UserMessage = "Informational findings do not create Azure Boards work items.",
                AuditEvents = [ev]
            };
        }

        string descriptionForVendor = AzureBoardsWorkItemDescriptionBuilder.Build(
            context.Description,
            _publicSiteOptions.CurrentValue.BaseUrl,
            inspect.RunId.ToString("D"),
            inspect.FindingId);

        string organizationBaseUrl = credentials.InstanceBaseUrl.Trim().TrimEnd('/');
        string projectName = settingsRow.ProjectName.Trim();
        string workItemType = settingsRow.DefaultWorkItemType.Trim();
        Uri createUri = BuildCreateWorkItemUri(organizationBaseUrl, projectName, workItemType);

        AuthenticationHeaderValue? authorization = await _httpAuthenticator.TryCreateAuthorizationHeaderAsync(
            scope.TenantId,
            TenantItsmConnectorProvider.AzureBoards,
            credentials,
            cancellationToken).ConfigureAwait(false);

        if (authorization is null)
        {
            AuditEvent ev = ExternalTicketConnectorSupport.SkippedAudit(
                CreateSkippedAuditEventType,
                scope,
                inspect,
                "azure_boards_connector_authorization_unavailable");

            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.Skipped,
                UserMessage = "Azure Boards outbound connector credentials could not be authorized (check PAT settings).",
                AuditEvents = [ev]
            };
        }

        AzureBoardsOutboundIssueHttpResult http = await _azureBoardsClient.CreateWorkItemAsync(
            createUri,
            authorization,
            context.Summary,
            descriptionForVendor,
            priority.Value,
            settingsRow.AreaPath,
            settingsRow.IterationPath,
            settingsRow.DefaultTags,
            cancellationToken).ConfigureAwait(false);

        if (!http.Ok || string.IsNullOrWhiteSpace(http.WorkItemId))
        {
            AuditEvent ev = new()
            {
                EventType = CreateFailedAuditEventType,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = inspect.RunId,
                DataJson = JsonSerializer.Serialize(new
                {
                    findingId = inspect.FindingId,
                    statusCode = (int)http.StatusCode,
                    reason = http.ErrorDetail ?? "azure_boards_create_failed"
                })
            };

            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.VendorError,
                VendorStatusCode = (int)http.StatusCode,
                UserMessage = http.ErrorDetail ?? "Azure Boards work item create failed.",
                AuditEvents = [ev]
            };
        }

        try
        {
            Guid? findingRecordId =
                await ExternalTicketConnectorSupport
                    .ResolveFindingRecordIdForInspectAsync(_correlations, scope, inspect, cancellationToken)
                    .ConfigureAwait(false);

            await _correlations.RegisterAsync(
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    inspect.FindingId,
                    ProviderLabel,
                    http.WorkItemId,
                    http.RemoteId,
                    findingRecordId,
                    cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            AuditEvent ev = new()
            {
                EventType = CreateFailedAuditEventType,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = inspect.RunId,
                DataJson = JsonSerializer.Serialize(new
                {
                    findingId = inspect.FindingId,
                    workItemId = http.WorkItemId,
                    reason = "correlation_persist_failed",
                    error = ex.Message
                })
            };

            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.CorrelationPersistenceFailed,
                UserMessage = "Azure Boards work item was created but ArchLucid could not persist ITSM correlation.",
                ExternalKey = http.WorkItemId,
                AuditEvents = [ev]
            };
        }

        AuditEvent ok = new()
        {
            EventType = CreateSucceededAuditEventType,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = inspect.RunId,
            DataJson = JsonSerializer.Serialize(new
            {
                findingId = inspect.FindingId,
                workItemId = http.WorkItemId
            })
        };

        return new ItsmOutboundIssueCreationResult
        {
            Kind = ItsmOutboundCreateTerminalKind.Succeeded,
            ExternalKey = http.WorkItemId,
            UserMessage = "Azure Boards work item created.",
            AuditEvents = [ok]
        };
    }

    public async Task<string?> TryBuildBrowseUrlAsync(
        Guid tenantId,
        string externalKey,
        string? externalSysId,
        CancellationToken cancellationToken)
    {
        _ = externalSysId;

        if (string.IsNullOrWhiteSpace(externalKey))
            return null;

        TenantAzureBoardsOutboundSettings? settingsRow =
            await _azureBoardsSettings.TryGetAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (settingsRow is null || string.IsNullOrWhiteSpace(settingsRow.ProjectName))
            return null;

        string? baseUrl = await _credentialResolver
            .TryResolveInstanceBaseUrlAsync(tenantId, TenantItsmConnectorProvider.AzureBoards, cancellationToken)
            .ConfigureAwait(false);

        if (baseUrl is null)
            return null;

        string project = Uri.EscapeDataString(settingsRow.ProjectName.Trim());
        string workItemId = Uri.EscapeDataString(externalKey.Trim());

        return $"{baseUrl.Trim().TrimEnd('/')}/{project}/_workitems/edit/{workItemId}";
    }

    public async Task<ExternalTicketConnectorConfigValidationResult> ValidateConfigurationAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        ResolvedItsmOutboundCredentials? credentials = await _credentialResolver
            .TryResolveOutboundAsync(tenantId, TenantItsmConnectorProvider.AzureBoards, cancellationToken)
            .ConfigureAwait(false);

        if (credentials is null)
            return new ExternalTicketConnectorConfigValidationResult(false, "Azure Boards outbound credentials are not configured.");

        TenantAzureBoardsOutboundSettings? settingsRow =
            await _azureBoardsSettings.TryGetAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (settingsRow is null || string.IsNullOrWhiteSpace(settingsRow.ProjectName))
            return new ExternalTicketConnectorConfigValidationResult(false, ProjectNameMissingMessage);

        if (string.IsNullOrWhiteSpace(settingsRow.DefaultWorkItemType))
            return new ExternalTicketConnectorConfigValidationResult(false, WorkItemTypeMissingMessage);

        return new ExternalTicketConnectorConfigValidationResult(true, null);
    }

    internal static Uri BuildCreateWorkItemUri(string organizationBaseUrl, string projectName, string workItemType)
    {
        string encodedProject = Uri.EscapeDataString(projectName.Trim());
        string encodedWorkItemType = Uri.EscapeDataString(workItemType.Trim());

        return new Uri(
            $"{organizationBaseUrl.Trim().TrimEnd('/')}/{encodedProject}/_apis/wit/workitems/${encodedWorkItemType}?api-version=7.1");
    }
}
