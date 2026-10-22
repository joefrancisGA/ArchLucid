// Intentional Tier C sync regression fixture for TB-2079 unit tests only.
// Not compiled into ArchLucid.Api — scanned when check_api_latency_tiers.py --include-regression-fixture.
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Fixtures;

[ApiController]
[Route("v{version:apiVersion}/architecture")]
public sealed class TierCSyncRegressionController : ControllerBase
{
    // Missing AsyncRequired marker and Status202Accepted — CI must fail this route.
    [HttpPost("review/{runId}/bogus-long/async")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult BogusLongAsync([FromRoute] string runId) => Ok(new { runId });
}
