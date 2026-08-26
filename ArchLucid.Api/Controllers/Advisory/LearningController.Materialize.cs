using System.Text.Json;

using ArchLucid.Api.Learning;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.ProductLearning;
using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Advisory;

public sealed partial class LearningController
{
    /// <summary>
    ///     Persists deterministic themes and bounded draft plans from ranked pilot-feedback opportunities (59R). Operator-
    ///     triggered — does not mutate agents, prompts, or governance packs.
    /// </summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("planning/materialize")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(ProductLearningPlanningMaterializeResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> MaterializePlanningDrafts(
        [FromQuery] string? since,
        [FromQuery] string? maxPlansToMaterialize,
        CancellationToken cancellationToken)
    {
        if (!ProductLearningQueryParser.TryParseOptionalSince(since, out DateTime? sinceUtc, out string? sinceError))
            return this.BadRequestProblem(sinceError!, ProblemTypes.ValidationFailed);

        if (!LearningPlanningQueryParser.TryParseMaxPlansToMaterialize(maxPlansToMaterialize, out int maxPlans,
                out string? maxError))
            return this.BadRequestProblem(maxError!, ProblemTypes.ValidationFailed);

        ProductLearningTriageOptions triage = new()
        {
            SinceUtc = sinceUtc,
            MaxImprovementOpportunities = ProductLearningQueryParser.DefaultMaxImprovementOpportunities
        };

        ProductLearningScope scope = ToProductLearningScope(scopeProvider.GetCurrentScope());

        ProductLearningPlanningMaterializeResult result =
            await planningDerivationService.MaterializeFromRankedOpportunitiesAsync(
                    scope,
                    triage,
                    actorContext.GetActorId(),
                    maxPlans,
                    cancellationToken)
                .ConfigureAwait(false);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ProductLearningPlanningMaterialized,
                DataJson = JsonSerializer.Serialize(new
                {
                    sinceUtc,
                    maxPlansToMaterialize = maxPlans,
                    themesInserted = result.ThemesInserted,
                    plansInserted = result.PlansInserted,
                    skippedExistingThemeKeys = result.SkippedExistingThemeKeys,
                    signalLinksInserted = result.SignalLinksInserted
                })
            },
            cancellationToken);

        return Ok(result);
    }
}
