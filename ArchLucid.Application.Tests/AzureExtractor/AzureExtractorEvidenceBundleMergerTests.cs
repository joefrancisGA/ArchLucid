using ArchLucid.Application.AzureExtractor;
using ArchLucid.Contracts.Agents;
using ArchLucid.Persistence.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.AzureExtractor;
[Trait("Category", "Unit")]

public sealed class AzureExtractorEvidenceBundleMergerTests
{
    [Fact]
    public void Merge_writes_expected_metadata_keys()
    {
        DateTime utc = DateTime.SpecifyKind(new DateTime(2026, 5, 6, 14, 15, 16), DateTimeKind.Utc);

        Guid packageId = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

        EvidenceBundle bundle = new() { EvidenceBundleId = "eb1", RequestDescription = "r" };

        AzureExtractorPackageProvenance provenance = new()
        {
            PackageId = packageId,
            SchemaVersion = 1,
            CollectionTimestampUtc = utc,
            CreatedUtc = utc,
            SubscriptionId = "sub-xyz",
            OriginalFileName = "inv.zip",
        };

        AzureExtractorEvidenceBundleMerger.Merge(bundle, provenance);

        bundle.Metadata.Should().ContainKey(AzureExtractorEvidenceBundleMerger.MetadataPackageIdKey);

        bundle.Metadata[AzureExtractorEvidenceBundleMerger.MetadataPackageIdKey].Should().Be("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

        bundle.Metadata[AzureExtractorEvidenceBundleMerger.MetadataCostCitationKey].Should().Contain("packageId=", because: "citations anchor persisted rows");

        bundle.Metadata[AzureExtractorEvidenceBundleMerger.MetadataCostCitationKey].Should().Contain("schemaVersion=1");

        AzureExtractorEvidenceBundleMerger.BundlesExtractorMetadata(bundle).Should().BeTrue();
    }
}
