using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.InfraEvidence;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.InfraEvidence;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/infra-evidence/branding/assets")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class BrandAssetController(
    IBrandAssetService brandAssetService,
    IScopeContextProvider scopeProvider,
    IAuditService auditService) : ControllerBase
{
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(BrandAssetUploadValidator.MaxAssetBytes + 256)]
    [ProducesResponseType(typeof(BrandAssetResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> UploadAsync(
        IFormFile? file,
        [FromForm] BrandAssetType assetType,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return this.BadRequestProblem("Asset file is required.", ProblemTypes.ValidationFailed);

        await using MemoryStream buffer = new();
        await file.CopyToAsync(buffer, cancellationToken).ConfigureAwait(false);
        byte[] bytes = buffer.ToArray();

        ScopeContext scope = scopeProvider.GetCurrentScope();
        string actor = User.Identity?.Name ?? "admin";

        BrandAssetUploadResult result;

        try
        {
            result = await brandAssetService.UploadAsync(
                scope,
                new BrandAssetUploadRequest
                {
                    AssetType = assetType,
                    OriginalFileName = file.FileName,
                    AssetBytes = bytes,
                    CreatedBy = actor,
                },
                cancellationToken).ConfigureAwait(false);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, ex.Message);
        }

        if (!result.Succeeded || result.Asset is null)
            return this.BadRequestProblem(result.ErrorMessage ?? "Brand asset upload failed.", ProblemTypes.ValidationFailed);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TenantBrandAssetUploaded,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new
                {
                    assetId = result.Asset.AssetId,
                    assetType = result.Asset.AssetType.ToString(),
                    mimeType = result.Asset.MimeType,
                    byteLength = bytes.Length,
                }),
            },
            cancellationToken).ConfigureAwait(false);

        return CreatedAtAction(
            nameof(GetContentAsync),
            new { assetId = result.Asset.AssetId },
            MapResponse(result.Asset));
    }

    [HttpGet("{assetId:guid}")]
    [ProducesResponseType(typeof(BrandAssetResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMetadataAsync(Guid assetId, CancellationToken cancellationToken)
    {
        if (assetId == Guid.Empty)
            return this.BadRequestProblem("AssetId is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        BrandAssetReadResult result = await brandAssetService.TryGetAssetAsync(scope, assetId, cancellationToken)
            .ConfigureAwait(false);

        if (!result.Succeeded || result.Asset is null)
            return this.NotFoundProblem(
                result.ErrorMessage ?? "Brand asset was not found.",
                ProblemTypes.ResourceNotFound);

        return Ok(MapResponse(result.Asset));
    }

    [HttpGet("{assetId:guid}/content")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetContentAsync(Guid assetId, CancellationToken cancellationToken)
    {
        if (assetId == Guid.Empty)
            return this.BadRequestProblem("AssetId is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        BrandAssetReadResult result = await brandAssetService.TryGetAssetAsync(scope, assetId, cancellationToken)
            .ConfigureAwait(false);

        if (!result.Succeeded || result.Asset is null || result.AssetBytes is null)
            return this.NotFoundProblem(
                result.ErrorMessage ?? "Brand asset was not found.",
                ProblemTypes.ResourceNotFound);

        return ApiFileResults.SimpleBytes(result.AssetBytes, result.Asset.MimeType, result.Asset.OriginalFileName);
    }

    private static BrandAssetResponse MapResponse(BrandAssetRecord record) =>
        new()
        {
            AssetId = record.AssetId,
            AssetType = record.AssetType.ToString(),
            OriginalFileName = record.OriginalFileName,
            MimeType = record.MimeType,
            Width = record.Width,
            Height = record.Height,
            ChecksumSha256Hex = Convert.ToHexString(record.ChecksumSha256),
            Status = record.Status.ToString(),
            CreatedUtc = record.CreatedUtc,
            UpdatedUtc = record.UpdatedUtc,
        };
}
