using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Runs;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Runs;

[Trait("Category", "Unit")]
public sealed class RunAssumptionAcknowledgementDocumentDeserializationTests
{
    [Fact]
    public void Deserialize_null_acknowledged_assumption_ids_yields_empty_list_not_null()
    {
        const string json = """
            {
              "acknowledgedAssumptionIds": null
            }
            """;

        RunAssumptionAcknowledgementDocument? document =
            JsonSerializer.Deserialize<RunAssumptionAcknowledgementDocument>(json, ContractJson.CamelCaseCompact);

        document.Should().NotBeNull();
        document!.AcknowledgedAssumptionIds.Should().NotBeNull().And.BeEmpty();
    }
}
