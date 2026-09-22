using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Contracts.Pilots;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Pilots;

public sealed partial class PilotsController
{
    [HttpGet("runs/{runId}/pilot-run-deltas")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(PilotRunDeltasResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetPilotRunDeltas(string runId, CancellationToken cancellationToken)
    {
        IActionResult? sealedGuardResult = await EnsureRunSealedManifestReadAllowedAsync(runId, cancellationToken);

        if (sealedGuardResult is not null)
            return sealedGuardResult;

        try
        {
            PilotRunDeltasResponse? response = await _pilots.TryGetPilotRunDeltasAsync(runId, cancellationToken);

            return response is null
                ? this.NotFoundProblem($"Run '{runId}' was not found (or is out of scope).", ProblemTypes.RunNotFound)
                : Ok(response);
        }
        catch (ConflictException ex)
        {
            return MapPilotPackSealedManifestConflict(ex);
        }
    }

    [HttpGet("runs/recent-deltas")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(RecentPilotRunDeltasResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetRecentDeltas(
        [FromQuery(Name = "count")] int? count,
        CancellationToken cancellationToken)
    {
        IActionResult? sealedGuardResult = await EnsurePilotRecentDeltasSealedManifestReadAllowedAsync(cancellationToken);

        if (sealedGuardResult is not null)
            return sealedGuardResult;

        try
        {
            RecentPilotRunDeltasResponse response = await _pilots.GetRecentDeltasAsync(count, cancellationToken);

            return Ok(response);
        }
        catch (ConflictException ex)
        {
            return MapPilotPackSealedManifestConflict(ex);
        }
    }
}
