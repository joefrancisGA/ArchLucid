using ArchLucid.Application.Analytics;
using ArchLucid.Contracts.Analytics;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Analytics;

[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/analytics/patterns")]
public sealed class PatternInsightsController(IPatternInsightsService patternInsightsService) : ControllerBase
{
    private readonly IPatternInsightsService _patternInsightsService =
        patternInsightsService ?? throw new ArgumentNullException(nameof(patternInsightsService));

    [HttpGet]
    [MutatingAuditExcluded("Read-only anonymized pattern library.")]
    [ProducesResponseType(typeof(IReadOnlyList<PatternInsightCard>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync(
        [FromQuery] string? industryVertical,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<PatternInsightCard> cards =
            await _patternInsightsService.ListPublishedAsync(industryVertical, cancellationToken).ConfigureAwait(false);

        return Ok(cards);
    }
}
