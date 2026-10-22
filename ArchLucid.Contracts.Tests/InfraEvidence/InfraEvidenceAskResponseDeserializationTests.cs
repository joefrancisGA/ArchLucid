using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class InfraEvidenceAskResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_citations_yields_empty_list_not_null()
    {
        const string json = """
            {
              "citations": null
            }
            """;

        InfraEvidenceAskResponse? response =
            JsonSerializer.Deserialize<InfraEvidenceAskResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Citations.Should().NotBeNull().And.BeEmpty();
    }
}
