using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.InfraEvidence;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.OperationalSecurity;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/operational-security/paths")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class OperationalSecurityPathsController(
    ISecurityEvidencePathInspectorQueryService pathInspectorQueryService,
    ISecurityEvidencePathRankQueryService pathRankQueryService,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<SecurityEvidencePathSummaryResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListPaths(
        [FromQuery] Guid? snapshotId,
        [FromQuery] PathKind? pathKind,
        [FromQuery] PathConfidenceBand? confidenceBand,
        [FromQuery] Guid? cloudResourceId,
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        if (pageSize > PaginationDefaults.MaxPageSize)
        {
            return this.PayloadTooLargeProblem(
                $"pageSize cannot exceed {PaginationDefaults.MaxPageSize}.",
                ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();

        PagedResponse<SecurityEvidencePathSummaryResponse> response = await pathInspectorQueryService.ListPathsAsync(
            scope,
            snapshotId,
            pathKind,
            confidenceBand,
            cloudResourceId,
            page,
            pageSize,
            cancellationToken);

        return Ok(response);
    }

    [HttpGet("ranked")]
    [ProducesResponseType(typeof(SecurityEvidencePathRankedPageResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListRankedPaths(
        [FromQuery] Guid? snapshotId,
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        if (pageSize > PaginationDefaults.MaxPageSize)
        {
            return this.PayloadTooLargeProblem(
                $"pageSize cannot exceed {PaginationDefaults.MaxPageSize}.",
                ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();

        SecurityEvidencePathRankedPageResponse response = await pathRankQueryService.ListRankedPathsAsync(
            scope,
            snapshotId,
            page,
            pageSize,
            cancellationToken);

        return Ok(response);
    }

    [HttpGet("{pathId:guid}/rank")]
    [ProducesResponseType(typeof(SecurityEvidencePathRankDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPathRank(
        Guid pathId,
        CancellationToken cancellationToken = default)
    {
        if (pathId == Guid.Empty)
        {
            return this.BadRequestProblem("PathId is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();

        SecurityEvidencePathRankDetailResponse? rank = await pathRankQueryService.TryGetPathRankAsync(
            scope,
            pathId,
            cancellationToken);

        if (rank is null)
        {
            return this.NotFoundProblem(
                "Security evidence path rank was not found.",
                ProblemTypes.ResourceNotFound);
        }

        return Ok(rank);
    }

    [HttpGet("{pathId:guid}")]
    [ProducesResponseType(typeof(SecurityEvidencePathDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPathDetail(
        Guid pathId,
        CancellationToken cancellationToken = default)
    {
        if (pathId == Guid.Empty)
        {
            return this.BadRequestProblem("PathId is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();

        SecurityEvidencePathDetailResponse? detail = await pathInspectorQueryService.TryGetPathDetailAsync(
            scope,
            pathId,
            cancellationToken);

        if (detail is null)
        {
            return this.NotFoundProblem(
                "Security evidence path was not found.",
                ProblemTypes.ResourceNotFound);
        }

        return Ok(detail);
    }
}
