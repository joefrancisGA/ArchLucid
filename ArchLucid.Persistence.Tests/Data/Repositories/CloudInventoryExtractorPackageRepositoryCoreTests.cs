using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CloudInventoryExtractorPackageRepositoryCoreTests
{
    [Theory]
    [InlineData(CloudProvider.Aws, true)]
    [InlineData(CloudProvider.Gcp, true)]
    [InlineData(CloudProvider.Azure, false)]
    public void IsSupportedProvider_limits_to_aws_and_gcp(CloudProvider provider, bool expected)
    {
        CloudInventoryExtractorPackageRepositoryCore.IsSupportedProvider(provider).Should().Be(expected);
    }

    [Fact]
    public void MapDownload_returns_null_for_empty_package_id()
    {
        CloudInventoryExtractorPackageDownloadRow row = new() { PackageId = Guid.Empty };

        CloudInventoryExtractorPackageRepositoryCore.MapDownload(row).Should().BeNull();
    }

    [Fact]
    public void NormalizeCollectionTimestampUtc_specifies_utc_kind()
    {
        DateTime local = new(2026, 1, 1, 12, 0, 0, DateTimeKind.Unspecified);

        DateTime? normalized = CloudInventoryExtractorPackageRepositoryCore.NormalizeCollectionTimestampUtc(local);

        normalized.Should().NotBeNull();
        normalized!.Value.Kind.Should().Be(DateTimeKind.Utc);
    }
}
