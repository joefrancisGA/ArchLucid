using System.Text.Json;

using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>Creates Jira issues / ServiceNow incidents from authority findings; persists ITSM correlation for inbound sync.</summary>
public sealed class ItsmOutboundIssueCreationService(
    IFindingInspectReadRepository findingInspectReadRepository,
    IItsmFindingCorrelationRepository correlations,
    ITenantItsmOutboundSettingsRepository tenantItsmOutboundSettings,
    IRunRepository runRepository,
    IArchitectureRequestRepository architectureRequests,
    IOptionsMonitor<IntegrationsItsmOutboundOptions> outboundOptions,
    JiraOutboundIssueClient jiraClient,
    ServiceNowOutboundIncidentClient serviceNowClient)
{
    private const string JiraProjectKeyMissingMessage = "Jira connector not configured: project key required.";

    private readonly IFindingInspectReadRepository _findingInspectReadRepository =
        findingInspectReadRepository ?? throw new ArgumentNullException(nameof(findingInspectReadRepository));

    private readonly IItsmFindingCorrelationRepository _correlations = correlations ?? throw new ArgumentNullException(nameof(correlations));

    private readonly ITenantItsmOutboundSettingsRepository _tenantItsmOutboundSettings =
        tenantItsmOutboundSettings ?? throw new ArgumentNullException(nameof(tenantItsmOutboundSettings));

    private readonly IRunRepository _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IArchitectureRequestRepository _architectureRequests =
        architectureRequests ?? throw new ArgumentNullException(nameof(architectureRequests));

    private readonly IOptionsMonitor<IntegrationsItsmOutboundOptions> _outboundOptions =
        outboundOptions ?? throw new ArgumentNullException(nameof(outboundOptions));

    private readonly JiraOutboundIssueClient _jiraClient = jiraClient ?? throw new ArgumentNullException(nameof(jiraClient));
    private readonly ServiceNowOutboundIncidentClient _serviceNowClient = serviceNowClient ?? throw new ArgumentNullException(nameof(serviceNowClient));

    public async Task<ItsmOutboundIssueCreationResult> TryCreateForFindingAsync(ItsmOutboundIssueProvider provider, ScopeContext scope, string findingId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(findingId);
        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("findingId is required.", nameof(findingId));
        FindingInspectResponse? inspect = await _findingInspectReadRepository.GetInspectAsync(scope, findingId, ct).ConfigureAwait(false);
        if (inspect is null)
        {
            string eventType = provider is ItsmOutboundIssueProvider.Jira
                ? AuditEventTypes.IntegrationJiraIssueCreateFailed
                : AuditEventTypes.IntegrationServiceNowIncidentCreateFailed;
            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.VendorError,
                UserMessage = "Finding was not found in the current scope.",
                AuditEvents =
                [
                    new AuditEvent
                    {
                        EventType = eventType,
                        TenantId = scope.TenantId,
                        WorkspaceId = scope.WorkspaceId,
                        ProjectId = scope.ProjectId,
                        DataJson = JsonSerializer.Serialize(new { findingId = findingId.Trim(), reason = "finding_not_found" })
                    }
                ]
            };
        }

        TenantItsmOutboundSettings? tenantRow = await _tenantItsmOutboundSettings.TryGetAsync(scope.TenantId, ct).ConfigureAwait(false);
        FindingSeverity severity = ItsmFindingAuthorityPayloadMapper.TryGetSeverity(inspect.TypedPayload, inspect.Severity);
        (string summary, string description) = ItsmFindingAuthorityPayloadMapper.BuildSummaryAndDescription(inspect.FindingId, inspect.RunId,
            inspect.TypedPayload, inspect.DecisionRuleName, inspect.RecommendedActions);
        return provider switch
        {
            ItsmOutboundIssueProvider.Jira => await TryJiraAsync(scope, inspect, tenantRow, severity, summary, description, ct).ConfigureAwait(false),
            ItsmOutboundIssueProvider.ServiceNow => await TryServiceNowAsync(scope, inspect, tenantRow, severity, summary, description, ct)
                .ConfigureAwait(false),
            _ => throw new ArgumentOutOfRangeException(nameof(provider), provider, null)
        };
    }

    private async Task<ItsmOutboundIssueCreationResult> TryJiraAsync(ScopeContext scope, FindingInspectResponse inspect, TenantItsmOutboundSettings? tenantRow,
        FindingSeverity severity, string summary, string description, CancellationToken ct)
    {
        IntegrationsItsmOutboundOptions outbound = _outboundOptions.CurrentValue;
        JiraItsmOutboundOptions jiraOpts = outbound.Jira;
        if (string.IsNullOrWhiteSpace(jiraOpts.CloudBaseUrl) || string.IsNullOrWhiteSpace(jiraOpts.ServiceAccountEmail) ||
            string.IsNullOrWhiteSpace(jiraOpts.ApiToken))
        {
            AuditEvent ev = SkippedAudit(AuditEventTypes.IntegrationJiraIssueCreateSkipped, scope, inspect, "jira_connector_missing_credentials");
            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.Skipped,
                UserMessage = "Jira outbound connector is not configured (base URL, email, and API token are required).",
                AuditEvents = [ev]
            };
        }

        string? projectKey = !string.IsNullOrWhiteSpace(tenantRow?.JiraProjectKeyOverride) ? tenantRow.JiraProjectKeyOverride : jiraOpts.DefaultProjectKey;
        if (string.IsNullOrWhiteSpace(projectKey))
        {
            AuditEvent ev = SkippedAudit(AuditEventTypes.IntegrationJiraIssueCreateSkipped, scope, inspect, JiraProjectKeyMissingMessage);
            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.Skipped,
                UserMessage = JiraProjectKeyMissingMessage,
                AuditEvents = [ev]
            };
        }

        bool sendInfo = tenantRow?.JiraSendInfoSeverity ?? false;
        string? priorityName = ItsmJiraPriorityAndIssueTypeResolver.TryJiraPriorityName(severity, sendInfo);
        if (priorityName is null)
        {
            AuditEvent ev = SkippedAudit(AuditEventTypes.IntegrationJiraIssueCreateSkipped, scope, inspect, "informational_severity_dropped");
            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.Skipped,
                UserMessage = "Informational findings do not create Jira issues unless tenant JiraSendInfoSeverity is enabled.",
                AuditEvents = [ev]
            };
        }

        string issueTypeName = ItsmJiraPriorityAndIssueTypeResolver.ResolveIssueTypeName(severity, tenantRow);
        JsonElement adf = JiraAdfDescriptionBuilder.BuildDescriptionField(description);
        string baseUrl = jiraOpts.CloudBaseUrl.Trim().TrimEnd('/');
        Uri issueUri = new($"{baseUrl}/rest/api/3/issue");
        JiraOutboundIssueHttpResult http = await _jiraClient.CreateIssueAsync(issueUri, jiraOpts.ServiceAccountEmail.Trim(), jiraOpts.ApiToken,
            projectKey.Trim(), summary, adf, issueTypeName, priorityName, ct).ConfigureAwait(false);
        if (!http.Ok || string.IsNullOrWhiteSpace(http.IssueKey))
        {
            AuditEvent ev = new()
            {
                EventType = AuditEventTypes.IntegrationJiraIssueCreateFailed,
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
            await _correlations.RegisterAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, inspect.FindingId, "Jira", http.IssueKey, http.RemoteId, ct)
                .ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            AuditEvent ev = new()
            {
                EventType = AuditEventTypes.IntegrationJiraIssueCreateFailed,
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
            EventType = AuditEventTypes.IntegrationJiraIssueCreateSucceeded,
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

    private async Task<ItsmOutboundIssueCreationResult> TryServiceNowAsync(ScopeContext scope, FindingInspectResponse inspect,
        TenantItsmOutboundSettings? tenantRow, FindingSeverity severity, string summary, string description, CancellationToken ct)
    {
        IntegrationsItsmOutboundOptions outbound = _outboundOptions.CurrentValue;
        ServiceNowItsmOutboundOptions sn = outbound.ServiceNow;
        if (string.IsNullOrWhiteSpace(sn.InstanceBaseUrl) || string.IsNullOrWhiteSpace(sn.Username) || string.IsNullOrWhiteSpace(sn.Password))
        {
            AuditEvent ev = SkippedAudit(AuditEventTypes.IntegrationServiceNowIncidentCreateSkipped, scope, inspect,
                "servicenow_connector_missing_credentials");
            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.Skipped,
                UserMessage = "ServiceNow outbound connector is not configured (instance base URL, username, and password are required).",
                AuditEvents = [ev]
            };
        }

        RunRecord? run = await _runRepository.GetByIdAsync(scope, inspect.RunId, ct).ConfigureAwait(false);
        if (run is null)
        {
            return MissingRunResult(scope, inspect);
        }

        string? systemName = null;
        if (!string.IsNullOrWhiteSpace(run.ArchitectureRequestId))
        {
            ArchitectureRequest? req = await _architectureRequests.GetByIdAsync(run.ArchitectureRequestId, ct).ConfigureAwait(false);
            systemName = req?.SystemName.Trim();
        }

        string instanceRoot = sn.InstanceBaseUrl.Trim().TrimEnd('/');
        Uri instanceUri = new(instanceRoot);
        (string urgency, string impact) = ServiceNowUrgencyImpactResolver.Resolve(severity);
        ServiceNowCmdbCiResolveResult cmdb = await _serviceNowClient.TryResolveCmdbCiApplSysIdAsync(instanceUri, sn.Username, sn.Password,
            systemName ?? string.Empty, tenantRow?.ServiceNowAutoCreateCmdbCi ?? false, ct).ConfigureAwait(false);
        if (cmdb.Fatal)
        {
            AuditEvent ev = new()
            {
                EventType = AuditEventTypes.IntegrationServiceNowIncidentCreateFailed,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = inspect.RunId,
                DataJson = JsonSerializer.Serialize(new
                {
                    findingId = inspect.FindingId,
                    stage = "cmdb_ci_lookup",
                    statusCode = cmdb.StatusCode.HasValue ? (int)cmdb.StatusCode.Value : (int?)null,
                    reason = cmdb.ErrorDetail ?? "cmdb_fatal"
                })
            };
            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.VendorError,
                VendorStatusCode = cmdb.StatusCode.HasValue ? (int)cmdb.StatusCode.Value : null,
                UserMessage = cmdb.ErrorDetail ?? "ServiceNow CMDB lookup failed.",
                AuditEvents = [ev]
            };
        }

        Uri incidentUri = new($"{instanceRoot}/api/now/table/incident");
        ServiceNowIncidentHttpResult http = await _serviceNowClient
            .CreateIncidentAsync(incidentUri, sn.Username, sn.Password, summary, description, urgency, impact, cmdb.SysId, ct).ConfigureAwait(false);
        if (!http.Ok || string.IsNullOrWhiteSpace(http.SysId))
        {
            AuditEvent ev = new()
            {
                EventType = AuditEventTypes.IntegrationServiceNowIncidentCreateFailed,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = inspect.RunId,
                DataJson = JsonSerializer.Serialize(new
                {
                    findingId = inspect.FindingId,
                    statusCode = (int)http.StatusCode,
                    reason = http.ErrorDetail ?? "servicenow_create_failed"
                })
            };
            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.VendorError,
                VendorStatusCode = (int)http.StatusCode,
                UserMessage = http.ErrorDetail ?? "ServiceNow incident create failed.",
                AuditEvents = [ev]
            };
        }

        try
        {
            await _correlations.RegisterAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, inspect.FindingId, "ServiceNow", http.SysId, http.Number, ct)
                .ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            AuditEvent ev = new()
            {
                EventType = AuditEventTypes.IntegrationServiceNowIncidentCreateFailed,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = inspect.RunId,
                DataJson = JsonSerializer.Serialize(new
                {
                    findingId = inspect.FindingId,
                    sysId = http.SysId,
                    reason = "correlation_persist_failed",
                    error = ex.Message
                })
            };
            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.CorrelationPersistenceFailed,
                ExternalKey = http.SysId,
                UserMessage = "ServiceNow incident was created but ArchLucid could not persist ITSM correlation.",
                AuditEvents = [ev]
            };
        }

        AuditEvent ok = new()
        {
            EventType = AuditEventTypes.IntegrationServiceNowIncidentCreateSucceeded,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = inspect.RunId,
            DataJson = JsonSerializer.Serialize(new
            {
                findingId = inspect.FindingId,
                sysId = http.SysId,
                number = http.Number
            })
        };
        return new ItsmOutboundIssueCreationResult
        {
            Kind = ItsmOutboundCreateTerminalKind.Succeeded,
            ExternalKey = http.SysId,
            UserMessage = "ServiceNow incident created.",
            AuditEvents = [ok]
        };
    }

    private static ItsmOutboundIssueCreationResult MissingRunResult(ScopeContext scope, FindingInspectResponse inspect)
    {
        AuditEvent ev = new()
        {
            EventType = AuditEventTypes.IntegrationServiceNowIncidentCreateFailed,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = inspect.RunId,
            DataJson = JsonSerializer.Serialize(new
            {
                findingId = inspect.FindingId,
                reason = "run_not_found"
            })
        };
        return new ItsmOutboundIssueCreationResult
        {
            Kind = ItsmOutboundCreateTerminalKind.VendorError,
            UserMessage = "Owning run was not found for this finding.",
            AuditEvents = [ev]
        };
    }

    private static AuditEvent SkippedAudit(string eventType, ScopeContext scope, FindingInspectResponse inspect, string reason)
    {
        return new AuditEvent
        {
            EventType = eventType,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = inspect.RunId,
            DataJson = JsonSerializer.Serialize(new { findingId = inspect.FindingId, reason })
        };
    }
}
