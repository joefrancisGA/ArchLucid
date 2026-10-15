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
    public void Deserialize_null_status_yields_non_null_ops_status_not_null()
    {
        const string json = """
            {
              "status": null
            }
            """;

        RecommendationLearningOpsPageResponse? result =
            JsonSerializer.Deserialize<RecommendationLearningOpsPageResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Status.Should().NotBeNull();
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

    [Fact]
    public void Deserialize_null_preview_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "weightDeltas": null,
              "validationChecks": null
            }
            """;

        RecommendationLearningPreviewResponse? result =
            JsonSerializer.Deserialize<RecommendationLearningPreviewResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.WeightDeltas.Should().NotBeNull().And.BeEmpty();
        result.ValidationChecks.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_learning_profile_collections_yield_empty_collections_not_null()
    {
        const string json = """
            {
              "categoryStats": null,
              "urgencyStats": null,
              "signalTypeStats": null,
              "categoryWeights": null,
              "urgencyWeights": null,
              "signalTypeWeights": null,
              "notes": null
            }
            """;

        RecommendationLearningProfile? result =
            JsonSerializer.Deserialize<RecommendationLearningProfile>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.CategoryStats.Should().NotBeNull().And.BeEmpty();
        result.UrgencyStats.Should().NotBeNull().And.BeEmpty();
        result.SignalTypeStats.Should().NotBeNull().And.BeEmpty();
        result.CategoryWeights.Should().NotBeNull().And.BeEmpty();
        result.UrgencyWeights.Should().NotBeNull().And.BeEmpty();
        result.SignalTypeWeights.Should().NotBeNull().And.BeEmpty();
        result.Notes.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_proposed_profile_yields_empty_profile_not_null()
    {
        const string json = """
            {
              "proposedProfile": null
            }
            """;

        RecommendationLearningPreviewResponse? result =
            JsonSerializer.Deserialize<RecommendationLearningPreviewResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.ProposedProfile.Should().NotBeNull();
    }
}
