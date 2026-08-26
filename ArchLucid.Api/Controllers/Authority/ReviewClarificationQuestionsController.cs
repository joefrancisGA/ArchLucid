using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Clarifications;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Clarifications;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.ProblemDetails;
using ArchLucid.Persistence.Serialization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Findings-derived clarification questions for a committed review run.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status429TooManyRequests)]
public sealed class ReviewClarificationQuestionsController(
    IReviewClarificationQuestionService clarificationQuestionService,
    IKnowledgeModelClarificationAnswerApplicator clarificationAnswerApplicator,
    IClarificationAnswerReReviewCoordinator clarificationAnswerReReviewCoordinator,
    IClarificationResolvedFindingMuter clarificationResolvedFindingMuter,
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider) : ControllerBase
{
    [HttpGet("review/{runId:guid}/clarification-questions")]
    [ProducesResponseType(typeof(ReviewClarificationQuestionsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetClarificationQuestions(
        [FromRoute] Guid runId,
        [FromQuery] Guid? priorRunId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        try
        {
            ReviewClarificationQuestionsResponse response = await clarificationQuestionService.GetQuestionsAsync(
                scope,
                runId,
                priorRunId,
                cancellationToken);

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.ReviewClarificationQuestionsAccessed,
                    RunId = runId,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            questionCount = response.Questions.Count,
                            totalDerivedCount = response.TotalDerivedCount,
                            priorRunId = priorRunId?.ToString("N"),
                        },
                        AuditJsonSerializationOptions.Instance),
                },
                cancellationToken);

            return Ok(response);
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("review/{runId:guid}/knowledge-model/clarification-answers")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(ApplyKnowledgeModelClarificationAnswersResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApplyKnowledgeModelClarificationAnswers(
        [FromRoute] Guid runId,
        [FromBody] ApplyKnowledgeModelClarificationAnswersRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        try
        {
            await clarificationQuestionService.GetQuestionsAsync(
                scope,
                runId,
                priorRunId: null,
                cancellationToken);
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }

        KnowledgeModelClarificationApplyResult applyResult = await clarificationAnswerApplicator.ApplyAnswersAsync(
            scope,
            runId,
            request.Answers,
            cancellationToken).ConfigureAwait(false);

        int mutedResolvedFindings = await clarificationResolvedFindingMuter
            .MuteResolvedAsync(scope, runId, applyResult.AppliedAnswers, cancellationToken)
            .ConfigureAwait(false);

        IncrementalReReviewResult? reReview = await clarificationAnswerReReviewCoordinator
            .TryRunAfterApplyAsync(scope, runId, applyResult.AppliedCount, applyResult.AppliedAnswers, cancellationToken)
            .ConfigureAwait(false);

        int mergedFindingCount = reReview?.MergedFindingIds.Count ?? 0;

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.KnowledgeModelClarificationAnswersApplied,
                RunId = runId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        appliedCount = applyResult.AppliedCount,
                        mutedResolvedFindingCount = mutedResolvedFindings,
                        answerCount = request.Answers.Count,
                    },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);

        return Ok(new ApplyKnowledgeModelClarificationAnswersResponse
        {
            AppliedCount = applyResult.AppliedCount,
            ReReviewTriggered = reReview is not null,
            MergedFindingCount = mergedFindingCount,
            PartialScopeDisclaimer = reReview?.PartialScopeDisclaimer,
        });
    }
}
