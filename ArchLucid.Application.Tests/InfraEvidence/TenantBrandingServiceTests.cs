using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Caching.Memory;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class TenantBrandingServiceTests
{
    private static readonly Guid TenantA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid TenantB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    [Fact]
    public async Task GetCompanyDisplayNameAsync_without_profile_returns_product_name()
    {
        TenantBrandingService service = CreateService(new InMemoryTenantBrandingProfileRepository());

        string name = await service.GetCompanyDisplayNameAsync(TenantA, CancellationToken.None);

        name.Should().Be(ProductBrandingDefaults.CompanyDisplayName);
    }

    [Fact]
    public async Task GetLogoAsync_without_profile_returns_product_brand_marker()
    {
        TenantBrandingService service = CreateService(new InMemoryTenantBrandingProfileRepository());

        TenantBrandingLogo logo = await service.GetLogoAsync(
            TenantA,
            BrandingDisplayContext.ReportCover,
            CancellationToken.None);

        logo.IsProductBrand.Should().BeTrue();
        logo.AssetBytes.Should().BeNull();
        logo.HttpsUrl.Should().BeNull();
    }

    [Fact]
    public async Task GetBrandingProfileAsync_prefers_active_over_default_profile()
    {
        InMemoryTenantBrandingProfileRepository repository = new();
        DateTime utcNow = new(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc);

        await repository.InsertAsync(
            BuildProfile(TenantA, BrandingProfileStatus.Default, utcNow, "Default Co"),
            CancellationToken.None);

        await repository.InsertAsync(
            BuildProfile(TenantA, BrandingProfileStatus.Active, utcNow, "Active Co"),
            CancellationToken.None);

        TenantBrandingService service = CreateService(repository);

        ResolvedTenantBrandingProfile profile = await service.GetBrandingProfileAsync(TenantA, CancellationToken.None);

        profile.IsProductBrand.Should().BeFalse();
        profile.CompanyDisplayName.Should().Be("Active Co");
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task GetBrandingProfileAsync_does_not_read_fallbacks_after_selecting_modern_profile(bool hasActive)
    {
        DateTime utcNow = new(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc);
        Mock<ITenantBrandingProfileRepository> repository = new(MockBehavior.Strict);
        repository.Setup(repo => repo.TryGetActiveAsync(TenantA, CancellationToken.None))
            .ReturnsAsync(hasActive ? BuildProfile(TenantA, BrandingProfileStatus.Active, utcNow, "Active Co") : null);
        if (!hasActive)
        {
            repository.Setup(repo => repo.TryGetDefaultAsync(TenantA, CancellationToken.None))
                .ReturnsAsync(BuildProfile(TenantA, BrandingProfileStatus.Default, utcNow, "Default Co"));
        }

        using MemoryCache memory = new(new MemoryCacheOptions());
        TenantBrandingService service = new(
            repository.Object,
            new Mock<ITenantFirstValueReportBrandingRepository>(MockBehavior.Strict).Object,
            Mock.Of<IBrandAssetService>(),
            new TenantBrandingResolvedProfileCache(memory));

        ResolvedTenantBrandingProfile profile = await service.GetBrandingProfileAsync(TenantA, CancellationToken.None);

        profile.CompanyDisplayName.Should().Be(hasActive ? "Active Co" : "Default Co");
    }

    [Fact]
    public async Task Interleaved_tenant_resolution_does_not_leak_company_names()
    {
        InMemoryTenantBrandingProfileRepository repository = new();
        DateTime utcNow = new(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc);

        await repository.InsertAsync(
            BuildProfile(TenantA, BrandingProfileStatus.Active, utcNow, "Tenant A Holdings"),
            CancellationToken.None);

        await repository.InsertAsync(
            BuildProfile(TenantB, BrandingProfileStatus.Active, utcNow, "Tenant B Holdings"),
            CancellationToken.None);

        TenantBrandingService service = CreateService(repository);

        IEnumerable<Task<string>> tasks = Enumerable.Range(0, 40)
            .Select(i => service.GetCompanyDisplayNameAsync(i % 2 == 0 ? TenantA : TenantB, CancellationToken.None));

        string[] names = await Task.WhenAll(tasks);

        names.Where((_, i) => i % 2 == 0).Should().OnlyContain(n => n == "Tenant A Holdings");
        names.Where((_, i) => i % 2 == 1).Should().OnlyContain(n => n == "Tenant B Holdings");
    }

    [Fact]
    public async Task InvalidateTenantCache_refreshes_profile_after_repository_insert()
    {
        InMemoryTenantBrandingProfileRepository inner = new();
        TenantBrandingResolvedProfileCache cache = new(new MemoryCache(new MemoryCacheOptions()));
        TenantBrandingProfileRepositoryWithCacheInvalidation repository =
            new(inner, cache);

        TenantBrandingService service = CreateService(repository, cache);

        (await service.GetCompanyDisplayNameAsync(TenantA, CancellationToken.None))
            .Should().Be(ProductBrandingDefaults.CompanyDisplayName);

        await repository.InsertAsync(
            BuildProfile(TenantA, BrandingProfileStatus.Active, DateTime.UtcNow, "Fresh Tenant Co"),
            CancellationToken.None);

        (await service.GetCompanyDisplayNameAsync(TenantA, CancellationToken.None))
            .Should().Be("Fresh Tenant Co");
    }

    [Fact]
    public async Task GetSurfacePresentationAsync_application_header_uses_active_company_name()
    {
        InMemoryTenantBrandingProfileRepository repository = new();
        DateTime utcNow = new(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc);

        await repository.InsertAsync(
            BuildProfile(TenantA, BrandingProfileStatus.Active, utcNow, "Tenant A Holdings"),
            CancellationToken.None);

        TenantBrandingService service = CreateService(repository);

        TenantBrandingSurfacePresentation presentation = await service.GetSurfacePresentationAsync(
            TenantA,
            BrandingDisplayContext.ApplicationHeader,
            CancellationToken.None);

        presentation.MastheadDisplayName.Should().Be("Tenant A Holdings");
        presentation.UsesTenantVisualBrand.Should().BeTrue();
        presentation.ShowArchLucidMarkInMasthead.Should().BeFalse();
    }

    [Fact]
    public async Task GetSurfacePresentationAsync_uses_same_profile_for_name_and_logo_during_invalidation()
    {
        using MemoryCache memory = new(new MemoryCacheOptions());
        TenantBrandingResolvedProfileCache cache = new(memory);
        Mock<ITenantBrandingProfileRepository> repository = new();
        repository.SetupSequence(repo => repo.TryGetActiveAsync(TenantA, CancellationToken.None))
            .ReturnsAsync(() =>
            {
                cache.InvalidateTenantCache(TenantA);
                return BuildProfile(TenantA, BrandingProfileStatus.Active, DateTime.UtcNow, "Tenant A Holdings");
            })
            .ReturnsAsync((TenantBrandingProfileRecord?)null);
        repository.Setup(repo => repo.TryGetDefaultAsync(TenantA, CancellationToken.None))
            .ReturnsAsync((TenantBrandingProfileRecord?)null);
        Mock<ITenantFirstValueReportBrandingRepository> legacy = new();
        legacy.Setup(repo => repo.TryGetAsync(TenantA, CancellationToken.None))
            .ReturnsAsync((TenantFirstValueReportBrandingRow?)null);
        TenantBrandingService service = new(repository.Object, legacy.Object, Mock.Of<IBrandAssetService>(), cache);

        TenantBrandingSurfacePresentation presentation = await service.GetSurfacePresentationAsync(
            TenantA, BrandingDisplayContext.ApplicationHeader, CancellationToken.None);

        presentation.MastheadDisplayName.Should().Be("Tenant A Holdings");
        presentation.UsesTenantVisualBrand.Should().BeTrue();
        presentation.Logo.IsProductBrand.Should().BeFalse();
        repository.Verify(repo => repo.TryGetActiveAsync(TenantA, CancellationToken.None), Times.Once);
    }

    private static TenantBrandingService CreateService(
        ITenantBrandingProfileRepository profileRepository,
        TenantBrandingResolvedProfileCache? cache = null)
    {
        Mock<ITenantFirstValueReportBrandingRepository> legacy = new();
        legacy
            .Setup(l => l.TryGetAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantFirstValueReportBrandingRow?)null);

        Mock<IBrandAssetService> assets = new();

        return new TenantBrandingService(
            profileRepository,
            legacy.Object,
            assets.Object,
            cache ?? new TenantBrandingResolvedProfileCache(new MemoryCache(new MemoryCacheOptions())));
    }

    private static TenantBrandingProfileRecord BuildProfile(
        Guid tenantId,
        BrandingProfileStatus status,
        DateTime utcNow,
        string companyDisplayName) =>
        new()
        {
            BrandingProfileId = Guid.NewGuid(),
            TenantId = tenantId,
            CompanyDisplayName = companyDisplayName,
            BrandingStatus = status,
            Version = 1,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };
}
