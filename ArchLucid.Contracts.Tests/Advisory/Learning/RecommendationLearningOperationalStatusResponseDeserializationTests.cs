using System.Text.Json;

using ArchLucid.Contracts.Advisory.Learning;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Advisory.Learning;

[Trait("Category", "Unit")]
public sealed class RecommendationLearningOperationalStatusResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_eligibility_yields_non_null_eligibility_not_null()
    {
        const string json = """
            {
              "eligibility": null
            }
            """;

        RecommendationLearningOperationalStatusResponse? status =
            JsonSerializer.Deserialize<RecommendationLearningOperationalStatusResponse>(json, ContractJson.CamelCaseCompact);

        status.Should().NotBeNull();
        status!.Eligibility.Should().NotBeNull();
    }

    [Fact]
    public void Deserialize_null_active_profile_remains_null()
    {
        const string json = """
            {
              "eligibility": {},
              "activeProfile": null
            }
            """;

        RecommendationLearningOperationalStatusResponse? status =
            JsonSerializer.Deserialize<RecommendationLearningOperationalStatusResponse>(json, ContractJson.CamelCaseCompact);

        status.Should().NotBeNull();
        status!.ActiveProfile.Should().BeNull();
    }
}
