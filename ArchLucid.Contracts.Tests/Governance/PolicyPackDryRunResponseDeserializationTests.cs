using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PolicyPackDryRunResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_items_yields_empty_list_not_null()
    {
        const string json = """
            {
              "items": null
            }
            """;

        PolicyPackDryRunResponse? response =
            JsonSerializer.Deserialize<PolicyPackDryRunResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Items.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_delta_counts_yields_non_null_counts_not_null()
    {
        const string json = """
            {
              "deltaCounts": null
            }
            """;

        PolicyPackDryRunResponse? response =
            JsonSerializer.Deserialize<PolicyPackDryRunResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.DeltaCounts.Should().NotBeNull();
    }
}
