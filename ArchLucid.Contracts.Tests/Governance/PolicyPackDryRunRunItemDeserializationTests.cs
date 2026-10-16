using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PolicyPackDryRunRunItemDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "findingsBySeverity": null,
              "thresholdOutcomes": null
            }
            """;

        PolicyPackDryRunRunItem? result =
            JsonSerializer.Deserialize<PolicyPackDryRunRunItem>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.FindingsBySeverity.Should().NotBeNull().And.BeEmpty();
        result.ThresholdOutcomes.Should().NotBeNull().And.BeEmpty();
    }
}
