using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Integrations;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Integrations.Itsm;

public sealed class TenantItsmOutboundSettingsService(
    ITenantItsmOutboundSettingsRepository repository,
    IOptionsMonitor<IntegrationsItsmOutboundOptions> outboundOptions,
    ItsmNativeIntegrationGate nativeIntegrationGate) : ITenantItsmOutboundSettingsService
{
    private readonly ITenantItsmOutboundSettingsRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly IOptionsMonitor<IntegrationsItsmOutboundOptions> _outboundOptions =
        outboundOptions ?? throw new ArgumentNullException(nameof(outboundOptions));

    private readonly ItsmNativeIntegrationGate _nativeIntegrationGate =
        nativeIntegrationGate ?? throw new ArgumentNullException(nameof(nativeIntegrationGate));

    public async Task<TenantItsmOutboundSettingsResponse> GetAsync(ScopeContext scope, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        TenantItsmOutboundSettings? row =
            await _repository.TryGetAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        return MapResponse(scope.TenantId, row);
    }

    public async Task<TenantItsmOutboundSettingsResponse> UpsertAsync(
        ScopeContext scope,
        TenantItsmOutboundSettingsUpsertRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        TenantItsmOutboundSettings? existing =
            await _repository.TryGetAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        TenantItsmOutboundSettings merged = new()
        {
            JiraProjectKeyOverride = request.JiraProjectKeyOverride is null
                ? existing?.JiraProjectKeyOverride
                : string.IsNullOrWhiteSpace(request.JiraProjectKeyOverride)
                    ? null
                    : request.JiraProjectKeyOverride.Trim(),
            JiraSendInfoSeverity = request.JiraSendInfoSeverity ?? existing?.JiraSendInfoSeverity ?? false,
            JiraIssueTypeBySeverityJson = request.JiraIssueTypeBySeverityJson is null
                ? existing?.JiraIssueTypeBySeverityJson
                : string.IsNullOrWhiteSpace(request.JiraIssueTypeBySeverityJson)
                    ? null
                    : request.JiraIssueTypeBySeverityJson.Trim(),
            ServiceNowAutoCreateCmdbCi = request.ServiceNowAutoCreateCmdbCi ?? existing?.ServiceNowAutoCreateCmdbCi ?? false,
        };

        TenantItsmOutboundSettings saved =
            await _repository.UpsertAsync(scope.TenantId, merged, cancellationToken).ConfigureAwait(false);

        return MapResponse(scope.TenantId, saved);
    }

    private TenantItsmOutboundSettingsResponse MapResponse(Guid tenantId, TenantItsmOutboundSettings? row)
    {
        IntegrationsItsmOutboundOptions outbound = _outboundOptions.CurrentValue;

        ItsmOutboundLocalReadiness jiraLocal =
            ItsmOutboundLocalConfigurationEvaluator.EvaluateJira(outbound, row);

        ItsmOutboundLocalReadiness snowLocal =
            ItsmOutboundLocalConfigurationEvaluator.EvaluateServiceNow(outbound);

        bool jiraCreds = !string.IsNullOrWhiteSpace(outbound.Jira.ApiToken.Trim()) &&
                         !string.IsNullOrWhiteSpace(outbound.Jira.ServiceAccountEmail.Trim());

        bool snowCreds = !string.IsNullOrWhiteSpace(outbound.ServiceNow.Username.Trim()) &&
                         !string.IsNullOrWhiteSpace(outbound.ServiceNow.Password.Trim());

        return new TenantItsmOutboundSettingsResponse
        {
            TenantId = tenantId,
            HasTenantOverrides = row is not null,
            JiraProjectKeyOverride = row?.JiraProjectKeyOverride,
            JiraSendInfoSeverity = row?.JiraSendInfoSeverity ?? false,
            JiraIssueTypeBySeverityJson = row?.JiraIssueTypeBySeverityJson,
            ServiceNowAutoCreateCmdbCi = row?.ServiceNowAutoCreateCmdbCi ?? false,
            NativeEnabled = _nativeIntegrationGate.IsNativeCreateEnabled(),
            DeploymentCredentials = new TenantItsmDeploymentCredentialSummary
            {
                JiraConfigured = jiraLocal.IsReady || jiraCreds,
                JiraServiceAccountEmailMasked =
                    TenantItsmCredentialMasking.MaskEmail(outbound.Jira.ServiceAccountEmail),
                ServiceNowConfigured = snowLocal.IsReady || snowCreds,
                ServiceNowUsernameMasked =
                    TenantItsmCredentialMasking.MaskUsername(outbound.ServiceNow.Username),
            },
        };
    }
}
