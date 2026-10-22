using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class SecurityEvidencePathRankSummaryResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_related_cut_points_yields_empty_list_not_null()
    {
        const string json = """
            {
              "relatedCutPoints": null
            }
            """;

        SecurityEvidencePathRankSummaryResponse? response =
            JsonSerializer.Deserialize<SecurityEvidencePathRankSummaryResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.RelatedCutPoints.Should().NotBeNull().And.BeEmpty();
    }
}
