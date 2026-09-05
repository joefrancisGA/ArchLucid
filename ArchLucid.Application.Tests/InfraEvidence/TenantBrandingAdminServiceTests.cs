using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Suite", "Application")]
public sealed class TenantBrandingAdminServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static readonly Guid LogoId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    [Fact]
    public async Task ActivateDraft_rejects_when_validation_fails()
    {
        InMemoryTenantBrandingProfileRepository repository = new();
        TenantBrandingAdminService service = CreateService(repository, logoExists: false);

        await repository.ReplaceDraftAsync(
            BuildDraft(companyDisplayName: null, logoId: null),
            CancellationToken.None);

        TenantBrandingActivateResponse response =
            await service.ActivateDraftAsync(new ScopeContext { TenantId = TenantId }, "admin", CancellationToken.None);

        response.Succeeded.Should().BeFalse();
        response.ValidationIssues.Should().NotBeEmpty();
    }

    [Fact]
    public async Task ActivateDraft_promotes_draft_and_disables_previous_active()
    {
        InMemoryTenantBrandingProfileRepository repository = new();
        TenantBrandingAdminService service = CreateService(repository, logoExists: true);

        await repository.InsertAsync(
            BuildProfile(BrandingProfileStatus.Active, version: 1, companyDisplayName: "Old Co"),
            CancellationToken.None);

        await repository.ReplaceDraftAsync(
            BuildDraft(companyDisplayName: "New Co", logoId: LogoId),
            CancellationToken.None);

        TenantBrandingActivateResponse response =
            await service.ActivateDraftAsync(new ScopeContext { TenantId = TenantId }, "admin", CancellationToken.None);

        response.Succeeded.Should().BeTrue();

        TenantBrandingProfileRecord? active =
            await repository.TryGetActiveAsync(TenantId, CancellationToken.None);

        active.Should().NotBeNull();
        active!.CompanyDisplayName.Should().Be("New Co");
        active.Version.Should().Be(2);
    }

    [Fact]
    public async Task RevertToProductDefaults_clears_active_profile()
    {
        InMemoryTenantBrandingProfileRepository repository = new();
        TenantBrandingAdminService service = CreateService(repository, logoExists: true);

        await repository.InsertAsync(
            BuildProfile(BrandingProfileStatus.Active, version: 1, companyDisplayName: "Tenant Co"),
            CancellationToken.None);

        TenantBrandingAdminStateResponse state =
            await service.RevertToProductDefaultsAsync(new ScopeContext { TenantId = TenantId }, "admin", CancellationToken.None);

        state.Active.IsActive.Should().BeFalse();

        TenantBrandingProfileRecord? active =
            await repository.TryGetActiveAsync(TenantId, CancellationToken.None);

        active.Should().BeNull();
    }

    private static TenantBrandingAdminService CreateService(
        ITenantBrandingProfileRepository repository,
        bool logoExists)
    {
        BrandAssetServiceStub assetService = new(logoExists ? BuildLogo() : null);

        return new TenantBrandingAdminService(repository, assetService);
    }

    private static TenantBrandingProfileRecord BuildDraft(string? companyDisplayName, Guid? logoId) =>
        new()
        {
            BrandingProfileId = Guid.NewGuid(),
            TenantId = TenantId,
            CompanyDisplayName = companyDisplayName,
            LogoPrimaryAssetId = logoId,
            PrimaryColor = ProductBrandingDefaults.PrimaryColor,
            BackgroundColor = ProductBrandingDefaults.BackgroundColor,
            ForegroundColor = ProductBrandingDefaults.ForegroundColor,
            BrandingStatus = BrandingProfileStatus.Draft,
            Version = 1,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private static TenantBrandingProfileRecord BuildProfile(
        BrandingProfileStatus status,
        int version,
        string companyDisplayName) =>
        new()
        {
            BrandingProfileId = Guid.NewGuid(),
            TenantId = TenantId,
            CompanyDisplayName = companyDisplayName,
            LogoPrimaryAssetId = LogoId,
            PrimaryColor = ProductBrandingDefaults.PrimaryColor,
            BackgroundColor = ProductBrandingDefaults.BackgroundColor,
            ForegroundColor = ProductBrandingDefaults.ForegroundColor,
            BrandingStatus = status,
            Version = version,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private static BrandAssetRecord BuildLogo() =>
        new()
        {
            AssetId = LogoId,
            TenantId = TenantId,
            AssetType = BrandAssetType.LogoPrimary,
            OriginalFileName = "logo.png",
            MimeType = "image/png",
            Width = 200,
            Height = 80,
            StorageReference = "blob",
            ChecksumSha256 = [],
            Status = BrandAssetStatus.Active,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private sealed class BrandAssetServiceStub(BrandAssetRecord? logo) : IBrandAssetService
    {
        public Task<BrandAssetUploadResult> UploadAsync(
            ScopeContext scope,
            BrandAssetUploadRequest request,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<BrandAssetReadResult> TryGetAssetAsync(
            ScopeContext scope,
            Guid assetId,
            CancellationToken cancellationToken = default)
        {
            if (logo is null || logo.AssetId != assetId)
            {
                return Task.FromResult(new BrandAssetReadResult
                {
                    Succeeded = false,
                    ErrorMessage = "missing",
                });
            }

            return Task.FromResult(new BrandAssetReadResult
            {
                Succeeded = true,
                Asset = logo,
                AssetBytes = [0x89, 0x50, 0x4e, 0x47],
            });
        }
    }
}
