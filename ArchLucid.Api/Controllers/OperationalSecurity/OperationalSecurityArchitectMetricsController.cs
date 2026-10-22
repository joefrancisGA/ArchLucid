using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.InfraEvidence;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.OperationalSecurity;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/operational-security/architect-metrics")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class OperationalSecurityArchitectMetricsController(
    ISecureNowArchitectMetricsQueryService metricsQueryService,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(SecureNowArchitectOutcomeMetricsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOutcomeMetrics(
        [FromQuery] Guid fromSnapshotId,
        [FromQuery] Guid toSnapshotId,
        CancellationToken cancellationToken = default)
    {
        if (fromSnapshotId == Guid.Empty || toSnapshotId == Guid.Empty)
        {
            return this.BadRequestProblem(
                "fromSnapshotId and toSnapshotId are required.",
                ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();

        SecureNowArchitectOutcomeMetricsResponse? metrics = await metricsQueryService.TryGetOutcomeMetricsAsync(
            scope,
            fromSnapshotId,
            toSnapshotId,
            cancellationToken);

        if (metrics is null)
        {
            return this.NotFoundProblem(
                "Snapshot pair was not found in the current tenant scope.",
                ProblemTypes.ResourceNotFound);
        }

        return Ok(metrics);
    }
}
