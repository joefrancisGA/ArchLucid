using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernanceLineageResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "topFindings": null,
              "promotions": null
            }
            """;

        GovernanceLineageResult? result =
            JsonSerializer.Deserialize<GovernanceLineageResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.TopFindings.Should().NotBeNull().And.BeEmpty();
        result.Promotions.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_approval_request_yields_non_null_request_not_null()
    {
        const string json = """
            {
              "approvalRequest": null
            }
            """;

        GovernanceLineageResult? result =
            JsonSerializer.Deserialize<GovernanceLineageResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.ApprovalRequest.Should().NotBeNull();
    }
}
