using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class SecurityEvidencePathExplanationResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_business_impact_hypotheses_yields_empty_list_not_null()
    {
        const string json = """
            {
              "businessImpactHypotheses": null
            }
            """;

        SecurityEvidencePathExplanationResponse? response =
            JsonSerializer.Deserialize<SecurityEvidencePathExplanationResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.BusinessImpactHypotheses.Should().NotBeNull().And.BeEmpty();
    }
}
