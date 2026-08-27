using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Http;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;


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

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        GovernanceDashboardSummary summary = await _governanceDashboardService.GetDashboardAsync(
            scope.TenantId,
            maxPending,
            maxDecisions,
            maxChanges,
            cancellationToken);

        string fingerprint = $"dashboard|pending={maxPending}|decisions={maxDecisions}|changes={maxChanges}";
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
            return this.BadRequestProblem("fromUtc must be before toUtc.", ProblemTypes.BadRequest);

        // Reject year-1 / unspecified defaults ΓÇö OpenAPI date-time + Schemathesis reject "0001-01-01T00:00:00".
        if (fromUtc.Year < 1970 || toUtc.Year < 1970)
            return this.BadRequestProblem(
                "fromUtc and toUtc must be on or after 1970-01-01.",
                ProblemTypes.BadRequest);

        if (bucketMinutes is < 60 or > 43_200)
            return this.BadRequestProblem("bucketMinutes must be between 60 and 43200.", ProblemTypes.BadRequest);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        TimeSpan bucketSize = TimeSpan.FromMinutes(bucketMinutes);

        DateTime fromUtcNormalized = DateTime.SpecifyKind(fromUtc, DateTimeKind.Utc);
        DateTime toUtcNormalized = DateTime.SpecifyKind(toUtc, DateTimeKind.Utc);

        IReadOnlyList<ComplianceDriftTrendPoint> points = await _complianceDriftTrendService.GetTrendAsync(
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
        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        approvalRequestId = NormalizeApprovalRequestId(approvalRequestId);

        GovernanceApprovalRequest? approval = await approvalRepo
            .GetByIdAsync(approvalRequestId, cancellationToken)
            .ConfigureAwait(false);

        if (approval is null)
        {
            return this.NotFoundProblem(
                $"Approval request '{approvalRequestId}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        (IActionResult? scopeError, _) =
            await RequireScopedRunAsync(approval.RunId, cancellationToken).ConfigureAwait(false);

        if (scopeError is not null)
            return scopeError;

        GovernanceLineageResult? result = await _governanceLineageService.GetApprovalRequestLineageAsync(
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

    [HttpGet("approval-requests/{approvalRequestId}/rationale")]
    [ProducesResponseType(typeof(GovernanceRationaleResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetApprovalRequestRationale(
        [FromRoute] string approvalRequestId,
        CancellationToken cancellationToken)
    {
        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        approvalRequestId = NormalizeApprovalRequestId(approvalRequestId);

        GovernanceApprovalRequest? approval = await approvalRepo
            .GetByIdAsync(approvalRequestId, cancellationToken)
            .ConfigureAwait(false);

        if (approval is null)
        {
            return this.NotFoundProblem(
                $"Approval request '{approvalRequestId}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        (IActionResult? scopeError, _) =
            await RequireScopedRunAsync(approval.RunId, cancellationToken).ConfigureAwait(false);

        if (scopeError is not null)
            return scopeError;

        GovernanceRationaleResult? result = await _governanceRationaleService.GetApprovalRequestRationaleAsync(
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
}
