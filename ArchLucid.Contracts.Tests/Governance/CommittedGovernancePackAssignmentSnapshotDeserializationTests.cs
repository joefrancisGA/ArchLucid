using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Resolution;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class CommittedGovernancePackAssignmentSnapshotDeserializationTests
{
    [Fact]
    public void Deserialize_null_compliance_rule_keys_yields_empty_list_not_null()
    {
        const string json = """
            {
              "complianceRuleKeys": null
            }
            """;

        CommittedGovernancePackAssignmentSnapshot? result =
            JsonSerializer.Deserialize<CommittedGovernancePackAssignmentSnapshot>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.ComplianceRuleKeys.Should().NotBeNull().And.BeEmpty();
    }
}
