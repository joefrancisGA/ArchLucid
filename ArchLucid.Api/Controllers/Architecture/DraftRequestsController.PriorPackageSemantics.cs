using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Architecture;

public sealed partial class DraftRequestsController
{
    /// <summary>Preview semantic inheritance counts for a prior committed package (TB-2350).</summary>
    [HttpGet("prior-package-semantics")]
    [ProducesResponseType(typeof(PriorPackageSemanticCountsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPriorPackageSemantics(
        [FromQuery] string priorRunId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(priorRunId))
            return this.BadRequestProblem("priorRunId is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        IActionResult? sealedGuardResult =
            await EnsureDraftIntakeSealedManifestReadAllowedAsync(scope, cancellationToken);

        if (sealedGuardResult is not null)
            return sealedGuardResult;

        PriorPackageSemanticCountsDto? counts = await _priorPackageSemanticMergeService
            .GetPriorPackageSemanticCountsAsync(scope, priorRunId, cancellationToken);

        if (counts is null)
            return NotFound();

        return Ok(counts);
    }
}
