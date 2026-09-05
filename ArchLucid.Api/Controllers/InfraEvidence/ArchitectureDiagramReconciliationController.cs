using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
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
[Route("v{version:apiVersion}/architecture/runs/{runId:guid}/diagrams")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class ArchitectureDiagramReconciliationController(
    IDiagramInfrastructureReconciliationService reconciliationService,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("reconcile")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Diagram reconciliation persists deterministic correspondence rows per run and snapshot.")]
    [ProducesResponseType(typeof(DiagramInfrastructureReconciliationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reconcile(
        Guid runId,
        [FromBody] DiagramInfrastructureReconciliationRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (runId == Guid.Empty)
        {
            return this.BadRequestProblem("RunId is required.", ProblemTypes.ValidationFailed);
        }

        if (request is null || request.SnapshotId == Guid.Empty)
        {
            return this.BadRequestProblem("SnapshotId is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();

        try
        {
            DiagramInfrastructureReconciliationResult result = await reconciliationService.ReconcileAsync(
                scope,
                runId,
                request,
                cancellationToken);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
    }

    [HttpGet("reconciliation")]
    [ProducesResponseType(typeof(DiagramInfrastructureReconciliationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReconciliation(
        Guid runId,
        [FromQuery] Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        if (runId == Guid.Empty || snapshotId == Guid.Empty)
        {
            return this.BadRequestProblem("RunId and snapshotId are required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();

        DiagramInfrastructureReconciliationResult? result = await reconciliationService.TryGetReconciliationAsync(
            scope,
            runId,
            snapshotId,
            cancellationToken);

        if (result is null)
        {
            return this.NotFoundProblem(
                "Diagram reconciliation was not found for the run and snapshot.",
                ProblemTypes.ResourceNotFound);
        }

        return Ok(result);
    }
}
