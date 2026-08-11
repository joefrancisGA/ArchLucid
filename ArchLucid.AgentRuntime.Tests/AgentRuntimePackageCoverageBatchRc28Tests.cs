using System.Text.Json;

using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.Caching;
using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

/// <summary>
///     RC28 package-coverage batch: insight-density evidence summary, LLM cache ambient flag, and JSON evidence
///     grounding helpers.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentRuntimePackageCoverageBatchRc28Tests
{
    [Fact]
    public void InsightDensityJudgeEvidenceSummary_Build_rejects_null_args()
    {
        FluentActions
            .Invoking(() => InsightDensityJudgeEvidenceSummary.Build(null!, new ArchitectureRequest()))
            .Should()
            .Throw<ArgumentNullException>();

        FluentActions
            .Invoking(() => InsightDensityJudgeEvidenceSummary.Build(new AgentEvidencePackage(), null!))
            .Should()
            .Throw<ArgumentNullException>();
    }

    [Fact]
    public void InsightDensityJudgeEvidenceSummary_Build_includes_request_fields()
    {
        ArchitectureRequest request = new()
        {
            SystemName = "payments-api",
            Environment = "prod",
            Description = "Checkout topology",
        };
        AgentEvidencePackage evidence = new();

        string summary = InsightDensityJudgeEvidenceSummary.Build(evidence, request);

        summary.Should().Contain("payments-api");
        summary.Should().Contain("prod");
        summary.Should().Contain("Checkout topology");
        summary.Should().NotBe("(empty evidence package)");
    }

    [Fact]
    public void LlmCompletionCacheServedAmbient_BeginTaskScope_resets_and_restores()
    {
        using (LlmCompletionCacheServedAmbient.BeginTaskScope())
        {
            LlmCompletionCacheServedAmbient.CurrentTaskCacheServed.Should().BeFalse();
            LlmCompletionCacheServedAmbient.MarkServed();
            LlmCompletionCacheServedAmbient.CurrentTaskCacheServed.Should().BeTrue();
        }

        LlmCompletionCacheServedAmbient.CurrentTaskCacheServed.Should().BeFalse();
    }

    [Fact]
    public void AgentResultJsonEvidenceGrounding_TryDescribeClaim_string_and_object()
    {
        using JsonDocument stringDoc = JsonDocument.Parse("\"plain claim\"");
        AgentResultJsonEvidenceGrounding.TryDescribeClaim(stringDoc.RootElement, out string stringText, out List<string> stringRefs)
            .Should().BeTrue();
        stringText.Should().Be("plain claim");
        stringRefs.Should().BeEmpty();

        using JsonDocument objectDoc = JsonDocument.Parse(
            """{"detail":"endpoint public","evidenceRefs":["ref-a","ref-b"]}""");
        AgentResultJsonEvidenceGrounding.TryDescribeClaim(objectDoc.RootElement, out string objectText, out List<string> objectRefs)
            .Should().BeTrue();
        objectText.Should().Contain("endpoint public");
        objectRefs.Should().Equal("ref-a", "ref-b");
    }

    [Fact]
    public void AgentResultJsonEvidenceGrounding_TryDescribeClaim_rejects_non_claim_shapes()
    {
        using JsonDocument numberDoc = JsonDocument.Parse("42");

        AgentResultJsonEvidenceGrounding.TryDescribeClaim(numberDoc.RootElement, out _, out _)
            .Should().BeFalse();
    }

    [Fact]
    public void AgentResultJsonEvidenceGrounding_TryGetFindingTextParts_reads_common_properties()
    {
        using JsonDocument findingDoc = JsonDocument.Parse(
            """{"category":"Security","description":"Open NSG","recommendation":"Restrict"}""");

        bool ok = AgentResultJsonEvidenceGrounding.TryGetFindingTextParts(
            findingDoc.RootElement,
            out string category,
            out string description,
            out string recommendation);

        ok.Should().BeTrue();
        category.Should().Be("Security");
        description.Should().Be("Open NSG");
        recommendation.Should().Be("Restrict");
    }
}
