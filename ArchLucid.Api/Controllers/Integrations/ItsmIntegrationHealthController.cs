using ArchLucid.Api.Attributes;
using ArchLucid.Api.Integrations.Itsm;
using ArchLucid.Api.Models.Integrations;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Integrations;

/// <summary>Stored outbound ITSM readiness on GET; live vendor probes on POST probe only.</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/integrations/itsm/health")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class ItsmIntegrationHealthController(
    IScopeContextProvider scopeProvider,
    IItsmOutboundIntegrationHealthService healthService,
    ItsmNativeIntegrationGate nativeIntegrationGate) : ControllerBase
{
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IItsmOutboundIntegrationHealthService _healthService =
        healthService ?? throw new ArgumentNullException(nameof(healthService));

    private readonly ItsmNativeIntegrationGate _nativeIntegrationGate =
        nativeIntegrationGate ?? throw new ArgumentNullException(nameof(nativeIntegrationGate));

    /// <summary>Returns stored local readiness for Jira / ServiceNow (no vendor REST on this route).</summary>
    [HttpGet]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(ItsmIntegrationHealthResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        ItsmOutboundIntegrationHealthReport report =
            await _healthService.GetStoredHealthAsync(scope, cancellationToken).ConfigureAwait(false);

        ItsmIntegrationHealthResponse body = ItsmIntegrationHealthResponseMapper.MapReport(
            report,
            _nativeIntegrationGate.IsNativeCreateEnabled());

        return Ok(body);
    }

    /// <summary>Issues lightweight read-only pings to configured Jira / ServiceNow endpoints.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("probe")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [MutatingAuditExcluded("Audit: read-only vendor connectivity probe; no persisted state change.")]
    [ProducesResponseType(typeof(ItsmIntegrationHealthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ItsmIntegrationHealthResponse), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> ProbeAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        ItsmOutboundIntegrationHealthReport report =
            await _healthService.GetHealthAsync(scope, cancellationToken).ConfigureAwait(false);

        ItsmIntegrationHealthResponse body = ItsmIntegrationHealthResponseMapper.MapReport(
            report,
            _nativeIntegrationGate.IsNativeCreateEnabled());

        if (report.Return503)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, body);

        return Ok(body);
    }
}
