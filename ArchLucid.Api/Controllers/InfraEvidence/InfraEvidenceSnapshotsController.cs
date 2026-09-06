using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.InfraEvidence;
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
    IScopeContextProvider scopeProvider) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<AzureInventorySnapshotRecord>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListSnapshots(
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        [FromQuery] string? subscriptionId = null,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        PagedResponse<AzureInventorySnapshotRecord> response = await driftWorkbenchQueryService.ListSnapshotsAsync(
            scope,
            page,
            pageSize,
            subscriptionId,
            cancellationToken);

        return Ok(response);
    }

    [HttpGet("{snapshotId:guid}/diffs")]
    [ProducesResponseType(typeof(IReadOnlyList<AzureInventoryDiffSummaryRecord>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListDiffsForSnapshot(
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

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

    [HttpGet("{snapshotId:guid}/terraform-advisory")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadTerraformAdvisory(
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

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
}
