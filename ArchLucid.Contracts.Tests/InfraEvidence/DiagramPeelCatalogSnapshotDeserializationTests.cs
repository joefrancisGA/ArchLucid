using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence.DiagramPeel;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class DiagramPeelCatalogSnapshotDeserializationTests
{
    [Fact]
    public void Deserialize_null_entries_yields_empty_list_not_null()
    {
        const string json = """
            {
              "entries": null
            }
            """;

        DiagramPeelCatalogSnapshot? snapshot =
            JsonSerializer.Deserialize<DiagramPeelCatalogSnapshot>(json, ContractJson.CamelCaseCompact);

        snapshot.Should().NotBeNull();
        snapshot!.Entries.Should().NotBeNull().And.BeEmpty();
    }
}
