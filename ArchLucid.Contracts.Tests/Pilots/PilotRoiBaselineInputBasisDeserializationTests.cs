using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class PilotRoiBaselineInputBasisDeserializationTests
{
    [Fact]
    public void Deserialize_integer_out_of_range_review_cycle_hours_basis_throws()
    {
        const string json = """
            {
              "reviewCycleHoursBasis": 99,
              "architectPrepHoursPerReviewBasis": 0,
              "evidenceAssemblyEffortBasis": 0,
              "architectHourlyCostBasis": 0,
              "projectedDollarClaimsSponsorSafe": true,
              "sponsorSafeFallbackCopy": ""
            }
            """;

        Action act = () => JsonSerializer.Deserialize<PilotRoiBaselineInputsStatusResponse>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_integer_out_of_range_basis_via_proof_package_nested_object_throws()
    {
        const string json = """
            {
              "roiBaselineInputs": {
                "reviewCycleHoursBasis": 99,
                "architectPrepHoursPerReviewBasis": 0,
                "evidenceAssemblyEffortBasis": 0,
                "architectHourlyCostBasis": 0,
                "projectedDollarClaimsSponsorSafe": true,
                "sponsorSafeFallbackCopy": ""
              }
            }
            """;

        Action act = () => JsonSerializer.Deserialize<ProofPackageCompletenessResponse>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_defined_review_cycle_hours_basis()
    {
        const string json = """
            {
              "reviewCycleHoursBasis": 1,
              "architectPrepHoursPerReviewBasis": 0,
              "evidenceAssemblyEffortBasis": 0,
              "architectHourlyCostBasis": 0,
              "projectedDollarClaimsSponsorSafe": true,
              "sponsorSafeFallbackCopy": ""
            }
            """;

        PilotRoiBaselineInputsStatusResponse response =
            JsonSerializer.Deserialize<PilotRoiBaselineInputsStatusResponse>(json, ContractJson.Default)!;

        response.ReviewCycleHoursBasis.Should().Be(PilotRoiBaselineInputBasis.Defaulted);
    }
}
