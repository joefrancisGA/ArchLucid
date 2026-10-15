using System.Text.Json;

using ArchLucid.Contracts.Advisory.Learning;
using ArchLucid.Contracts.Advisory.Models;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Advisory;

[Trait("Category", "Unit")]
public sealed class AdvisoryContractDeserializationTests
{
    [Fact]
    public void Deserialize_null_history_yields_empty_list_not_null()
    {
        const string json = """
            {
              "history": null
            }
            """;

        RecommendationLearningOpsPageResponse? result =
            JsonSerializer.Deserialize<RecommendationLearningOpsPageResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.History.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_improvement_plan_collections_yield_empty_collections_not_null()
    {
        const string json = """
            {
              "recommendations": null,
              "summaryNotes": null,
              "policyPackAdvisoryDefaults": null
            }
            """;

        ImprovementPlan? result =
            JsonSerializer.Deserialize<ImprovementPlan>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Recommendations.Should().NotBeNull().And.BeEmpty();
        result.SummaryNotes.Should().NotBeNull().And.BeEmpty();
        result.PolicyPackAdvisoryDefaults.Should().NotBeNull().And.BeEmpty();
    }
}
