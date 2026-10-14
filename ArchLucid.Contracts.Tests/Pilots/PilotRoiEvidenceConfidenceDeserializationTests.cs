using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class PilotRoiEvidenceConfidenceDeserializationTests
{
    [Fact]
    public void Deserialize_integer_out_of_range_roi_evidence_confidence_throws()
    {
        const string json = """
            {
              "roiEvidenceConfidence": 99
            }
            """;

        Action act = () => JsonSerializer.Deserialize<ProofPackageCompletenessResponse>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_string_numeric_out_of_range_roi_evidence_confidence_throws()
    {
        const string json = """
            {
              "roiEvidenceConfidence": "99"
            }
            """;

        Action act = () => JsonSerializer.Deserialize<ProofPackageCompletenessResponse>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_defined_roi_evidence_confidence()
    {
        const string json = """
            {
              "roiEvidenceConfidence": 0
            }
            """;

        ProofPackageCompletenessResponse response =
            JsonSerializer.Deserialize<ProofPackageCompletenessResponse>(json, ContractJson.Default)!;

        response.RoiEvidenceConfidence.Should().Be(PilotRoiEvidenceConfidence.Strong);
    }
}
