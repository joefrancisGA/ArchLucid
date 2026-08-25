using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.ArchitectureIntelligence;

/// <summary>Operator closed-loop architecture reasoning and golden regression checks.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture-intelligence")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class ArchitectureIntelligenceController(
    IClosedLoopArchitectureReasoningOrchestrator reasoningOrchestrator,
    IGoldenArchitectureTestRunner goldenArchitectureTestRunner,
    IArchitectureIntelligencePersistence? architectureIntelligencePersistence,
    IArchitectureKnowledgeModelAccess? knowledgeModelAccess,
    IArchitectureIntelligenceProductPublishService productPublishService,
    IArchitectureIntelligenceProductRunSourceContextLoader productRunSourceContextLoader,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService) : ControllerBase
{
    private readonly IClosedLoopArchitectureReasoningOrchestrator _reasoningOrchestrator =
        reasoningOrchestrator ?? throw new ArgumentNullException(nameof(reasoningOrchestrator));

    private readonly IGoldenArchitectureTestRunner _goldenArchitectureTestRunner =
        goldenArchitectureTestRunner ?? throw new ArgumentNullException(nameof(goldenArchitectureTestRunner));

    private readonly IArchitectureKnowledgeModelAccess? _knowledgeModelAccess = knowledgeModelAccess;

    private readonly IArchitectureIntelligenceProductPublishService _productPublishService =
        productPublishService ?? throw new ArgumentNullException(nameof(productPublishService));

    private readonly IArchitectureIntelligenceProductRunSourceContextLoader _productRunSourceContextLoader =
        productRunSourceContextLoader ?? throw new ArgumentNullException(nameof(productRunSourceContextLoader));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

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

    /// <summary>Runs the golden architecture regression harness for the supplied source texts.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("golden-test")]
    [ProducesResponseType(typeof(GoldenArchitectureTestResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PostGoldenTestAsync(
        [FromBody] ClosedLoopReasoningRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (!TryPrepareRequest(request, allowEmptySourcesForFixture: true, requireSourcesUnlessContinue: true, out ClosedLoopReasoningRequest prepared, out string? validationError, out bool bodyRequired))
        {
            if (bodyRequired)
                return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

            return this.BadRequestProblem(validationError!, ProblemTypes.ValidationFailed);
        }

        GoldenArchitectureTestResult result = await _goldenArchitectureTestRunner.RunAsync(prepared, cancellationToken);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ArchitectureIntelligenceGoldenTestCompleted,
                DataJson = JsonSerializer.Serialize(new
                {
                    passed = result.Passed,
                    plantedDefectRecall = result.PlantedDefectRecall,
                    falsePositiveCount = result.FalsePositiveCount,
                    falsePositivesByDimension = result.FalsePositivesByDimension,
                    mutationChangedFindings = result.MutationChangedFindings,
                    sourceCount = prepared.SourceTexts.Count,
                }),
            },
            cancellationToken);

        return Ok(result);
    }

    /// <summary>Returns the canonical golden incomplete-architecture fixture text for operator loading.</summary>
    [HttpGet("golden-fixture")]
    [ProducesResponseType(typeof(ClosedLoopReasoningRequest), StatusCodes.Status200OK)]
    public IActionResult GetGoldenFixture()
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        ClosedLoopReasoningRequest fixture = GoldenIncompleteArchitectureFixture.CreateRequest(scope.TenantId.ToString("D"));
        fixture.WorkspaceId = scope.WorkspaceId.ToString("D");
        fixture.ProjectId = scope.ProjectId.ToString("D");
        fixture.UseGoldenFixture = true;

        return Ok(fixture);
    }

    /// <summary>
    /// Loads product review intake (description + documents) as ArchitectureIntelligence source texts.
    /// Does not run reasoning — clients hydrate then POST /run with the same runId for publish round-trip.
    /// </summary>
    [HttpGet("product-runs/{runId}/source-context")]
    [ProducesResponseType(typeof(ClosedLoopReasoningRequest), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProductRunSourceContextAsync(
        [FromRoute] string runId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(runId))
        {
            return this.BadRequestProblem("RunId is required.", ProblemTypes.ValidationFailed);
        }

        ArchitectureIntelligenceProductRunSourceContextLoadResult loaded =
            await _productRunSourceContextLoader.LoadAsync(runId, cancellationToken);

        if (!loaded.Found)
        {
            return this.NotFoundProblem(
                loaded.Error ?? "Product run was not found.",
                ProblemTypes.RunNotFound);
        }

        if (!loaded.HasContent || loaded.Request is null)
        {
            return this.BadRequestProblem(
                loaded.Error ?? "Product run has no loadable architecture content.",
                ProblemTypes.ValidationFailed);
        }

        return Ok(loaded.Request);
    }

    private bool TryPrepareRequest(
        ClosedLoopReasoningRequest? request,
        bool allowEmptySourcesForFixture,
        bool requireSourcesUnlessContinue,
        out ClosedLoopReasoningRequest prepared,
        out string? validationError,
        out bool bodyRequired)
    {
        bodyRequired = false;

        if (request is null)
        {
            prepared = null!;
            validationError = null;
            bodyRequired = true;

            return false;
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string tenantId = scope.TenantId.ToString("D");
        request.TenantId = tenantId;
        request.WorkspaceId = scope.WorkspaceId.ToString("D");
        request.ProjectId = scope.ProjectId.ToString("D");

        bool hasContent = request.SourceTexts is not null
            && request.SourceTexts.Any(source => !string.IsNullOrWhiteSpace(source.Content));

        if (!hasContent && allowEmptySourcesForFixture && request.UseGoldenFixture)
        {
            ClosedLoopReasoningRequest fixture = GoldenIncompleteArchitectureFixture.CreateRequest(tenantId);
            request.SourceTexts = fixture.SourceTexts;
            request.DeclaredPriorities = fixture.DeclaredPriorities.Count > 0
                ? fixture.DeclaredPriorities
                : request.DeclaredPriorities;
            hasContent = true;
        }

        bool continueWithoutSources = request.ContinueFromExistingRun && !string.IsNullOrWhiteSpace(request.RunId);

        if (requireSourcesUnlessContinue && !continueWithoutSources && (request.SourceTexts is null || request.SourceTexts.Count == 0 || !hasContent))
        {
            prepared = request;
            validationError = "At least one source text with content is required (or set useGoldenFixture=true).";

            return false;
        }

        if (!requireSourcesUnlessContinue && !continueWithoutSources)
        {
            prepared = request;
            validationError = "Continue requests require a runId.";

            return false;
        }

        prepared = request;
        validationError = null;

        return true;
    }
}
