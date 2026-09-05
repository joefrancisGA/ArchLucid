using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Contracts.InfraEvidence;
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
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/infra-evidence/branding")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class TenantBrandingController(
    ITenantBrandingService tenantBrandingService,
    IBrandAssetService brandAssetService,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    [HttpGet("presentation")]
    [ProducesResponseType(typeof(TenantBrandingPresentationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPresentationAsync(
        [FromQuery] string? context,
        CancellationToken cancellationToken)
    {
        if (!TryParseDisplayContext(context, out BrandingDisplayContext displayContext))
        {
            return this.BadRequestProblem(
                "context query parameter is required and must be a valid BrandingDisplayContext value.",
                ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();
        TenantBrandingSurfacePresentation presentation =
            await tenantBrandingService.GetSurfacePresentationAsync(scope.TenantId, displayContext, cancellationToken);

        TenantBrandColors colors =
            await tenantBrandingService.GetBrandColorsAsync(scope.TenantId, cancellationToken);

        TenantBrandingLogo logo = presentation.Logo;

        return Ok(
            new TenantBrandingPresentationResponse
            {
                Context = displayContext.ToString(),
                MastheadDisplayName = presentation.MastheadDisplayName,
                UsesTenantVisualBrand = presentation.UsesTenantVisualBrand,
                ShowPoweredByArchLucid = presentation.ShowPoweredByArchLucid,
                ShowArchLucidMarkInMasthead = presentation.ShowArchLucidMarkInMasthead,
                IsProductBrand = colors.IsProductBrand,
                Colors = new TenantBrandColorsResponse
                {
                    Primary = colors.Primary,
                    Secondary = colors.Secondary,
                    Accent = colors.Accent,
                    Background = colors.Background,
                    Foreground = colors.Foreground,
                },
                LogoAssetId = logo.AssetId,
                LogoHttpsUrl = logo.HttpsUrl,
                LogoContentPath = logo.AssetId is Guid assetId && assetId != Guid.Empty
                    ? $"v1/infra-evidence/branding/logo/{assetId:D}/content"
                    : null,
            });
    }

    [HttpGet("logo/{assetId:guid}/content")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLogoContentAsync(Guid assetId, CancellationToken cancellationToken)
    {
        if (assetId == Guid.Empty)
            return this.BadRequestProblem("AssetId is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        BrandAssetReadResult result = await brandAssetService.TryGetAssetAsync(scope, assetId, cancellationToken)
            .ConfigureAwait(false);

        if (!result.Succeeded || result.Asset is null || result.AssetBytes is null)
        {
            return this.NotFoundProblem(
                result.ErrorMessage ?? "Brand logo was not found.",
                ProblemTypes.ResourceNotFound);
        }

        return ApiFileResults.SimpleBytes(result.AssetBytes, result.Asset.MimeType, result.Asset.OriginalFileName);
    }

    private static bool TryParseDisplayContext(string? raw, out BrandingDisplayContext displayContext)
    {
        displayContext = default;

        if (string.IsNullOrWhiteSpace(raw))
            return false;

        return Enum.TryParse(raw.Trim(), ignoreCase: true, out displayContext);
    }
}
