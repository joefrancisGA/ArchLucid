using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.Learning;
using ArchLucid.Api.Models.Evolution;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.ProductLearning;
using ArchLucid.Api.Services.Evolution;
using ArchLucid.Contracts.Evolution;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Coordination.Evolution;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Evolution;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/evolution")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class EvolutionController(
    IEvolutionApplicationFacade evolutionApplicationFacade,
    IScopeContextProvider scopeProvider)
    : ControllerBase
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

    [HttpGet("results/{candidateId:guid}")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(EvolutionResultsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetResults(Guid candidateId, CancellationToken cancellationToken)
    {
        ProductLearningScope scope = ToProductLearningScope(scopeProvider.GetCurrentScope());

        EvolutionResultsResponse? body =
            await evolutionApplicationFacade.TryBuildResultsResponseAsync(candidateId, scope, cancellationToken);

        if (body is null)
            return this.NotFoundProblem(
                $"Candidate change set '{candidateId}' was not found in the current scope.",
                ProblemTypes.EvolutionCandidateChangeSetNotFound);

        return Ok(body);
    }

    [HttpGet("results/{candidateId:guid}/export")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportResults(
        Guid candidateId,
        [FromQuery] string? format,
        CancellationToken cancellationToken)
    {
        if (!ProductLearningQueryParser.TryParseReportFormat(format, out string formatNorm, out string? formatError))
            return this.BadRequestProblem(formatError!, ProblemTypes.ValidationFailed);

        ProductLearningScope scope = ToProductLearningScope(scopeProvider.GetCurrentScope());

        EvolutionExportResults? export =
            await evolutionApplicationFacade.TryBuildExportResultsAsync(
                candidateId,
                formatNorm,
                scope,
                cancellationToken);

        if (export is null)
            return this.NotFoundProblem(
                $"Candidate change set '{candidateId}' was not found in the current scope.",
                ProblemTypes.EvolutionCandidateChangeSetNotFound);

        return ApiFileResults.RangeText(Request, export.Content, export.ContentType, export.FileName);
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
