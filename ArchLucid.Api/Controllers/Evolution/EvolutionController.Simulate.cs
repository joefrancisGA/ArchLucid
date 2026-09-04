using ArchLucid.Api.Models.Evolution;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.ProductLearning;
using ArchLucid.Api.Services.Evolution;
using ArchLucid.Contracts.Evolution;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Core.Authorization;
using ArchLucid.Persistence.Coordination.Evolution;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Evolution;

public sealed partial class EvolutionController
{
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("candidates/{candidateId:guid}/shadow-evaluate")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(EvolutionShadowEvaluateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ShadowEvaluate(
        Guid candidateId,
        [FromServices] IEvolutionSimulationService evolutionSimulationService,
        CancellationToken cancellationToken)
    {
        ProductLearningScope scope = ToProductLearningScope(scopeProvider.GetCurrentScope());

        try
        {
            IReadOnlyList<EvolutionSimulationRunRecord> runs =
                await evolutionSimulationService.RunShadowEvaluationAsync(candidateId, scope, cancellationToken);

            return Ok(new EvolutionShadowEvaluateResponse
            {
                SimulationRuns = runs.Select(static r => r.ToResponse()).ToList()
            });
        }
        catch (EvolutionResourceNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ex.ProblemTypeUri);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("simulate/{candidateId:guid}")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(EvolutionSimulateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Simulate(
        Guid candidateId,
        [FromServices] IEvolutionSimulationService evolutionSimulationService,
        CancellationToken cancellationToken)
    {
        ProductLearningScope scope = ToProductLearningScope(scopeProvider.GetCurrentScope());

        try
        {
            IReadOnlyList<EvolutionSimulationRunRecord> runs =
                await evolutionSimulationService.SimulateCandidateWithEvaluationAsync(
                    candidateId,
                    scope,
                    cancellationToken);

            EvolutionCandidateReadBundle? bundle =
                await evolutionApplicationFacade.TryLoadCandidateBundleAsync(candidateId, scope, cancellationToken);

            if (bundle is null)
                return this.NotFoundProblem(
                    $"Candidate change set '{candidateId}' was not found in the current scope.",
                    ProblemTypes.EvolutionCandidateChangeSetNotFound);

            return Ok(new EvolutionSimulateResponse
            {
                Candidate = bundle.Candidate.ToResponse(),
                SimulationRuns = runs.Select(EvolutionOutcomeParser.ToRunWithEvaluation).ToList()
            });
        }
        catch (EvolutionResourceNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ex.ProblemTypeUri);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }
}
