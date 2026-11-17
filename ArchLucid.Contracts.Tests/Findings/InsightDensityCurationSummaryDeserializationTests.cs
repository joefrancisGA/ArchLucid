using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class InsightDensityCurationSummaryDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "demotedToChecklistCount": 0,
              "retainedFindingCount": 1,
              "heldCheckLedgerEntries": null,
              "proseAssumptionRegisterEntries": null,
              "proseAssumptionHeldCheckAsks": null
            }
            """;

        InsightDensityCurationSummary? summary =
            JsonSerializer.Deserialize<InsightDensityCurationSummary>(json, ContractJson.CamelCaseCompact);

        summary.Should().NotBeNull();
        summary!.HeldCheckLedgerEntries.Should().NotBeNull().And.BeEmpty();
        summary.ProseAssumptionRegisterEntries.Should().NotBeNull().And.BeEmpty();
        summary.ProseAssumptionHeldCheckAsks.Should().NotBeNull().And.BeEmpty();
    }
}
