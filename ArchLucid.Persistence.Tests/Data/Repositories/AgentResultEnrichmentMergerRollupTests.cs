using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Persistence;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

/// <summary>Rollup/compare enrichment merge (TB-2053) — projected rows must stay free of forensic LOB fields.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentResultEnrichmentMergerRollupTests
{
    [Fact]
    public void ApplyRollup_returns_the_same_list_when_no_enrichments_exist()
    {
        IReadOnlyList<AgentResult> projected = [CreateResult("r1")];

        IReadOnlyList<AgentResult> merged = AgentResultEnrichmentMerger.ApplyRollup(
            projected,
            new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal));

        merged.Should().BeSameAs(projected);
    }

    [Fact]
    public void ApplyRollup_applies_calibrated_confidence_when_no_enriched_blob_exists()
    {
        AgentResult projected = CreateResult("r1");

        IReadOnlyList<AgentResult> merged = AgentResultEnrichmentMerger.ApplyRollup(
            [projected],
            new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal)
            {
                ["r1"] = new()
                {
                    ResultId = "r1",
                    CalibratedConfidence = 0.77,
                },
            });

        merged.Should().ContainSingle();
        merged[0].CalibratedConfidence.Should().Be(0.77);
    }

    [Fact]
    public void ApplyRollup_keeps_results_without_a_matching_enrichment()
    {
        AgentResult unmatched = CreateResult("other");

        IReadOnlyList<AgentResult> merged = AgentResultEnrichmentMerger.ApplyRollup(
            [unmatched],
            new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal)
            {
                ["r1"] = new()
                {
                    ResultId = "r1",
                    CalibratedConfidence = 0.5,
                },
            });

        merged.Should().ContainSingle().Which.Should().BeSameAs(unmatched);
    }

    [Fact]
    public void ApplyRollup_reprojects_an_enriched_blob_and_strips_heavy_fields()
    {
        AgentResult enriched = CreateResult("r1");
        enriched.Confidence = 0.93;
        enriched.ReasoningTrace = "long forensic reasoning";

        IReadOnlyList<AgentResult> merged = AgentResultEnrichmentMerger.ApplyRollup(
            [CreateResult("r1")],
            new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal)
            {
                ["r1"] = new()
                {
                    ResultId = "r1",
                    EnrichedResultJson = JsonSerializer.Serialize(enriched, ContractJson.Default),
                },
            });

        merged.Should().ContainSingle();
        merged[0].Confidence.Should().Be(0.93);
        merged[0].ReasoningTrace.Should().BeNull();
    }

    [Fact]
    public void ApplyRollup_throws_when_the_enriched_blob_is_corrupt()
    {
        Action act = () => AgentResultEnrichmentMerger.ApplyRollup(
            [CreateResult("r1")],
            new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal)
            {
                ["r1"] = new()
                {
                    ResultId = "r1",
                    EnrichedResultJson = "{ not valid json",
                },
            });

        act.Should().Throw<InvalidOperationException>().WithMessage("*r1*");
    }

    private static AgentResult CreateResult(string resultId) =>
        new()
        {
            ResultId = resultId,
            TaskId = "t1",
            RunId = "run1",
            AgentType = AgentType.Compliance,
            Confidence = 0.4,
        };
}
