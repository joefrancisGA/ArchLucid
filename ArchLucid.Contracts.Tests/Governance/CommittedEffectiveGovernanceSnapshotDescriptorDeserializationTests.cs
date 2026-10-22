using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Resolution;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class CommittedEffectiveGovernanceSnapshotDescriptorDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "complianceRuleKeys": null,
              "packAssignments": null,
              "coverageAssignments": null
            }
            """;

        CommittedEffectiveGovernanceSnapshotDescriptor? result =
            JsonSerializer.Deserialize<CommittedEffectiveGovernanceSnapshotDescriptor>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.ComplianceRuleKeys.Should().NotBeNull().And.BeEmpty();
        result.PackAssignments.Should().NotBeNull().And.BeEmpty();
        result.CoverageAssignments.Should().NotBeNull().And.BeEmpty();
    }
}
