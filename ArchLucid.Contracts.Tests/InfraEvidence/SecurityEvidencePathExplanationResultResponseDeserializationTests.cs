using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class SecurityEvidencePathExplanationResultResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_explanation_remains_null()
    {
        const string json = """
            {
              "succeeded": false,
              "explanation": null
            }
            """;

        SecurityEvidencePathExplanationResultResponse? response =
            JsonSerializer.Deserialize<SecurityEvidencePathExplanationResultResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Explanation.Should().BeNull();
    }
}
