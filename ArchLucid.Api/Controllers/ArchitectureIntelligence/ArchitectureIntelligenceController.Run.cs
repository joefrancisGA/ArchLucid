using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.ArchitectureIntelligence;

public sealed partial class ArchitectureIntelligenceController
{
    /// <summary>Runs closed-loop architecture reasoning for the supplied source texts.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("run")]
    [ProducesResponseType(typeof(ClosedLoopReasoningResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PostRunAsync(
        [FromBody] ClosedLoopReasoningRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (!TryPrepareRequest(request, allowEmptySourcesForFixture: false, requireSourcesUnlessContinue: true, out ClosedLoopReasoningRequest prepared, out string? validationError, out bool bodyRequired))
        {
            if (bodyRequired)
                return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

            return this.BadRequestProblem(validationError!, ProblemTypes.ValidationFailed);
        }

        ClosedLoopReasoningResult result = await _reasoningOrchestrator.RunAsync(prepared, cancellationToken);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ArchitectureIntelligenceRunCompleted,
                DataJson = JsonSerializer.Serialize(new
                {
                    modelId = result.Model.ModelId,
                    runId = result.RunId,
                    elementCount = result.Model.Elements.Count,
                    findingCount = result.ProductFindings.Count,
                    recommendationCount = result.ProductRecommendations.Count,
                    sourceCount = prepared.SourceTexts.Count,
                    publishBlocked = result.PublishBlocked,
                    publishedToProduct = result.PublishedToProduct,
                }),
            },
            cancellationToken);

        return Ok(result);
    }

    /// <summary>Continues a prior run with interview answers (skips re-extraction).</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("runs/{runId}/continue")]
    [ProducesResponseType(typeof(ClosedLoopReasoningResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PostContinueAsync(
        [FromRoute] string runId,
        [FromBody] ClosedLoopReasoningRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return this.BadRequestProblem("RunId is required.", ProblemTypes.ValidationFailed);

        request ??= new ClosedLoopReasoningRequest();
        request.RunId = runId;
        request.ContinueFromExistingRun = true;

        if (!TryPrepareRequest(request, allowEmptySourcesForFixture: false, requireSourcesUnlessContinue: false, out ClosedLoopReasoningRequest prepared, out string? validationError, out bool bodyRequired))
        {
            if (bodyRequired)
                return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

            return this.BadRequestProblem(validationError!, ProblemTypes.ValidationFailed);
        }

        ClosedLoopReasoningResult result = await _reasoningOrchestrator.RunAsync(prepared, cancellationToken);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ArchitectureIntelligenceRunCompleted,
                DataJson = JsonSerializer.Serialize(new
                {
                    modelId = result.Model.ModelId,
                    runId = result.RunId,
                    continued = true,
                    framingAnswerCount = prepared.FramingAnswers.Count,
                    publishedToProduct = result.PublishedToProduct,
                }),
            },
            cancellationToken);

        return Ok(result);
    }

    /// <summary>Publishes the latest gated product findings/recommendations for a run into product stores.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("runs/{runId}/publish")]
    [ProducesResponseType(typeof(ArchitectureIntelligencePublishResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PostPublishAsync(
        [FromRoute] string runId,
        [FromBody] ClosedLoopReasoningRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return this.BadRequestProblem("RunId is required.", ProblemTypes.ValidationFailed);

        request ??= new ClosedLoopReasoningRequest();
        request.RunId = runId;
        request.ContinueFromExistingRun = true;
        request.PublishToProduct = true;

        if (!TryPrepareRequest(request, allowEmptySourcesForFixture: false, requireSourcesUnlessContinue: false, out ClosedLoopReasoningRequest prepared, out string? validationError, out bool bodyRequired))
        {
            if (bodyRequired)
                return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

            return this.BadRequestProblem(validationError!, ProblemTypes.ValidationFailed);
        }

        ClosedLoopReasoningResult result = await _reasoningOrchestrator.RunAsync(prepared, cancellationToken);

        ArchitectureIntelligencePublishResult publishResult = new()
        {
            Published = result.PublishedToProduct,
            FindingsSnapshotId = result.PublishedFindingsSnapshotId,
            RecommendationCount = result.PublishedRecommendationCount,
            SkipReason = result.PublishSkipReason,
        };

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ArchitectureIntelligenceRunCompleted,
                DataJson = JsonSerializer.Serialize(new
                {
                    runId,
                    published = publishResult.Published,
                    findingsSnapshotId = publishResult.FindingsSnapshotId,
                    recommendationCount = publishResult.RecommendationCount,
                }),
            },
            cancellationToken);

        return Ok(publishResult);
    }

    /// <summary>Loads the latest persisted knowledge model for a run.</summary>
    [HttpGet("runs/{runId}")]
    [ProducesResponseType(typeof(ArchitectureKnowledgeModel), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunModelAsync(
        [FromRoute] string runId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return this.BadRequestProblem("RunId is required.", ProblemTypes.ValidationFailed);

        if (_knowledgeModelAccess is null)
            return this.NotFoundProblem(
                "Architecture intelligence persistence is not configured.",
                ProblemTypes.ResourceNotFound);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (!Guid.TryParse(runId, out Guid parsedRunId))
            return this.BadRequestProblem("RunId must be a GUID.", ProblemTypes.ValidationFailed);

        ArchitectureKnowledgeModel? model = await _knowledgeModelAccess.GetForRunAsync(
            scope,
            parsedRunId,
            cancellationToken);

        if (model is null)
            return this.NotFoundProblem(
                "No architecture knowledge model exists for this run.",
                ProblemTypes.RunNotFound);

        return Ok(model);
    }
}
