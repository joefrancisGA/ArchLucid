using ArchLucid.Api.Attributes;
using ArchLucid.Application.Common;
using ArchLucid.Application.InfraEvidence.RemediationMetrics;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.OperationalSecurity;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/operational-security/remediation-metrics")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class RemediationFactoryMetricsController(
    IRemediationFactoryMetricsService metricsService,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(RemediationFactoryMetrics), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationFactoryMetrics metrics = await metricsService.GetMetricsAsync(scope, cancellationToken);

        return Ok(metrics);
    }
}
