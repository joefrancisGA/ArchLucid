using ArchLucid.Api.Learning;
using ArchLucid.Api.Models.Evolution;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.ProductLearning;
using ArchLucid.Api.Services.Evolution;
using ArchLucid.Contracts.Evolution;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Coordination.Evolution;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Evolution;

public sealed partial class EvolutionController
{
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("candidates/from-plan/{planId:guid}")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(EvolutionCandidateChangeSetResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateCandidateFromPlan(
        Guid planId,
        [FromServices] IEvolutionSimulationService evolutionSimulationService,
        CancellationToken cancellationToken)
    {
        ProductLearningScope scope = ToProductLearningScope(scopeProvider.GetCurrentScope());

        try
        {
            EvolutionCandidateChangeSetRecord record =
                await evolutionSimulationService.CreateCandidateFromImprovementPlanAsync(
                    planId,
                    scope,
                    null,
                    cancellationToken);

            return Ok(record.ToResponse());
        }
        catch (EvolutionResourceNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ex.ProblemTypeUri);
        }
    }

    [HttpGet("candidates")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(EvolutionCandidateChangeSetListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ListCandidates([FromQuery] string? max, CancellationToken cancellationToken)
    {
        if (!LearningPlanningQueryParser.TryParseMaxItems(max, "max", out int take, out string? maxError))
            return this.BadRequestProblem(maxError!, ProblemTypes.ValidationFailed);

        ProductLearningScope scope = ToProductLearningScope(scopeProvider.GetCurrentScope());

        IReadOnlyList<EvolutionCandidateChangeSetRecord> rows =
            await evolutionApplicationFacade.ListCandidatesAsync(scope, take, cancellationToken);

        return Ok(new EvolutionCandidateChangeSetListResponse
        {
            Candidates = rows.Select(static r => r.ToResponse()).ToList()
        });
    }

    [HttpGet("candidates/{candidateId:guid}")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(EvolutionCandidateDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCandidate(Guid candidateId, CancellationToken cancellationToken)
    {
        ProductLearningScope scope = ToProductLearningScope(scopeProvider.GetCurrentScope());

        EvolutionCandidateDetailResponse? body =
            await evolutionApplicationFacade.TryBuildCandidateDetailResponseAsync(candidateId, scope, cancellationToken);

        if (body is null)
            return this.NotFoundProblem(
                $"Candidate change set '{candidateId}' was not found in the current scope.",
                ProblemTypes.EvolutionCandidateChangeSetNotFound);

        return Ok(body);
    }

    private static ProductLearningScope ToProductLearningScope(ScopeContext scopeContext)
    {
        ArgumentNullException.ThrowIfNull(scopeContext);

        return new ProductLearningScope
        {
            TenantId = scopeContext.TenantId,
            WorkspaceId = scopeContext.WorkspaceId,
            ProjectId = scopeContext.ProjectId
        };
    }
}
