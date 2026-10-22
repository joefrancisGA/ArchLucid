using ArchLucid.Application.Analytics;
using ArchLucid.Contracts.Analytics;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace ArchLucid.Api.Controllers.Analytics;

[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/analytics/patterns")]
public sealed class PatternInsightsController(
    IPatternInsightsService patternInsightsService,
    IAuditService auditService) : ControllerBase
{
    private readonly IPatternInsightsService _patternInsightsService =
        patternInsightsService ?? throw new ArgumentNullException(nameof(patternInsightsService));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    [HttpGet]
    [MutatingAuditExcluded("Read-only anonymized pattern library.")]
    [ProducesResponseType(typeof(IReadOnlyList<PatternInsightCard>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync(
        [FromQuery] string? industryVertical,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<PatternInsightCard> cards =
            await _patternInsightsService.ListPublishedAsync(industryVertical, cancellationToken).ConfigureAwait(false);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.PatternInsightsListed,
                DataJson = JsonSerializer.Serialize(new
                {
                    cardCount = cards.Count,
                    industryVertical,
                }),
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(cards);
    }
}
