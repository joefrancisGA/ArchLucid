using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Integrations;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Integrations;

[Trait("Category", "Unit")]
public sealed class ItsmFindingCorrelationsDeserializationTests
{
    [Fact]
    public void Deserialize_null_batch_findings_yields_empty_list_not_null()
    {
        const string json = """
            {
              "findings": null
            }
            """;

        ItsmFindingCorrelationsBatchResponse response =
            JsonSerializer.Deserialize<ItsmFindingCorrelationsBatchResponse>(json, ContractJson.CamelCaseCompact)!;

        response.Findings.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_correlations_yields_empty_list_not_null()
    {
        const string json = """
            {
              "findingId": "f-1",
              "correlations": null
            }
            """;

        ItsmFindingCorrelationsByFindingResponse response =
            JsonSerializer.Deserialize<ItsmFindingCorrelationsByFindingResponse>(json, ContractJson.CamelCaseCompact)!;

        response.Correlations.Should().NotBeNull().And.BeEmpty();
    }
}
