using ArchLucid.Core.Explanation;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Explanation;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ExplanationProjectionModelsTests
{
    [Fact]
    public void Explanation_projection_models_round_trip_properties()
    {
        DateTimeOffset createdUtc = new(2026, 8, 8, 15, 0, 0, TimeSpan.Zero);

        DecisionTraceEntry traceEntry = new()
        {
            TraceId = "trace-1",
            CreatedUtc = createdUtc,
            Kind = "ruleAudit",
            Description = "Denied public endpoint",
            Details = new Dictionary<string, object> { ["ruleId"] = "SEC-01" },
        };

        traceEntry.TraceId.Should().Be("trace-1");
        traceEntry.Kind.Should().Be("ruleAudit");
        traceEntry.Details.Should().ContainKey("ruleId");

        FindingTraceCompletenessScore completeness = new()
        {
            FindingId = "finding-42",
            EngineType = "policy",
            HasGraphNodeIds = true,
            HasRulesApplied = true,
            PopulatedFieldCount = 4,
            CompletenessRatio = 0.8,
            MissingTraceFields = ["alternativePaths"],
        };

        FindingRationale rationale = new()
        {
            FindingId = "finding-42",
            Title = "Open storage account",
            Severity = "High",
            Rationale = "Public blob access detected.",
            Category = "Security",
            EngineType = "policy",
            RelatedNodeIds = ["node-7"],
            RecommendedActions = ["Enable private endpoint"],
            TraceCompleteness = completeness,
        };

        rationale.TraceCompleteness.Should().NotBeNull();
        rationale.TraceCompleteness!.CompletenessRatio.Should().Be(0.8);
        rationale.RecommendedActions.Should().ContainSingle("Enable private endpoint");
    }
}
