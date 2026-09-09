using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

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
public sealed partial class ArchitectureDiagramIngestController(
    IStructuredDiagramIngestService ingestService,
    IScopeContextProvider scopeProvider,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService) : ControllerBase
{
    private readonly IStructuredDiagramIngestService _ingestService =
        ingestService ?? throw new ArgumentNullException(nameof(ingestService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("ingest")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Structured diagram ingest persists ArchitectureDiagramModel per run; mutation is the persisted model row.")]
    [ProducesResponseType(typeof(StructuredDiagramIngestResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
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

        IActionResult? sealedGuardResult = await EnsureRunSealedManifestAllowedAsync(runId, cancellationToken);

        if (sealedGuardResult is not null)
            return sealedGuardResult;

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            StructuredDiagramIngestResult result = await _ingestService.IngestAsync(
                scope,
                runId,
                request,
                cancellationToken);

            return Ok(result);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
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

        IActionResult? sealedGuardResult = await EnsureRunSealedManifestAllowedAsync(runId, cancellationToken);

        if (sealedGuardResult is not null)
            return sealedGuardResult;

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            ArchitectureDiagramModelRecord? model = await _ingestService.TryGetModelAsync(scope, runId, cancellationToken);

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
