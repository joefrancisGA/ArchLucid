using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Findings;

/// <summary>General remediation assignee + due date on a persisted finding row (TB-395).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/findings")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class FindingRemediationAssignmentController(
    IFindingRecordRemediationAssignmentRepository remediationAssignmentRepository,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService,
    IFindingRemediationAssignmentEmailDispatcher assignmentEmailDispatcher) : ControllerBase
{
    private readonly IFindingRecordRemediationAssignmentRepository _remediationAssignmentRepository =
        remediationAssignmentRepository ?? throw new ArgumentNullException(nameof(remediationAssignmentRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IFindingRemediationAssignmentEmailDispatcher _assignmentEmailDispatcher =
        assignmentEmailDispatcher ?? throw new ArgumentNullException(nameof(assignmentEmailDispatcher));

    /// <summary>Sets or clears remediation assignee and due date for a finding on a run.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPut("{findingId}/remediation-assignment")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PutRemediationAssignmentAsync(
        string findingId,
        [FromBody] FindingRemediationAssignmentRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (string.IsNullOrWhiteSpace(findingId))
            return this.BadRequestProblem("Finding id is required.", ProblemTypes.ValidationFailed);

        string trimmedId = findingId.Trim();

        if (trimmedId.Length > 64)
            return this.BadRequestProblem("Finding id exceeds maximum length (64).", ProblemTypes.ValidationFailed);

        if (request.RunId == Guid.Empty)
            return this.BadRequestProblem("Run id is required.", ProblemTypes.ValidationFailed);

        string? assignee = request.AssignedToUserId?.Trim();

        if (assignee is { Length: > 256 })
            return this.BadRequestProblem("AssignedToUserId exceeds maximum length (256).", ProblemTypes.ValidationFailed);

        if (string.IsNullOrWhiteSpace(assignee))
            assignee = null;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        bool updated = await _remediationAssignmentRepository.TryUpdateAssignmentAsync(
            request.RunId,
            trimmedId,
            scope,
            assignee,
            request.RemediationDueUtc,
            ct);

        if (!updated)
        {
            return this.NotFoundProblem(
                $"Finding '{trimmedId}' was not found for run '{request.RunId:D}' in the current scope.",
                ProblemTypes.ResourceNotFound);
        }

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.FindingRemediationAssignmentUpdated,
                RunId = request.RunId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        findingId = trimmedId,
                        assignedToUserId = assignee,
                        remediationDueUtc = request.RemediationDueUtc
                    })
            },
            ct);

        if (assignee is not null)
        {
            await _assignmentEmailDispatcher.TryDispatchAsync(
                scope.TenantId,
                request.RunId,
                trimmedId,
                trimmedId,
                assignee,
                request.RemediationDueUtc,
                ct);
        }

        return NoContent();
    }
}
