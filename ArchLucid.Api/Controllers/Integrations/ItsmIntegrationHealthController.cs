using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models.Integrations;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Integrations;

/// <summary>Live outbound ITSM connectivity probes (read-only vendor REST calls).</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/integrations/itsm/health")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class ItsmIntegrationHealthController(
    IScopeContextProvider scopeProvider,
    IItsmOutboundIntegrationHealthService healthService) : ControllerBase
{
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IItsmOutboundIntegrationHealthService _healthService =
        healthService ?? throw new ArgumentNullException(nameof(healthService));

    /// <summary>Issues lightweight read-only pings to configured Jira Cloud / ServiceNow Table API endpoints.</summary>
    [HttpGet]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(ItsmIntegrationHealthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ItsmIntegrationHealthResponse), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        ItsmOutboundIntegrationHealthReport report =
            await _healthService.GetHealthAsync(scope, cancellationToken).ConfigureAwait(false);

        ItsmIntegrationHealthResponse body = Map(report);

        if (report.Return503)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, body);

        return Ok(body);
    }

    private static ItsmIntegrationHealthResponse Map(ItsmOutboundIntegrationHealthReport report)
    {
        ArgumentNullException.ThrowIfNull(report);

        return new ItsmIntegrationHealthResponse
        {
            Status = report.Status,
            Jira = MapProbe(report.Jira),
            ServiceNow = MapProbe(report.ServiceNow),
        };
    }

    private static ItsmIntegrationHealthProbeVm MapProbe(ItsmOutboundIntegrationProviderProbe probe)
    {
        return new ItsmIntegrationHealthProbeVm
        {
            LocallyConfigured = probe.LocallyConfigured,
            Reachable = probe.Reachable,
            Summary = probe.Summary,
        };
    }
}
