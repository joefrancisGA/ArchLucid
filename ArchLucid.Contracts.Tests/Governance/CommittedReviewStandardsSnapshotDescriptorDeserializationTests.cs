using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Resolution;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class CommittedReviewStandardsSnapshotDescriptorDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "policyReferences": null,
              "reviewedQualityDimensions": null
            }
            """;

        CommittedReviewStandardsSnapshotDescriptor? result =
            JsonSerializer.Deserialize<CommittedReviewStandardsSnapshotDescriptor>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.PolicyReferences.Should().NotBeNull().And.BeEmpty();
        result.ReviewedQualityDimensions.Should().NotBeNull().And.BeEmpty();
    }
}
