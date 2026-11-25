using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
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
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> PostRunAsync(
        [FromBody] ClosedLoopReasoningRequest? request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (!TryPrepareRequest(request, allowEmptySourcesForFixture: false, requireSourcesUnlessContinue: true, out ClosedLoopReasoningRequest prepared, out string? validationError, out bool bodyRequired))
            {
                if (bodyRequired)
                    return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

                return this.BadRequestProblem(validationError!, ProblemTypes.ValidationFailed);
            }

            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            if (string.IsNullOrWhiteSpace(prepared.RunId))
            {
                if (prepared.ContinueFromExistingRun)
                    return this.BadRequestProblem("Continue requests require a runId.", ProblemTypes.ValidationFailed);

                string? actorId = GetStandaloneRunActorId();
                if (actorId is null)
                    return Forbid();

                IActionResult? sealedGuardResult =
                    await EnsureArchitectureIntelligenceRunCreateSealedManifestAllowedAsync(scope, cancellationToken);

                if (sealedGuardResult is not null)
                    return sealedGuardResult;

                Guid newRunId = Guid.NewGuid();
                await _standaloneRunStore.BindNewAsync(scope, newRunId, actorId, cancellationToken);
                prepared.RunId = newRunId.ToString("D");
            }
            else
            {
                if (!Guid.TryParse(prepared.RunId, out Guid existingRunId) || existingRunId == Guid.Empty)
                    return this.BadRequestProblem("RunId must be a non-empty GUID.", ProblemTypes.ValidationFailed);

                // Even a re-extraction request with an ID can read the existing model and
                // ledger and replace persisted output. It requires the same access as continue.
                IActionResult? sealedGuardResult = await EnsureRunSealedManifestReadAllowedAsync(
                    scope, existingRunId, requireDecide: true, cancellationToken);

                if (sealedGuardResult is not null)
                    return sealedGuardResult;

                prepared.RunId = existingRunId.ToString("D");
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
        catch (ConflictException ex)
        {
            return MapArchitectureIntelligenceSealedManifestConflict(ex);
        }
    }

    /// <summary>Continues a prior run with interview answers (skips re-extraction).</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("runs/{runId}/continue")]
    [ProducesResponseType(typeof(ClosedLoopReasoningResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> PostContinueAsync(
        [FromRoute] string runId,
        [FromBody] ClosedLoopReasoningRequest? request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(runId))
                return this.BadRequestProblem("RunId is required.", ProblemTypes.ValidationFailed);

            if (!Guid.TryParse(runId, out Guid parsedRunId) || parsedRunId == Guid.Empty)
                return this.BadRequestProblem("RunId must be a non-empty GUID.", ProblemTypes.ValidationFailed);

            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            IActionResult? sealedGuardResult = await EnsureRunSealedManifestReadAllowedAsync(
                scope, parsedRunId, requireDecide: true, cancellationToken);

            if (sealedGuardResult is not null)
                return sealedGuardResult;

            request ??= new ClosedLoopReasoningRequest();
            request.RunId = parsedRunId.ToString("D");
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
        catch (ConflictException ex)
        {
            return MapArchitectureIntelligenceSealedManifestConflict(ex);
        }
    }

    /// <summary>Publishes the latest gated product findings/recommendations for a run into product stores.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("runs/{runId}/publish")]
    [ProducesResponseType(typeof(ArchitectureIntelligencePublishResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> PostPublishAsync(
        [FromRoute] string runId,
        [FromBody] ClosedLoopReasoningRequest? request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(runId))
                return this.BadRequestProblem("RunId is required.", ProblemTypes.ValidationFailed);

            if (!Guid.TryParse(runId, out Guid parsedRunId) || parsedRunId == Guid.Empty)
                return this.BadRequestProblem("RunId must be a non-empty GUID.", ProblemTypes.ValidationFailed);

            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            IActionResult? sealedGuardResult = await EnsureRunSealedManifestReadAllowedAsync(
                scope, parsedRunId, requireDecide: true, cancellationToken);

            if (sealedGuardResult is not null)
                return sealedGuardResult;

            request ??= new ClosedLoopReasoningRequest();
            request.RunId = parsedRunId.ToString("D");
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
        catch (ConflictException ex)
        {
            return MapArchitectureIntelligenceSealedManifestConflict(ex);
        }
    }

    /// <summary>Loads the latest persisted knowledge model for a run.</summary>
    [HttpGet("runs/{runId}")]
    [ProducesResponseType(typeof(ArchitectureKnowledgeModel), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetRunModelAsync(
        [FromRoute] string runId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(runId))
                return this.BadRequestProblem("RunId is required.", ProblemTypes.ValidationFailed);

            if (!Guid.TryParse(runId, out Guid parsedRunId) || parsedRunId == Guid.Empty)
                return this.BadRequestProblem("RunId must be a non-empty GUID.", ProblemTypes.ValidationFailed);

            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            IActionResult? sealedGuardResult = await EnsureRunSealedManifestReadAllowedAsync(
                scope, parsedRunId, requireDecide: false, cancellationToken);

            if (sealedGuardResult is not null)
                return sealedGuardResult;

            if (_knowledgeModelAccess is null)
                return this.NotFoundProblem(
                    "Architecture intelligence persistence is not configured.",
                    ProblemTypes.ResourceNotFound);

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
        catch (ConflictException ex)
        {
            return MapArchitectureIntelligenceSealedManifestConflict(ex);
        }
    }
}
