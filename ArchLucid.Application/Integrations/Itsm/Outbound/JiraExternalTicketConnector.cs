using System.Net.Http.Headers;
using System.Text.Json;

using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Persistence.Integrations;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

public sealed class JiraExternalTicketConnector(
    IItsmFindingCorrelationRepository correlations,
    IItsmTenantConnectorCredentialResolver credentialResolver,
    IOptionsMonitor<IntegrationsItsmOutboundOptions> outboundOptions,
    IOptionsMonitor<PublicSiteOptions> publicSiteOptions,
    ITenantItsmOutboundSettingsRepository tenantItsmOutboundSettings,
    JiraOutboundIssueClient jiraClient,
    IItsmOutboundHttpAuthenticator httpAuthenticator) : IExternalTicketConnector
{
    private const string ProjectKeyMissingMessage = "Jira connector not configured: project key required.";

    private readonly IItsmFindingCorrelationRepository _correlations =
        correlations ?? throw new ArgumentNullException(nameof(correlations));

    private readonly IItsmTenantConnectorCredentialResolver _credentialResolver =
        credentialResolver ?? throw new ArgumentNullException(nameof(credentialResolver));

    private readonly IOptionsMonitor<IntegrationsItsmOutboundOptions> _outboundOptions =
        outboundOptions ?? throw new ArgumentNullException(nameof(outboundOptions));

    private readonly IOptionsMonitor<PublicSiteOptions> _publicSiteOptions =
        publicSiteOptions ?? throw new ArgumentNullException(nameof(publicSiteOptions));

    private readonly ITenantItsmOutboundSettingsRepository _tenantItsmOutboundSettings =
        tenantItsmOutboundSettings ?? throw new ArgumentNullException(nameof(tenantItsmOutboundSettings));

    private readonly JiraOutboundIssueClient _jiraClient = jiraClient ?? throw new ArgumentNullException(nameof(jiraClient));

    private readonly IItsmOutboundHttpAuthenticator _httpAuthenticator =
        httpAuthenticator ?? throw new ArgumentNullException(nameof(httpAuthenticator));

    public ItsmOutboundIssueProvider ProviderId => ItsmOutboundIssueProvider.Jira;

    public string ProviderLabel => "Jira";

    public string CreateFailedAuditEventType => AuditEventTypes.IntegrationJiraIssueCreateFailed;

    public string CreateSkippedAuditEventType => AuditEventTypes.IntegrationJiraIssueCreateSkipped;

    public string CreateSucceededAuditEventType => AuditEventTypes.IntegrationJiraIssueCreateSucceeded;

    public async Task<ItsmOutboundIssueCreationResult> TryCreateForFindingAsync(
        ExternalTicketCreateContext context,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);
        ScopeContext scope = context.Scope;
        FindingInspectResponse inspect = context.Inspect;

        ResolvedItsmOutboundCredentials? credentials = await _credentialResolver
            .TryResolveOutboundAsync(scope.TenantId, TenantItsmConnectorProvider.Jira, cancellationToken)
            .ConfigureAwait(false);

        if (credentials is null)
        {
            AuditEvent ev = ExternalTicketConnectorSupport.SkippedAudit(
                CreateSkippedAuditEventType,
                scope,
                inspect,
                "jira_connector_missing_credentials");

            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.Skipped,
                UserMessage = "Jira outbound connector is not configured (base URL, email, and API token are required).",
                AuditEvents = [ev]
            };
        }

        TenantItsmOutboundSettings? tenantRow = context.TenantSettings
            ?? await _tenantItsmOutboundSettings.TryGetAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        IntegrationsItsmOutboundOptions outbound = _outboundOptions.CurrentValue;
        string? projectKey = !string.IsNullOrWhiteSpace(tenantRow?.JiraProjectKeyOverride)
            ? tenantRow.JiraProjectKeyOverride
            : outbound.Jira.DefaultProjectKey;

        if (string.IsNullOrWhiteSpace(projectKey))
        {
            AuditEvent ev = ExternalTicketConnectorSupport.SkippedAudit(
                CreateSkippedAuditEventType,
                scope,
                inspect,
                ProjectKeyMissingMessage);

            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.Skipped,
                UserMessage = ProjectKeyMissingMessage,
                AuditEvents = [ev]
            };
        }

        bool sendInfo = tenantRow?.JiraSendInfoSeverity ?? false;
        string? priorityName = ItsmJiraPriorityAndIssueTypeResolver.TryJiraPriorityName(context.Severity, sendInfo);

        if (priorityName is null)
        {
            AuditEvent ev = ExternalTicketConnectorSupport.SkippedAudit(
                CreateSkippedAuditEventType,
                scope,
                inspect,
                "informational_severity_dropped");

            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.Skipped,
                UserMessage = "Informational findings do not create Jira issues unless tenant JiraSendInfoSeverity is enabled.",
                AuditEvents = [ev]
            };
        }

        string issueTypeName = ItsmJiraPriorityAndIssueTypeResolver.ResolveIssueTypeName(context.Severity, tenantRow);
        string descriptionForVendor = ItsmOutboundArchLucidDeepLinkAppender.AppendFindingDeepLink(
            context.Description,
            _publicSiteOptions.CurrentValue.BaseUrl,
            inspect.RunId.ToString("D"),
            inspect.FindingId);
        JsonElement adf = JiraAdfDescriptionBuilder.BuildDescriptionField(descriptionForVendor);
        string baseUrl = credentials.InstanceBaseUrl.Trim().TrimEnd('/');
        Uri issueUri = new($"{baseUrl}/rest/api/3/issue");
        AuthenticationHeaderValue? authorization = await _httpAuthenticator.TryCreateAuthorizationHeaderAsync(
            scope.TenantId,
            TenantItsmConnectorProvider.Jira,
            credentials,
            cancellationToken).ConfigureAwait(false);

        if (authorization is null)
        {
            AuditEvent ev = ExternalTicketConnectorSupport.SkippedAudit(
                CreateSkippedAuditEventType,
                scope,
                inspect,
                "jira_connector_authorization_unavailable");

            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.Skipped,
                UserMessage = "Jira outbound connector credentials could not be authorized (check API token or OAuth settings).",
                AuditEvents = [ev]
            };
        }

        JiraOutboundIssueHttpResult http = await _jiraClient.CreateIssueAsync(
            issueUri,
            authorization,
            projectKey.Trim(),
            context.Summary,
            adf,
            issueTypeName,
            priorityName,
            cancellationToken,
            inspect.AssignedToUserId,
            ItsmOutboundVendorRemediationFields.FormatJiraDueDate(inspect.RemediationDueUtc)).ConfigureAwait(false);

        if (!http.Ok || string.IsNullOrWhiteSpace(http.IssueKey))
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
                    reason = http.ErrorDetail ?? "jira_create_failed"
                })
            };

            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.VendorError,
                VendorStatusCode = (int)http.StatusCode,
                UserMessage = http.ErrorDetail ?? "Jira issue create failed.",
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
                    http.IssueKey,
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
                    issueKey = http.IssueKey,
                    reason = "correlation_persist_failed",
                    error = ex.Message
                })
            };

            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.CorrelationPersistenceFailed,
                UserMessage = "Jira issue was created but ArchLucid could not persist ITSM correlation.",
                ExternalKey = http.IssueKey,
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
                issueKey = http.IssueKey
            })
        };

        return new ItsmOutboundIssueCreationResult
        {
            Kind = ItsmOutboundCreateTerminalKind.Succeeded,
            ExternalKey = http.IssueKey,
            UserMessage = "Jira issue created.",
            AuditEvents = [ok]
        };
    }

    public async Task<string?> TryBuildBrowseUrlAsync(
        Guid tenantId,
        string externalKey,
        string? externalSysId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(externalKey))
            return null;

        string? baseUrl = await _credentialResolver
            .TryResolveInstanceBaseUrlAsync(tenantId, TenantItsmConnectorProvider.Jira, cancellationToken)
            .ConfigureAwait(false);

        if (baseUrl is null)
            return null;

        return $"{baseUrl.Trim().TrimEnd('/')}/browse/{Uri.EscapeDataString(externalKey.Trim())}";
    }

    public async Task<ExternalTicketConnectorConfigValidationResult> ValidateConfigurationAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        ResolvedItsmOutboundCredentials? credentials = await _credentialResolver
            .TryResolveOutboundAsync(tenantId, TenantItsmConnectorProvider.Jira, cancellationToken)
            .ConfigureAwait(false);

        if (credentials is null)
            return new ExternalTicketConnectorConfigValidationResult(false, "Jira outbound credentials are not configured.");

        TenantItsmOutboundSettings? tenantRow = await _tenantItsmOutboundSettings.TryGetAsync(tenantId, cancellationToken).ConfigureAwait(false);
        IntegrationsItsmOutboundOptions outbound = _outboundOptions.CurrentValue;
        string? projectKey = !string.IsNullOrWhiteSpace(tenantRow?.JiraProjectKeyOverride)
            ? tenantRow.JiraProjectKeyOverride
            : outbound.Jira.DefaultProjectKey;

        if (string.IsNullOrWhiteSpace(projectKey))
            return new ExternalTicketConnectorConfigValidationResult(false, ProjectKeyMissingMessage);

        return new ExternalTicketConnectorConfigValidationResult(true, null);
    }
}
