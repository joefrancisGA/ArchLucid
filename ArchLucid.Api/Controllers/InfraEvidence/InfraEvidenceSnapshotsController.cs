using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Pagination;
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
[Route("v{version:apiVersion}/infra-evidence/snapshots")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class InfraEvidenceSnapshotsController(
    IInfraEvidenceDriftWorkbenchQueryService driftWorkbenchQueryService,
    IAdvisoryTerraformRepresentationService advisoryTerraformService,
    IInfraEvidenceSnapshotMermaidService snapshotMermaidService,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<AzureInventorySnapshotRecord>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ListSnapshots(
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        [FromQuery] string? subscriptionId = null,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        try
        {
            PagedResponse<AzureInventorySnapshotRecord> response = await driftWorkbenchQueryService.ListSnapshotsAsync(
                scope,
                page,
                pageSize,
                subscriptionId,
                cancellationToken);

            return Ok(response);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
    }

    [HttpGet("{snapshotId:guid}/diffs")]
    [ProducesResponseType(typeof(IReadOnlyList<AzureInventoryDiffSummaryRecord>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ListDiffsForSnapshot(
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        try
        {
            IReadOnlyList<AzureInventoryDiffSummaryRecord>? diffs =
                await driftWorkbenchQueryService.ListDiffsForSnapshotAsync(scope, snapshotId, cancellationToken);

            if (diffs is null)
            {
                return this.NotFoundProblem(
                    $"Snapshot '{snapshotId}' was not found.",
                    ProblemTypes.ResourceNotFound);
            }

            return Ok(diffs);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
    }

    [HttpGet("{snapshotId:guid}/terraform-advisory")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DownloadTerraformAdvisory(
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        try
        {
            AdvisoryTerraformRepresentationResult result = await advisoryTerraformService.TryBuildFromSnapshotAsync(
                scope,
                snapshotId,
                aztfexportAvailable: false,
                cancellationToken);

            if (!result.Succeeded)
            {
                return this.NotFoundProblem(
                    result.ErrorMessage ?? $"Terraform advisory for snapshot '{snapshotId}' was not found.",
                    ProblemTypes.ResourceNotFound);
            }

            byte[] zipBytes = AdvisoryTerraformZipBuilder.BuildZip(result);
            string filename = $"terraform-advisory-{snapshotId:D}.zip";

            return File(zipBytes, "application/zip", filename);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
    }

    [HttpGet("{snapshotId:guid}/mermaid/preview")]
    [ProducesResponseType(typeof(InfraEvidenceMermaidPreviewResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetMermaidPreview(
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        try
        {
            InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidPreviewResponse> result =
                await snapshotMermaidService.TryGetPreviewAsync(scope, snapshotId, cancellationToken);

            if (result.IsNotFound)
            {
                return this.NotFoundProblem(
                    result.ErrorMessage ?? $"Snapshot '{snapshotId}' was not found.",
                    ProblemTypes.ResourceNotFound);
            }

            if (!result.Succeeded || result.Value is null)
            {
                return this.BadRequestProblem(
                    result.ErrorMessage ?? "Mermaid preview failed.",
                    ProblemTypes.ValidationFailed);
            }

            return Ok(result.Value);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
    }

    [HttpGet("{snapshotId:guid}/mermaid")]
    [ProducesResponseType(typeof(InfraEvidenceMermaidRenderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetMermaid(
        Guid snapshotId,
        [FromQuery] string? mode,
        [FromQuery] string? fallbackKey,
        [FromQuery] string? seedNodeId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        try
        {
            InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidRenderResponse> result =
                await snapshotMermaidService.TryGetMermaidAsync(
                    scope,
                    snapshotId,
                    mode,
                    fallbackKey,
                    seedNodeId,
                    cancellationToken);

            if (result.IsNotFound)
            {
                return this.NotFoundProblem(
                    result.ErrorMessage ?? $"Snapshot '{snapshotId}' was not found.",
                    ProblemTypes.ResourceNotFound);
            }

            if (result.IsBadRequest)
            {
                return this.BadRequestProblem(
                    result.ErrorMessage ?? "Invalid Mermaid mode.",
                    ProblemTypes.ValidationFailed);
            }

            if (!result.Succeeded || result.Value is null)
            {
                return this.BadRequestProblem(
                    result.ErrorMessage ?? "Mermaid render failed.",
                    ProblemTypes.ValidationFailed);
            }

            return Ok(result.Value);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
    }

    [HttpGet("{snapshotId:guid}/mermaid/export.png")]
    [Produces("image/png")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ExportMermaidPng(
        Guid snapshotId,
        [FromQuery] string? mode,
        [FromQuery] string? fallbackKey,
        [FromQuery] string? seedNodeId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        try
        {
            InfraEvidenceMermaidServiceResult<byte[]> result = await snapshotMermaidService.TryExportPngAsync(
                scope,
                snapshotId,
                mode,
                fallbackKey,
                seedNodeId,
                cancellationToken);

            if (result.IsNotFound)
            {
                return this.NotFoundProblem(
                    result.ErrorMessage ?? $"Snapshot '{snapshotId}' was not found.",
                    ProblemTypes.ResourceNotFound);
            }

            if (result.IsBadRequest)
            {
                return this.BadRequestProblem(
                    result.ErrorMessage ?? "Invalid Mermaid export request.",
                    ProblemTypes.ValidationFailed);
            }

            if (!result.Succeeded || result.Value is null || result.Value.Length == 0)
            {
                return this.BadRequestProblem(
                    result.ErrorMessage ?? "Mermaid PNG export failed.",
                    ProblemTypes.ValidationFailed);
            }

            string filename = $"infra-evidence-mermaid-{snapshotId:D}.png";

            return File(result.Value, "image/png", filename);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
    }
}
