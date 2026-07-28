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
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService) : ControllerBase
{
    private readonly IClosedLoopArchitectureReasoningOrchestrator _reasoningOrchestrator =
        reasoningOrchestrator ?? throw new ArgumentNullException(nameof(reasoningOrchestrator));

    private readonly IGoldenArchitectureTestRunner _goldenArchitectureTestRunner =
        goldenArchitectureTestRunner ?? throw new ArgumentNullException(nameof(goldenArchitectureTestRunner));

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
        if (!TryPrepareRequest(request, out ClosedLoopReasoningRequest prepared, out string? validationError, out bool bodyRequired))
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
                    elementCount = result.Model.Elements.Count,
                    findingCount = result.ProductFindings.Count,
                    recommendationCount = result.ProductRecommendations.Count,
                    sourceCount = prepared.SourceTexts.Count,
                }),
            },
            cancellationToken);

        return Ok(result);
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
        if (!TryPrepareRequest(request, out ClosedLoopReasoningRequest prepared, out string? validationError, out bool bodyRequired))
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
                    sourceCount = prepared.SourceTexts.Count,
                }),
            },
            cancellationToken);

        return Ok(result);
    }

    private bool TryPrepareRequest(
        ClosedLoopReasoningRequest? request,
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

        if (request.SourceTexts is null || request.SourceTexts.Count == 0)
        {
            prepared = request;
            validationError = "At least one source text is required.";

            return false;
        }

        bool hasContent = request.SourceTexts.Any(source => !string.IsNullOrWhiteSpace(source.Content));

        if (!hasContent)
        {
            prepared = request;
            validationError = "Source text content is required.";

            return false;
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        request.TenantId = scope.TenantId.ToString("D");
        request.WorkspaceId = scope.WorkspaceId.ToString("D");
        request.ProjectId = scope.ProjectId.ToString("D");
        prepared = request;
        validationError = null;

        return true;
    }
}
