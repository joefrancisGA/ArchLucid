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

namespace ArchLucid.Api.Controllers.InfraEvidence;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/infra-evidence/remediation-factory")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class RemediationFactoryWorkbenchController(
    IRemediationFactoryWorkbenchQueryService workbenchQueryService,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    [HttpGet("summary")]
    [ProducesResponseType(typeof(RemediationFactoryWorkbenchSummary), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationFactoryWorkbenchSummary summary =
            await workbenchQueryService.GetSummaryAsync(scope, cancellationToken);

        return Ok(summary);
    }
}
