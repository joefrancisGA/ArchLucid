using ArchLucid.Api.Http;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Http;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernanceController
{
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(GovernanceDashboardSummary), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDashboard(
        [FromQuery] int maxPending = 20,
        [FromQuery] int maxDecisions = 20,
        [FromQuery] int maxChanges = 20,
        CancellationToken cancellationToken = default)
    {
        if (maxPending <= 0)
            return this.BadRequestProblem("maxPending must be greater than 0.", ProblemTypes.ValidationFailed);

        if (maxDecisions <= 0)
            return this.BadRequestProblem("maxDecisions must be greater than 0.", ProblemTypes.ValidationFailed);

        if (maxChanges <= 0)
            return this.BadRequestProblem("maxChanges must be greater than 0.", ProblemTypes.ValidationFailed);

        if (maxPending > 50)
            return this.BadRequestProblem("maxPending must be at most 50.", ProblemTypes.ValidationFailed);

        if (maxDecisions > 50)
            return this.BadRequestProblem("maxDecisions must be at most 50.", ProblemTypes.ValidationFailed);

        if (maxChanges > 50)
            return this.BadRequestProblem("maxChanges must be at most 50.", ProblemTypes.ValidationFailed);

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        GovernanceDashboardSummary summary = await _insightsFacade.GetDashboardAsync(
            scope.TenantId,
            maxPending,
            maxDecisions,
            maxChanges,
            cancellationToken);

        string fingerprint =
            $"dashboard|tenant={scope.TenantId:N}|workspace={scope.WorkspaceId:N}|project={scope.ProjectId:N}|pending={maxPending}|decisions={maxDecisions}|changes={maxChanges}";
        string etag = ConditionalGetNegotiation.ComputeJsonResponseEtag(
            summary,
            ContractJson.CamelCaseIgnoreNullCompact,
            fingerprint);

        return this.OkWithConditionalEtag(summary, etag);
    }

    [HttpGet("compliance-drift-trend")]
    [ProducesResponseType(typeof(IReadOnlyList<ComplianceDriftTrendPoint>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetComplianceDriftTrend(
        [FromQuery] DateTime fromUtc,
        [FromQuery] DateTime toUtc,
        [FromQuery] int bucketMinutes = 1440,
        CancellationToken cancellationToken = default)
    {
        if (fromUtc >= toUtc)
            return this.BadRequestProblem("fromUtc must be before toUtc.", ProblemTypes.ValidationFailed);

        // Reject year-1 / unspecified defaults — OpenAPI date-time + Schemathesis reject "0001-01-01T00:00:00".

        if (fromUtc.Year < 1970 || toUtc.Year < 1970)
            return this.BadRequestProblem(
                "fromUtc and toUtc must be on or after 1970-01-01.",
                ProblemTypes.ValidationFailed);

        if (bucketMinutes is < 60 or > 43_200)
            return this.BadRequestProblem("bucketMinutes must be between 60 and 43200.", ProblemTypes.ValidationFailed);

        DateTime fromUtcNormalized = DateTime.SpecifyKind(fromUtc, DateTimeKind.Utc);
        DateTime toUtcNormalized = DateTime.SpecifyKind(toUtc, DateTimeKind.Utc);

        TimeSpan bucketSize = TimeSpan.FromMinutes(bucketMinutes);
        long deltaTicks = (toUtcNormalized - fromUtcNormalized).Ticks;
        long bucketSizeTicks = bucketSize.Ticks;
        long bucketCount = (deltaTicks + bucketSizeTicks - 1) / bucketSizeTicks;

        if (bucketCount > ComplianceDriftTrendMaxBuckets)
        {
            return this.BadRequestProblem(
                $"The requested window produces {bucketCount} trend buckets; at most {ComplianceDriftTrendMaxBuckets} are allowed. Narrow the date range or increase bucketMinutes.",
                ProblemTypes.BadRequest);
        }

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        IReadOnlyList<ComplianceDriftTrendPoint> points = await _insightsFacade.GetComplianceDriftTrendAsync(
            scope.TenantId,
            fromUtcNormalized,
            toUtcNormalized,
            bucketSize,
            cancellationToken);

        return Ok(points);
    }

    [HttpGet("approval-requests/{approvalRequestId}/lineage")]
    [ProducesResponseType(typeof(GovernanceLineageResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetApprovalRequestLineage(
        [FromRoute] string approvalRequestId,
        CancellationToken cancellationToken)
    {
        approvalRequestId = GovernanceApprovalRequestsHttpMapper.NormalizeApprovalRequestId(approvalRequestId);

        IActionResult? approvalRequestIdProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateApprovalRequestId(approvalRequestId)
                .ToBadRequestProblemOrNull(this);

        if (approvalRequestIdProblem is not null)
            return approvalRequestIdProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        try
        {
            GovernanceLineageResult? result = await _insightsFacade.GetApprovalRequestLineageAsync(
                approvalRequestId,
                cancellationToken);

            if (result is null)
            {
                return this.NotFoundProblem(
                    $"Approval request '{approvalRequestId}' was not found.",
                    ProblemTypes.ResourceNotFound);
            }

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (ArchLucid.Application.RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
    }

    [HttpGet("approval-requests/{approvalRequestId}/rationale")]
    [ProducesResponseType(typeof(GovernanceRationaleResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetApprovalRequestRationale(
        [FromRoute] string approvalRequestId,
        CancellationToken cancellationToken)
    {
        approvalRequestId = GovernanceApprovalRequestsHttpMapper.NormalizeApprovalRequestId(approvalRequestId);

        IActionResult? approvalRequestIdProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateApprovalRequestId(approvalRequestId)
                .ToBadRequestProblemOrNull(this);

        if (approvalRequestIdProblem is not null)
            return approvalRequestIdProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        try
        {
            GovernanceRationaleResult? result = await _insightsFacade.GetApprovalRequestRationaleAsync(
                approvalRequestId,
                cancellationToken);

            if (result is null)
            {
                return this.NotFoundProblem(
                    $"Approval request '{approvalRequestId}' was not found.",
                    ProblemTypes.ResourceNotFound);
            }

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (Application.RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
    }
}
