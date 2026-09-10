using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Queries;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Findings;

/// <summary>Append-only operator insight-density instrumentation on findings (DX-13).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/runs")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class FindingInsightSignalController(
    IAuthorityQueryService authorityQuery,
    IFindingInsightSignalRepository insightSignalRepository,
    IScopeContextProvider scopeProvider,
    IAuditService auditService,
    ILogger<FindingInsightSignalController> logger) : ControllerBase
{
    private readonly IAuthorityQueryService _authorityQuery =
        authorityQuery ?? throw new ArgumentNullException(nameof(authorityQuery));

    private readonly IFindingInsightSignalRepository _insightSignalRepository =
        insightSignalRepository ?? throw new ArgumentNullException(nameof(insightSignalRepository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ILogger<FindingInsightSignalController> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <summary>Lists insight signals recorded by the current operator on one finding.</summary>
    [HttpGet("{runId:guid}/findings/{findingId}/insight-signal")]
    [ProducesResponseType(typeof(FindingInsightSignalStatusResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetInsightSignalStatusAsync(
        Guid runId,
        string findingId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(findingId))
            return this.BadRequestProblem("Finding id is required.", ProblemTypes.ValidationFailed);

        string trimmedFindingId = findingId.Trim();

        if (trimmedFindingId.Length > 64)
            return this.BadRequestProblem("Finding id exceeds maximum length (64).", ProblemTypes.ValidationFailed);

        string? userId = User.Identity?.Name;

        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        if (!await TryResolveFindingOnRunAsync(scope, runId, trimmedFindingId, cancellationToken))
        {
            return this.NotFoundProblem(
                $"Finding '{trimmedFindingId}' was not found on run '{runId:D}'.",
                ProblemTypes.ResourceNotFound);
        }

        IReadOnlyList<FindingInsightSignalKind> kinds = await _insightSignalRepository.ListKindsForUserAsync(
            scope.TenantId,
            runId,
            trimmedFindingId,
            userId,
            cancellationToken);

        return Ok(new FindingInsightSignalStatusResponse { Kinds = kinds });
    }

    /// <summary>Records an append-only insight signal for one finding on a run.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{runId:guid}/findings/{findingId}/insight-signal")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PostInsightSignalAsync(
        Guid runId,
        string findingId,
        [FromBody] RecordFindingInsightSignalRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (string.IsNullOrWhiteSpace(findingId))
            return this.BadRequestProblem("Finding id is required.", ProblemTypes.ValidationFailed);

        string trimmedFindingId = findingId.Trim();

        if (trimmedFindingId.Length > 64)
            return this.BadRequestProblem("Finding id exceeds maximum length (64).", ProblemTypes.ValidationFailed);

        if (!Enum.IsDefined(request.Kind))
            return this.BadRequestProblem("Kind is invalid.", ProblemTypes.ValidationFailed);

        string? userId = User.Identity?.Name;

        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        if (!await TryResolveFindingOnRunAsync(scope, runId, trimmedFindingId, cancellationToken))
        {
            return this.NotFoundProblem(
                $"Finding '{trimmedFindingId}' was not found on run '{runId:D}'.",
                ProblemTypes.ResourceNotFound);
        }

        FindingInsightSignalSubmission submission = new()
        {
            TenantId = scope.TenantId,
            RunId = runId,
            FindingId = trimmedFindingId,
            UserId = userId.Trim(),
            Kind = request.Kind
        };

        FindingInsightSignalInsertResult result =
            await _insightSignalRepository.TryInsertAsync(submission, cancellationToken);

        if (result.Created)
        {
            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.FindingInsightSignalRecorded,
                    RunId = runId,
                    DataJson = JsonSerializer.Serialize(new
                    {
                        findingId = trimmedFindingId,
                        kind = request.Kind.ToString(),
                        signalId = result.SignalId
                    })
                },
                cancellationToken);
        }

        _logger.LogInformation(
            "Finding insight signal {Kind} recorded for run {RunId} finding {FindingId} created={Created}.",
            request.Kind,
            runId,
            trimmedFindingId,
            result.Created);

        return NoContent();
    }

    private async Task<bool> TryResolveFindingOnRunAsync(
        ScopeContext scope,
        Guid runId,
        string findingId,
        CancellationToken cancellationToken)
    {
        RunDetailDto? detail = await _authorityQuery.GetRunDetailAsync(scope, runId, cancellationToken);

        FindingsSnapshot? snapshot = detail?.FindingsSnapshot;

        if (snapshot is null)
            return false;

        return SnapshotContainsFinding(snapshot, findingId);
    }

    private static bool SnapshotContainsFinding(FindingsSnapshot snapshot, string findingId)
    {
        if (snapshot.Findings.Any(f => string.Equals(f.FindingId, findingId, StringComparison.OrdinalIgnoreCase)))
            return true;

        if (snapshot.ChecklistCoverage.Any(f =>
                string.Equals(f.FindingId, findingId, StringComparison.OrdinalIgnoreCase)))
            return true;

        return false;
    }
}
