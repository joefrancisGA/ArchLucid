using ArchLucid.Api.Attributes;
using ArchLucid.Api.Integrations.Itsm;
using ArchLucid.Api.Models.Integrations;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Integrations;

/// <summary>Per-provider ITSM integration page bundles (stored health + settings + connection).</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/integrations/itsm")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class ItsmProviderIntegrationPageController(
    IScopeContextProvider scopeProvider,
    IItsmOutboundIntegrationHealthService healthService,
    ITenantItsmOutboundSettingsService settingsService,
    ITenantItsmConnectorConnectionRepository connectionRepository,
    ItsmNativeIntegrationGate nativeIntegrationGate) : ControllerBase
{
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IItsmOutboundIntegrationHealthService _healthService =
        healthService ?? throw new ArgumentNullException(nameof(healthService));

    private readonly ITenantItsmOutboundSettingsService _settingsService =
        settingsService ?? throw new ArgumentNullException(nameof(settingsService));

    private readonly ITenantItsmConnectorConnectionRepository _connectionRepository =
        connectionRepository ?? throw new ArgumentNullException(nameof(connectionRepository));

    private readonly ItsmNativeIntegrationGate _nativeIntegrationGate =
        nativeIntegrationGate ?? throw new ArgumentNullException(nameof(nativeIntegrationGate));

    [HttpGet("{provider}/page-bundle")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(ItsmProviderIntegrationPageBundleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPageBundle(string provider, CancellationToken cancellationToken)
    {
        if (!TenantItsmConnectorConnectionUpsertValidation.TryParseProvider(
                provider,
                out TenantItsmConnectorProvider parsed,
                out string? parseError))
        {
            return this.BadRequestProblem(parseError!, ProblemTypes.ValidationFailed);
        }

        if (parsed is not (TenantItsmConnectorProvider.Jira or TenantItsmConnectorProvider.ServiceNow))
        {
            return this.BadRequestProblem(
                "page-bundle is only available for jira or servicenow.",
                ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        Task<ItsmOutboundIntegrationHealthReport> healthTask =
            _healthService.GetStoredHealthAsync(scope, cancellationToken);

        Task<TenantItsmOutboundSettingsResponse> settingsTask =
            _settingsService.GetAsync(scope, cancellationToken);

        Task<TenantItsmConnectorConnectionResponse> connectionTask =
            LoadConnectionAsync(scope.TenantId, parsed, cancellationToken);

        await Task.WhenAll(healthTask, settingsTask, connectionTask).ConfigureAwait(false);

        ItsmIntegrationHealthResponse healthVm = ItsmIntegrationHealthResponseMapper.MapReport(
            await healthTask.ConfigureAwait(false),
            _nativeIntegrationGate.IsNativeCreateEnabled());

        ItsmProviderIntegrationPageBundleResponse body = new()
        {
            Health = ItsmIntegrationHealthStatusResponseMapper.Map(healthVm),
            Settings = await settingsTask.ConfigureAwait(false),
            Connection = await connectionTask.ConfigureAwait(false)
        };

        return Ok(body);
    }

    private async Task<TenantItsmConnectorConnectionResponse> LoadConnectionAsync(
        Guid tenantId,
        TenantItsmConnectorProvider provider,
        CancellationToken cancellationToken)
    {
        TenantItsmConnectorConnectionRecord? row =
            await _connectionRepository.GetAsync(tenantId, provider, cancellationToken).ConfigureAwait(false);

        if (row is not null)
            return TenantItsmConnectorConnectionMapper.ToResponse(row);

        return TenantItsmConnectorConnectionMapper.Empty(tenantId, provider);
    }
}
