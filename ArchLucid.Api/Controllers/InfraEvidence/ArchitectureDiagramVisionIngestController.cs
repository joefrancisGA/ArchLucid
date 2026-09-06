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
public sealed class ArchitectureDiagramVisionIngestController(
    IVisionDiagramIngestService ingestService,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("vision-ingest")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [FeatureGate(FeatureGateKey.DiagramVisionEnabled)]
    [MutatingAuditExcluded("Vision diagram ingest persists AI-interpreted ArchitectureDiagramModel; not observed Azure inventory.")]
    [ProducesResponseType(typeof(VisionDiagramIngestResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> VisionIngest(
        Guid runId,
        [FromBody] VisionDiagramIngestRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (runId == Guid.Empty)
        {
            return this.BadRequestProblem("RunId is required.", ProblemTypes.ValidationFailed);
        }

        if (request is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();

        try
        {
            VisionDiagramIngestResult result = await ingestService.IngestAsync(
                scope,
                runId,
                request,
                cancellationToken);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not configured", StringComparison.OrdinalIgnoreCase))
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }
}
