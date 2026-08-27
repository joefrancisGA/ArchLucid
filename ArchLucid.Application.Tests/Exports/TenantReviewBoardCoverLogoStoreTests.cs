using ArchLucid.Application.Exports;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class TenantReviewBoardCoverLogoStoreTests
{
    private static readonly byte[] MinimalPng =
        Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");

    [Fact]
    public async Task TryGetBytesAsync_returns_valid_logo_after_upload()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        string tempRoot = Path.Combine(Path.GetTempPath(), "al-cover-logo-" + Guid.NewGuid().ToString("N"));

        try
        {
            TenantReviewBoardCoverLogoStore sut = CreateLocalStore(tenantId, tempRoot);

            await sut.UploadAsync(MinimalPng, CancellationToken.None);

            byte[]? bytes = await sut.TryGetBytesAsync(CancellationToken.None);

            bytes.Should().NotBeNull();
            bytes.Should().BeEquivalentTo(MinimalPng);
        }
        finally
        {
            if (Directory.Exists(tempRoot))
                Directory.Delete(tempRoot, recursive: true);
        }
    }

    [Fact]
    public async Task TryGetBytesAsync_returns_null_when_stored_logo_fails_validation()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        string tempRoot = Path.Combine(Path.GetTempPath(), "al-cover-logo-" + Guid.NewGuid().ToString("N"));

        try
        {
            TenantReviewBoardCoverLogoStore sut = CreateLocalStore(tenantId, tempRoot);

            await sut.UploadAsync(MinimalPng, CancellationToken.None);

            string logoPath = Path.Combine(
                tempRoot,
                "tenant-branding",
                tenantId.ToString("D"),
                "assets",
                "cover-logo.png");

            await File.WriteAllBytesAsync(logoPath, [0x42, 0x4D, 0x00, 0x00], CancellationToken.None);

            byte[]? bytes = await sut.TryGetBytesAsync(CancellationToken.None);

            bytes.Should().BeNull();
        }
        finally
        {
            if (Directory.Exists(tempRoot))
                Directory.Delete(tempRoot, recursive: true);
        }
    }

    private static TenantReviewBoardCoverLogoStore CreateLocalStore(Guid tenantId, string tempRoot)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        return new TenantReviewBoardCoverLogoStore(scope.Object, tempRoot);
    }
}
