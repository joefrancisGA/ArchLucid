using ArchLucid.Application.CloudInventoryExtractor;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Persistence.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.CloudInventoryExtractor;

[Trait("Category", "Unit")]
public sealed class CloudInventoryExtractorEvidenceBundleMergerTests
{
    [Fact]
    public void Merge_aws_writes_expected_metadata_keys()
    {
        DateTime utc = DateTime.SpecifyKind(new DateTime(2026, 5, 6, 14, 15, 16), DateTimeKind.Utc);
        Guid packageId = Guid.Parse("cccccccccccccccccccccccccccccccc");
        EvidenceBundle bundle = new() { EvidenceBundleId = "eb1", RequestDescription = "r" };

        CloudInventoryExtractorPackageProvenance provenance = new()
        {
            PackageId = packageId,
            CloudProvider = CloudProvider.Aws,
            SchemaVersion = 1,
            CollectionTimestampUtc = utc,
            CreatedUtc = utc,
            ScopeId = "scope-aws",
            OriginalFileName = "aws.zip",
        };

        CloudInventoryExtractorEvidenceBundleMerger.Merge(bundle, provenance);

        bundle.Metadata.Should().ContainKey(CloudInventoryExtractorEvidenceBundleMerger.MetadataPackageIdKey(CloudProvider.Aws));
        bundle.Metadata[CloudInventoryExtractorEvidenceBundleMerger.MetadataPackageIdKey(CloudProvider.Aws)]
            .Should().Be("cccccccccccccccccccccccccccccccc");
        bundle.Metadata[CloudInventoryExtractorEvidenceBundleMerger.MetadataCostCitationKey(CloudProvider.Aws)]
            .Should().Contain("packageId=", because: "citations anchor persisted rows");
        bundle.Metadata[CloudInventoryExtractorEvidenceBundleMerger.MetadataCostCitationKey(CloudProvider.Aws)]
            .Should().Contain("AwsInventoryZIP");
        CloudInventoryExtractorEvidenceBundleMerger.BundlesExtractorMetadata(bundle, CloudProvider.Aws).Should().BeTrue();
    }
}
