using System.Net.Http.Headers;
using System.Text.Json;

using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

public sealed class ServiceNowExternalTicketConnector(
    IItsmFindingCorrelationRepository correlations,
    IItsmTenantConnectorCredentialResolver credentialResolver,
    IOptionsMonitor<PublicSiteOptions> publicSiteOptions,
    IRunRepository runRepository,
    IArchitectureRequestRepository architectureRequests,
    ServiceNowOutboundIncidentClient serviceNowClient,
    IItsmOutboundHttpAuthenticator httpAuthenticator) : ExternalTicketCreatePipeline, IExternalTicketConnector
{
    private readonly IItsmFindingCorrelationRepository _correlations =
        correlations ?? throw new ArgumentNullException(nameof(correlations));

    private readonly IItsmTenantConnectorCredentialResolver _credentialResolver =
        credentialResolver ?? throw new ArgumentNullException(nameof(credentialResolver));

    private readonly IOptionsMonitor<PublicSiteOptions> _publicSiteOptions =
        publicSiteOptions ?? throw new ArgumentNullException(nameof(publicSiteOptions));

    private readonly IRunRepository _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IArchitectureRequestRepository _architectureRequests =
        architectureRequests ?? throw new ArgumentNullException(nameof(architectureRequests));

    private readonly ServiceNowOutboundIncidentClient _serviceNowClient =
        serviceNowClient ?? throw new ArgumentNullException(nameof(serviceNowClient));

    private readonly IItsmOutboundHttpAuthenticator _httpAuthenticator =
        httpAuthenticator ?? throw new ArgumentNullException(nameof(httpAuthenticator));

    public ItsmOutboundIssueProvider ProviderId => ItsmOutboundIssueProvider.ServiceNow;

    public string ProviderLabel => PipelineProviderLabel;

    protected override string PipelineProviderLabel => "ServiceNow";

    public string CreateFailedAuditEventType => PipelineCreateFailedAuditEventType;

    protected override string PipelineCreateFailedAuditEventType => AuditEventTypes.IntegrationServiceNowIncidentCreateFailed;

    public string CreateSkippedAuditEventType => AuditEventTypes.IntegrationServiceNowIncidentCreateSkipped;

    public string CreateSucceededAuditEventType => PipelineCreateSucceededAuditEventType;

    protected override string PipelineCreateSucceededAuditEventType => AuditEventTypes.IntegrationServiceNowIncidentCreateSucceeded;

    public async Task<ItsmOutboundIssueCreationResult> TryCreateForFindingAsync(
        ExternalTicketCreateContext context,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);
        ScopeContext scope = context.Scope;
        FindingInspectResponse inspect = context.Inspect;

        ResolvedItsmOutboundCredentials? credentials = await _credentialResolver
            .TryResolveOutboundAsync(scope.TenantId, TenantItsmConnectorProvider.ServiceNow, cancellationToken)
            .ConfigureAwait(false);

        if (credentials is null)
        {
            AuditEvent ev = ExternalTicketConnectorSupport.SkippedAudit(
                CreateSkippedAuditEventType,
                scope,
                inspect,
                "servicenow_connector_missing_credentials");

            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.Skipped,
                UserMessage = "ServiceNow outbound connector is not configured (instance base URL, username, and password are required).",
                AuditEvents = [ev]
            };
        }

        RunRecord? run = await _runRepository.GetByIdAsync(scope, inspect.RunId, cancellationToken).ConfigureAwait(false);

        if (run is null)
            return MissingRunResult(scope, inspect);

        string? systemName = null;

        if (!string.IsNullOrWhiteSpace(run.ArchitectureRequestId))
        {
            ArchitectureRequest? req = await _architectureRequests.GetByIdAsync(run.ArchitectureRequestId, cancellationToken).ConfigureAwait(false);
            systemName = req?.SystemName.Trim();
        }

        string instanceRoot = credentials.InstanceBaseUrl.Trim().TrimEnd('/');
        Uri instanceUri = new(instanceRoot);
        AuthenticationHeaderValue? authorization = await _httpAuthenticator.TryCreateAuthorizationHeaderAsync(
            scope.TenantId,
            TenantItsmConnectorProvider.ServiceNow,
            credentials,
            cancellationToken).ConfigureAwait(false);

        if (authorization is null)
        {
            AuditEvent ev = ExternalTicketConnectorSupport.SkippedAudit(
                CreateSkippedAuditEventType,
                scope,
                inspect,
                "servicenow_connector_authorization_unavailable");

            return new ItsmOutboundIssueCreationResult
            {
                Kind = ItsmOutboundCreateTerminalKind.Skipped,
                UserMessage = "ServiceNow outbound connector credentials could not be authorized (check password or OAuth settings).",
                AuditEvents = [ev]
            };
        }

        (string urgency, string impact) = ServiceNowUrgencyImpactResolver.Resolve(context.Severity);
        ServiceNowCmdbCiResolveResult cmdb = await _serviceNowClient.TryResolveCmdbCiApplSysIdAsync(
            instanceUri,
            authorization,
            systemName ?? string.Empty,
            context.TenantSettings?.ServiceNowAutoCreateCmdbCi ?? false,
            cancellationToken).ConfigureAwait(false);

        if (cmdb.Fatal)
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
        string descriptionForVendor = ItsmOutboundArchLucidDeepLinkAppender.AppendFindingDeepLink(
            context.Description,
            _publicSiteOptions.CurrentValue.BaseUrl,
            inspect.RunId.ToString("D"),
            inspect.FindingId);
        ServiceNowIncidentHttpResult http = await _serviceNowClient
            .CreateIncidentAsync(
                incidentUri,
                authorization,
                context.Summary,
                descriptionForVendor,
                urgency,
                impact,
                cmdb.SysId,
                cancellationToken,
                inspect.AssignedToUserId,
                ItsmOutboundVendorRemediationFields.FormatServiceNowDueDate(inspect.RemediationDueUtc)).ConfigureAwait(false);

        if (!http.Ok || string.IsNullOrWhiteSpace(http.SysId))
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

        return await RegisterCorrelationOrReturnPersistenceFailureAsync(
            _correlations,
            scope,
            inspect,
            http.SysId,
            http.Number,
            cancellationToken);
    }

    public async Task<string?> TryBuildBrowseUrlAsync(
        Guid tenantId,
        string externalKey,
        string? externalSysId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(externalSysId))
            return null;

        string? baseUrl = await _credentialResolver
            .TryResolveInstanceBaseUrlAsync(tenantId, TenantItsmConnectorProvider.ServiceNow, cancellationToken)
            .ConfigureAwait(false);

        if (baseUrl is null)
            return null;

        return $"{baseUrl.Trim().TrimEnd('/')}/nav_to.do?uri=incident.do?sys_id={Uri.EscapeDataString(externalSysId.Trim())}";
    }

    public async Task<ExternalTicketConnectorConfigValidationResult> ValidateConfigurationAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        ResolvedItsmOutboundCredentials? credentials = await _credentialResolver
            .TryResolveOutboundAsync(tenantId, TenantItsmConnectorProvider.ServiceNow, cancellationToken)
            .ConfigureAwait(false);

        if (credentials is null)
            return new ExternalTicketConnectorConfigValidationResult(false, "ServiceNow outbound credentials are not configured.");

        return new ExternalTicketConnectorConfigValidationResult(true, null);
    }

    private ItsmOutboundIssueCreationResult MissingRunResult(ScopeContext scope, FindingInspectResponse inspect)
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
}
