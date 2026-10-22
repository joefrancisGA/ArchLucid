using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class SecurityEvidencePathRankDetailResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_dimension_prose_yields_non_null_prose_not_null()
    {
        const string json = """
            {
              "dimensionProse": null
            }
            """;

        SecurityEvidencePathRankDetailResponse? response =
            JsonSerializer.Deserialize<SecurityEvidencePathRankDetailResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.DimensionProse.Should().NotBeNull();
    }
}
