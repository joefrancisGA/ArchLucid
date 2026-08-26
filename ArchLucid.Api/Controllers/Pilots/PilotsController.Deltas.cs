using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Pilots;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Pilots;

public sealed partial class PilotsController
{
    [HttpGet("runs/{runId}/pilot-run-deltas")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(PilotRunDeltasResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPilotRunDeltas(string runId, CancellationToken cancellationToken)
    {
        PilotRunDeltasResponse? response = await _pilots.TryGetPilotRunDeltasAsync(runId, cancellationToken);

        return response is null
            ? this.NotFoundProblem($"Run '{runId}' was not found (or is out of scope).", ProblemTypes.RunNotFound)
            : Ok(response);
    }

    [HttpGet("runs/recent-deltas")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(RecentPilotRunDeltasResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<RecentPilotRunDeltasResponse>> GetRecentDeltas(
        [FromQuery(Name = "count")] int? count,
        CancellationToken cancellationToken)
    {
        RecentPilotRunDeltasResponse response = await _pilots.GetRecentDeltasAsync(count, cancellationToken);

        return Ok(response);
    }
}
