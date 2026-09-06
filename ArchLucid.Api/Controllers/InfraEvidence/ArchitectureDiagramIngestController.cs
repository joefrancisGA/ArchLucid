using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
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
public sealed class ArchitectureDiagramIngestController(
    IStructuredDiagramIngestService ingestService,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("ingest")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Structured diagram ingest persists ArchitectureDiagramModel per run; mutation is the persisted model row.")]
    [ProducesResponseType(typeof(StructuredDiagramIngestResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Ingest(
        Guid runId,
        [FromBody] StructuredDiagramIngestRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (runId == Guid.Empty)
        {
            return this.BadRequestProblem("RunId is required.", ProblemTypes.ValidationFailed);
        }

        if (request is null || request.Sources.Count == 0)
        {
            return this.BadRequestProblem("At least one diagram source is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();

        StructuredDiagramIngestResult result = await ingestService.IngestAsync(
            scope,
            runId,
            request,
            cancellationToken);

        return Ok(result);
    }

    [HttpGet("model")]
    [ProducesResponseType(typeof(ArchitectureDiagramModelRecord), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetModel(Guid runId, CancellationToken cancellationToken = default)
    {
        if (runId == Guid.Empty)
        {
            return this.BadRequestProblem("RunId is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();

        try
        {
            ArchitectureDiagramModelRecord? model = await ingestService.TryGetModelAsync(scope, runId, cancellationToken);

            if (model is null)
            {
                return this.NotFoundProblem("Architecture diagram model was not found.", ProblemTypes.ResourceNotFound);
            }

            return Ok(model);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
    }
}
