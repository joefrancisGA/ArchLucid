using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class SecureNowHypothesisResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_cited_path_ids_yields_empty_list_not_null()
    {
        const string json = """
            {
              "citedPathIds": null
            }
            """;

        SecureNowHypothesisResponse? hypothesis =
            JsonSerializer.Deserialize<SecureNowHypothesisResponse>(json, ContractJson.CamelCaseCompact);

        hypothesis.Should().NotBeNull();
        hypothesis!.CitedPathIds.Should().NotBeNull().And.BeEmpty();
    }
}
