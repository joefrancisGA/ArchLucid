using ArchLucid.Api.Contracts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Exports;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class ArtifactExportController
{
    /// <summary>
    ///     Recomputes the golden manifest hash and compares it to the commit-time <c>ManifestGenerated</c> audit anchor.
    ///     Returns <c>200 OK</c> with status <c>Match</c>, <c>Mismatch</c>, or <c>NotAttested</c> (read-only; no repair).
    /// </summary>
    [HttpGet("reviews/{runId:guid}/export/verify")]
    [HttpGet("runs/{runId:guid}/export/verify")]
    [ProducesResponseType(typeof(RunExportLineageVerificationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> VerifyRunExportLineage(Guid runId, CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunExportLineageVerificationResult? result = await runExportLineageVerifier.VerifyAsync(scope, runId, ct);

        if (result is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        return Ok(RunExportLineageVerificationResponse.From(result));
    }
}
