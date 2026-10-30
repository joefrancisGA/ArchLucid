using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class ComplianceDriftTrendPointDeserializationTests
{
    [Fact]
    public void Deserialize_null_changes_by_type_yields_empty_dictionary_not_null()
    {
        const string json = """
            {
              "bucketUtc": "2026-10-29T12:00:00Z",
              "changeCount": 0,
              "changesByType": null,
              "openFindingsCount": 0,
              "resolvedFindingsCount": 0
            }
            """;

        ComplianceDriftTrendPoint? point =
            JsonSerializer.Deserialize<ComplianceDriftTrendPoint>(json, ContractJson.CamelCaseCompact);

        point.Should().NotBeNull();
        point!.ChangesByType.Should().NotBeNull().And.BeEmpty();
    }
}
