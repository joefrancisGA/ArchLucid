using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class ArchitectureFindingDeserializationTests
{
    [Fact]
    public void Deserialize_null_evidence_refs_yields_empty_list_not_null()
    {
        const string json = """
            {
              "sourceAgent": 0,
              "severity": 0,
              "category": "c",
              "message": "m",
              "evidenceRefs": null
            }
            """;

        ArchitectureFinding? finding =
            JsonSerializer.Deserialize<ArchitectureFinding>(json, ContractJson.CamelCaseCompact);

        finding.Should().NotBeNull();
        finding!.EvidenceRefs.Should().NotBeNull().And.BeEmpty();
    }
}
