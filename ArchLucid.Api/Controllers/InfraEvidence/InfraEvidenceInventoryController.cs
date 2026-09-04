using ArchLucid.Api.Attributes;
using ArchLucid.Api.Controllers.InfraEvidence;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.InfraEvidence;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.InfraEvidence;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/infra-evidence/azure-inventory")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class InfraEvidenceInventoryController(
    IAzureInventoryBaselineService baselineService,
    IAzureInventoryDriftClassificationService driftClassificationService,
    IAzureInventoryDriftApprovalService driftApprovalService,
    IAzureInventoryDiffNarrativeService narrativeService,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    [HttpPost("baselines")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Infrastructure-evidence baseline designation is tenant-scoped inventory metadata.")]
    [ProducesResponseType(typeof(AzureInventoryBaselineDesignateResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DesignateBaseline(
        [FromBody] DesignateAzureInventoryBaselineRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (request.SnapshotId == Guid.Empty)
            return this.BadRequestProblem("SnapshotId is required.", ProblemTypes.ValidationFailed);

        if (string.IsNullOrWhiteSpace(request.DesignatedBy))
            return this.BadRequestProblem("DesignatedBy is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        AzureInventoryBaselineDesignateResult result = await baselineService.TryDesignateBaselineAsync(
            scope,
            request.SnapshotId,
            request.BaselineKind,
            request.DesignatedBy,
            request.Notes,
            cancellationToken);

        if (!result.Succeeded)
            return this.BadRequestProblem(result.ErrorMessage ?? "Baseline designation failed.", ProblemTypes.ValidationFailed);

        return Ok(result);
    }

    [HttpGet("baselines")]
    [ProducesResponseType(typeof(IReadOnlyList<AzureInventoryBaselineRecord>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListBaselines(
        [FromQuery] string? subscriptionId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        IReadOnlyList<AzureInventoryBaselineRecord> baselines =
            await baselineService.ListBaselinesAsync(scope, subscriptionId, cancellationToken);

        return Ok(baselines);
    }

    [HttpGet("diffs/{diffId:guid}/drift-report")]
    [ProducesResponseType(typeof(AzureInventoryDriftReportRecord), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDriftReport(Guid diffId, CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        AzureInventoryDriftReportRecord? report =
            await driftClassificationService.TryGetDriftReportAsync(scope, diffId, cancellationToken);

        if (report is null)
            return this.NotFoundProblem($"Drift report for diff '{diffId}' was not found.", ProblemTypes.ResourceNotFound);

        return Ok(report);
    }

    [HttpPost("diffs/{diffId:guid}/drift-approvals")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Drift approval records carry approver, reason, and ticket reference inline.")]
    [ProducesResponseType(typeof(AzureInventoryDriftApprovalCreateResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateDriftApproval(
        Guid diffId,
        [FromBody] CreateAzureInventoryDriftApprovalRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        AzureInventoryDriftApprovalCreateResult result = await driftApprovalService.TryCreateApprovalAsync(
            scope,
            diffId,
            request.ChangeId,
            request.Approver,
            request.Reason,
            request.TicketReference,
            request.ExpirationUtc,
            cancellationToken);

        if (!result.Succeeded)
        {
            if (result.ErrorMessage?.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
                return this.NotFoundProblem(result.ErrorMessage, ProblemTypes.ResourceNotFound);

            return this.BadRequestProblem(result.ErrorMessage ?? "Drift approval creation failed.", ProblemTypes.ValidationFailed);
        }

        return Ok(result);
    }

    [HttpPost("diffs/{diffId:guid}/narratives")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Diff narratives are persisted AiInference artifacts with cited change ids.")]
    [ProducesResponseType(typeof(AzureInventoryDiffNarrativeResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> BuildNarrative(
        Guid diffId,
        [FromBody] BuildAzureInventoryDiffNarrativeRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        AzureInventoryDiffNarrativeResult result = await narrativeService.TryBuildNarrativeAsync(
            scope,
            diffId,
            request.NarrativeKind,
            request.UseSimulator,
            cancellationToken);

        if (!result.Succeeded)
        {
            if (result.ErrorMessage?.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
                return this.NotFoundProblem(result.ErrorMessage, ProblemTypes.ResourceNotFound);

            return this.BadRequestProblem(result.ErrorMessage ?? "Narrative generation failed.", ProblemTypes.ValidationFailed);
        }

        return Ok(result);
    }
}
