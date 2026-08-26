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
}
