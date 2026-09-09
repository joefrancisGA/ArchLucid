using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Findings;

public sealed partial class FindingMuteController
{
    /// <summary>Clears a relational mute for the finding on the given authority run.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpDelete("{findingId}/mute")]
    [MutatingAuditExcluded("Audit: finding unmute is a relational snapshot correction without a dedicated audit event type.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteMuteAsync(
        string findingId,
        [FromBody] FindingUnmuteRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (string.IsNullOrWhiteSpace(findingId))
            return this.BadRequestProblem("Finding id is required.", ProblemTypes.ValidationFailed);

        string trimmedId = findingId.Trim();

        if (trimmedId.Length > 64)
            return this.BadRequestProblem("Finding id exceeds maximum length (64).", ProblemTypes.ValidationFailed);

        if (request.RunId == Guid.Empty)
            return this.BadRequestProblem("Run id is required.", ProblemTypes.ValidationFailed);

        IActionResult? sealedGuardResult = await EnsureFindingMuteRunSealedManifestAllowedAsync(
            request.RunId,
            ct);

        if (sealedGuardResult is not null)
            return sealedGuardResult;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        bool updated = await _findingRecordMuteRepository.TryUnmuteAsync(
            request.RunId,
            trimmedId,
            scope,
            ct);

        if (!updated)
        {
            return this.NotFoundProblem(
                $"Finding '{trimmedId}' was not found for run '{request.RunId:D}' in the current scope, or is not muted.",
                ProblemTypes.ResourceNotFound);
        }

        return NoContent();
    }
}
