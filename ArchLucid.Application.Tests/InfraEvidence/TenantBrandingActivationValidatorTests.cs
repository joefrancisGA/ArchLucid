using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Suite", "Application")]
public sealed class TenantBrandingActivationValidatorTests
{
    private static readonly Guid PrimaryLogoId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [Fact]
    public void Validate_blocks_activation_when_contrast_fails_wcag_aa()
    {
        TenantBrandingProfileRecord draft = BuildDraft(
            foreground: "#ffffff",
            background: "#fefefe");

        BrandAssetRecord logo = BuildLogo(PrimaryLogoId, 200, 80);

        TenantBrandingValidationResult result =
            TenantBrandingActivationValidator.Validate(draft, new Dictionary<Guid, BrandAssetRecord> { [PrimaryLogoId] = logo });

        result.CanActivate.Should().BeFalse();
        result.Issues.Should().Contain(issue => issue.Code == "poorContrast");
    }

    [Fact]
    public void Validate_allows_activation_when_required_fields_and_contrast_pass()
    {
        TenantBrandingProfileRecord draft = BuildDraft();

        BrandAssetRecord logo = BuildLogo(PrimaryLogoId, 200, 80);

        TenantBrandingValidationResult result =
            TenantBrandingActivationValidator.Validate(draft, new Dictionary<Guid, BrandAssetRecord> { [PrimaryLogoId] = logo });

        result.CanActivate.Should().BeTrue();
    }

    [Fact]
    public void Validate_warns_when_dark_and_light_logo_variants_missing()
    {
        TenantBrandingProfileRecord draft = BuildDraft();

        BrandAssetRecord logo = BuildLogo(PrimaryLogoId, 200, 80);

        TenantBrandingValidationResult result =
            TenantBrandingActivationValidator.Validate(draft, new Dictionary<Guid, BrandAssetRecord> { [PrimaryLogoId] = logo });

        result.CanActivate.Should().BeTrue();
        result.Issues.Should().Contain(issue => issue.Code == "missingDarkLogoVariant");
        result.Issues.Should().Contain(issue => issue.Code == "missingLightLogoVariant");
    }

    private static TenantBrandingProfileRecord BuildDraft(
        string foreground = "#171717",
        string background = "#fafafa") =>
        new()
        {
            BrandingProfileId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            CompanyDisplayName = "Acme Corp",
            LogoPrimaryAssetId = PrimaryLogoId,
            PrimaryColor = "#0f766e",
            BackgroundColor = background,
            ForegroundColor = foreground,
            BrandingStatus = BrandingProfileStatus.Draft,
            Version = 1,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private static BrandAssetRecord BuildLogo(Guid assetId, int width, int height) =>
        new()
        {
            AssetId = assetId,
            TenantId = Guid.NewGuid(),
            AssetType = BrandAssetType.LogoPrimary,
            OriginalFileName = "logo.png",
            MimeType = "image/png",
            Width = width,
            Height = height,
            StorageReference = "blob",
            ChecksumSha256 = [],
            Status = BrandAssetStatus.Active,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };
}
