using ArchLucid.Application.Runs;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Operator soft-archive for in-flight architecture reviews.</summary>
public sealed partial class RunsController
{
    /// <summary>
    ///     Soft-archives an in-flight review so it is hidden from default lists. Sealed reviews with a committed golden
    ///     manifest cannot be archived.
    /// </summary>
    [HttpPost("runs/{runId:guid}/archive")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ArchiveRun(
        [FromRoute] Guid runId,
        [FromServices] IArchitectureRunArchiveService archiveService,
        CancellationToken cancellationToken)
    {
        ArchitectureRunArchiveOutcome outcome =
            await archiveService.TryArchiveAsync(runId, cancellationToken).ConfigureAwait(false);

        return outcome switch
        {
            ArchitectureRunArchiveOutcome.Archived or ArchitectureRunArchiveOutcome.AlreadyArchived => NoContent(),
            ArchitectureRunArchiveOutcome.NotFound => this.NotFoundProblem(
                $"Review '{runId:D}' was not found.",
                ProblemTypes.ResourceNotFound),
            ArchitectureRunArchiveOutcome.SealedReviewBlocked => this.BadRequestProblem(
                "Sealed reviews cannot be archived. Committed architecture packages and audit history remain until tenant offboarding.",
                ProblemTypes.ValidationFailed),
            _ => throw new InvalidOperationException($"Unhandled archive outcome '{outcome}'."),
        };
    }
}
