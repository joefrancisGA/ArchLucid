using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class BrandAssetServiceTests
{
    private static readonly byte[] MinimalPng =
        Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");

    private static readonly Guid TenantA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid TenantB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    [Fact]
    public async Task TryGetAssetAsync_returns_not_found_for_other_tenant_asset()
    {
        string tempRoot = CreateTempRoot();

        try
        {
            InMemoryBrandAssetRepository repository = new();
            BrandAssetService tenantAService = CreateService(TenantA, tempRoot, repository);
            BrandAssetService tenantBService = CreateService(TenantB, tempRoot, repository);

            BrandAssetUploadResult upload = await tenantAService.UploadAsync(
                new ScopeContext { TenantId = TenantA },
                new BrandAssetUploadRequest
                {
                    AssetType = BrandAssetType.LogoPrimary,
                    OriginalFileName = "logo.png",
                    AssetBytes = MinimalPng,
                    CreatedBy = "admin",
                },
                CancellationToken.None);

            upload.Succeeded.Should().BeTrue();
            upload.Asset.Should().NotBeNull();

            BrandAssetReadResult read = await tenantBService.TryGetAssetAsync(
                new ScopeContext { TenantId = TenantB },
                upload.Asset!.AssetId,
                CancellationToken.None);

            read.Succeeded.Should().BeFalse();
            read.ErrorMessage.Should().Contain("not found");
        }
        finally
        {
            CleanupTempRoot(tempRoot);
        }
    }

    [Fact]
    public async Task UploadAsync_persists_bytes_readable_by_same_tenant()
    {
        string tempRoot = CreateTempRoot();

        try
        {
            BrandAssetService service = CreateService(TenantA, tempRoot, new InMemoryBrandAssetRepository());

            BrandAssetUploadResult upload = await service.UploadAsync(
                new ScopeContext { TenantId = TenantA },
                new BrandAssetUploadRequest
                {
                    AssetType = BrandAssetType.LogoPrimary,
                    OriginalFileName = "logo.png",
                    AssetBytes = MinimalPng,
                    CreatedBy = "admin",
                },
                CancellationToken.None);

            upload.Succeeded.Should().BeTrue();

            BrandAssetReadResult read = await service.TryGetAssetAsync(
                new ScopeContext { TenantId = TenantA },
                upload.Asset!.AssetId,
                CancellationToken.None);

            read.Succeeded.Should().BeTrue();
            read.AssetBytes.Should().BeEquivalentTo(MinimalPng);
            read.Asset!.Status.Should().Be(BrandAssetStatus.Staged);
            read.Asset.ChecksumSha256.Should().BeEquivalentTo(BrandAssetChecksumHasher.ComputeSha256(MinimalPng));
        }
        finally
        {
            CleanupTempRoot(tempRoot);
        }
    }

    private static BrandAssetService CreateService(
        Guid tenantId,
        string tempRoot,
        IBrandAssetRepository repository)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        TenantBrandAssetBlobStore blobStore = new(scope.Object, tempRoot);
        return new BrandAssetService(repository, blobStore);
    }

    private static string CreateTempRoot() =>
        Path.Combine(Path.GetTempPath(), "al-brand-asset-" + Guid.NewGuid().ToString("N"));

    private static void CleanupTempRoot(string tempRoot)
    {
        if (Directory.Exists(tempRoot))
            Directory.Delete(tempRoot, recursive: true);
    }
}
