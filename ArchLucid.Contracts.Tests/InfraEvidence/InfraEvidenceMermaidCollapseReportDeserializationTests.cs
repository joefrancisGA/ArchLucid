using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class InfraEvidenceMermaidCollapseReportDeserializationTests
{
    [Fact]
    public void Deserialize_null_entries_yields_empty_list_not_null()
    {
        const string json = """
            {
              "entries": null
            }
            """;

        InfraEvidenceMermaidCollapseReport? report =
            JsonSerializer.Deserialize<InfraEvidenceMermaidCollapseReport>(json, ContractJson.CamelCaseCompact);

        report.Should().NotBeNull();
        report!.Entries.Should().NotBeNull().And.BeEmpty();
    }
}
