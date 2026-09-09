using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.ArchitectureIntelligence;

public sealed partial class ArchitectureIntelligenceController
{
    /// <summary>
    /// Loads product review intake (description + documents) as ArchitectureIntelligence source texts.
    /// Does not run reasoning — clients hydrate then POST /run with the same runId for publish round-trip.
    /// </summary>
    [HttpGet("product-runs/{runId}/source-context")]
    [ProducesResponseType(typeof(ClosedLoopReasoningRequest), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetProductRunSourceContextAsync(
        [FromRoute] string runId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(runId))
        {
            return this.BadRequestProblem("RunId is required.", ProblemTypes.ValidationFailed);
        }

        if (Guid.TryParse(runId, out Guid runGuid))
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            RunDetailDto? detail = await _authorityQueryService.GetRunDetailAsync(scope, runGuid, cancellationToken);

            if (detail?.GoldenManifest is not null)
            {
                try
                {
                    SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
                        detail.GoldenManifest,
                        runGuid.ToString("D"),
                        _manifestHashService);
                }
                catch (ConflictException ex)
                {
                    return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
                }
            }
        }

        ArchitectureIntelligenceProductRunSourceContextLoadResult loaded =
            await _productRunSourceContextLoader.LoadAsync(runId, cancellationToken);

        if (!loaded.Found)
        {
            return this.NotFoundProblem(
                loaded.Error ?? "Product run was not found.",
                ProblemTypes.RunNotFound);
        }

        if (!loaded.HasContent || loaded.Request is null)
        {
            return this.BadRequestProblem(
                loaded.Error ?? "Product run has no loadable architecture content.",
                ProblemTypes.ValidationFailed);
        }

        return Ok(loaded.Request);
    }
}
