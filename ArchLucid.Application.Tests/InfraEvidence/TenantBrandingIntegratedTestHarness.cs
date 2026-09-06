using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.ArtifactSynthesis.Branding;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Caching.Memory;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

/// <summary>Shared in-memory branding stack for BR-09 cross-tenant ship-gate tests.</summary>
internal sealed class TenantBrandingIntegratedTestHarness : IDisposable
{
    private readonly string _blobRoot;
    private readonly Mock<IScopeContextProvider> _scopeProvider = new();

    public TenantBrandingIntegratedTestHarness()
    {
        _blobRoot = Path.Combine(Path.GetTempPath(), "al-brand-ship-gate-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_blobRoot);

        ProfileRepository = new InMemoryTenantBrandingProfileRepository();
        AssetRepository = new InMemoryBrandAssetRepository();
        Cache = new TenantBrandingResolvedProfileCache(new MemoryCache(new MemoryCacheOptions()));
        ProfileRepositoryWithCache = new TenantBrandingProfileRepositoryWithCacheInvalidation(ProfileRepository, Cache);

        BrandAssetService = new BrandAssetService(
            AssetRepository,
            new TenantBrandAssetBlobStore(_scopeProvider.Object, _blobRoot));

        Mock<ITenantFirstValueReportBrandingRepository> legacy = new();
        legacy
            .Setup(l => l.TryGetAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantFirstValueReportBrandingRow?)null);

        BrandingService = new TenantBrandingService(
            ProfileRepositoryWithCache,
            legacy.Object,
            BrandAssetService,
            Cache);

        ReportBrandingHelper = new TenantReportBrandingApplyHelper(BrandingService);
        DiagramExportService = new BrandedDiagramExportService(
            BrandingService,
            new BrandedDiagramExportComposer());
    }

    public InMemoryTenantBrandingProfileRepository ProfileRepository
    {
        get;
    }

    public InMemoryBrandAssetRepository AssetRepository
    {
        get;
    }

    public TenantBrandingResolvedProfileCache Cache
    {
        get;
    }

    public TenantBrandingProfileRepositoryWithCacheInvalidation ProfileRepositoryWithCache
    {
        get;
    }

    public BrandAssetService BrandAssetService
    {
        get;
    }

    public TenantBrandingService BrandingService
    {
        get;
    }

    public TenantReportBrandingApplyHelper ReportBrandingHelper
    {
        get;
    }

    public BrandedDiagramExportService DiagramExportService
    {
        get;
    }

    public void SetScope(Guid tenantId) =>
        _scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

    public async Task<Guid> SeedActiveTenantAsync(
        Guid tenantId,
        string companyDisplayName,
        byte[] logoBytes,
        BrandingDisplayContext? logoContext = null)
    {
        _scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        BrandAssetUploadResult upload = await BrandAssetService.UploadAsync(
            new ScopeContext { TenantId = tenantId },
            new BrandAssetUploadRequest
            {
                AssetType = BrandAssetType.LogoPrimary,
                OriginalFileName = "logo.png",
                AssetBytes = logoBytes,
                CreatedBy = "test",
            },
            CancellationToken.None);

        if (!upload.Succeeded || upload.Asset is null)
            throw new InvalidOperationException(upload.ErrorMessage ?? "Logo upload failed in test harness.");

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        await ProfileRepository.InsertAsync(
            new TenantBrandingProfileRecord
            {
                BrandingProfileId = Guid.NewGuid(),
                TenantId = tenantId,
                CompanyDisplayName = companyDisplayName,
                LogoPrimaryAssetId = upload.Asset.AssetId,
                LogoFaviconAssetId = logoContext == BrandingDisplayContext.Favicon ? upload.Asset.AssetId : null,
                LogoDarkAssetId = logoContext == BrandingDisplayContext.ApplicationHeader ? upload.Asset.AssetId : null,
                LogoLightAssetId = logoContext == BrandingDisplayContext.Navigation ? upload.Asset.AssetId : null,
                PrimaryColor = ProductBrandingDefaults.PrimaryColor,
                BackgroundColor = ProductBrandingDefaults.BackgroundColor,
                ForegroundColor = ProductBrandingDefaults.ForegroundColor,
                BrandingStatus = BrandingProfileStatus.Active,
                Version = 1,
                CreatedUtc = utcNow,
                UpdatedUtc = utcNow,
            },
            CancellationToken.None);

        return upload.Asset.AssetId;
    }

    public void Dispose()
    {
        if (Directory.Exists(_blobRoot))
            Directory.Delete(_blobRoot, recursive: true);
    }
}
