using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Application.Explanation.Models;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Explanation;

/// <summary>
///     JSON round-trip coverage for explainability DTOs returned by the Explanation API.
/// </summary>
[Trait("Category", "Unit")]
public sealed class FindingExplainabilityResultJsonRoundTripTests
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Converters =
        {
            new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)
        }
    };

    [Fact]
    public void FindingExplainabilityResult_round_trips_with_nested_lists_and_evidence_record()
    {
        FindingExplainabilityResult original = new()
        {
            FindingId = "find-1",
            Title = "Cross-tenant risk",
            EngineType = "deterministic",
            Severity = "high",
            TraceCompletenessRatio = 0.8125,
            MissingTraceFields = ["graphProjection", "rulePackVersion"],
            GraphNodeIdsExamined = ["n1", "n2", "n3"],
            RulesApplied = ["RLS-001", "RLS-042"],
            DecisionsTaken =
            [
                "Chose private endpoints",
                "Rejected public SMB — see INV-445 alignment"
            ],
            AlternativePathsConsidered =
            [
                "{\"path\":\"A\",\"nodes\":[\"x\",\"y\"]}",
                "{\"path\":\"B\",\"nested\":{\"z\":[\"p\",\"q\",\"r\"]}}"
            ],
            Notes = ["", "note-with-\"quotes\""],
            Evidence = new FindingExplainabilityEvidence(
                EvidenceRefs: ["ref-a", "ref-b"],
                Conclusion: "Control enforced via subnet isolation.",
                AlternativePathsConsidered:
                [
                    "alt: migrate to managed identity",
                    "alt: IP allow-list (rejected)"
                ],
                RuleId: "RLS-STORAGE-01"),
            NarrativeText = "Line1\nLine2\n```not a fence```\n",
            EvaluationConfidenceScore = 88,
            ConfidenceLevel = FindingConfidenceLevel.High
        };

        string json = JsonSerializer.Serialize(original, JsonOptions);
        FindingExplainabilityResult? back = JsonSerializer.Deserialize<FindingExplainabilityResult>(json, JsonOptions);

        back.Should().NotBeNull();
        back.FindingId.Should().Be(original.FindingId);
        back.Title.Should().Be(original.Title);
        back.EngineType.Should().Be(original.EngineType);
        back.Severity.Should().Be(original.Severity);
        back.TraceCompletenessRatio.Should().Be(original.TraceCompletenessRatio);
        back.MissingTraceFields.Should().Equal(original.MissingTraceFields);
        back.GraphNodeIdsExamined.Should().Equal(original.GraphNodeIdsExamined);
        back.RulesApplied.Should().Equal(original.RulesApplied);
        back.DecisionsTaken.Should().Equal(original.DecisionsTaken);
        back.AlternativePathsConsidered.Should().Equal(original.AlternativePathsConsidered);
        back.Notes.Should().Equal(original.Notes);
        back.NarrativeText.Should().Be(original.NarrativeText);
        back.EvaluationConfidenceScore.Should().Be(original.EvaluationConfidenceScore);
        back.ConfidenceLevel.Should().Be(original.ConfidenceLevel);
        back.Evidence.EvidenceRefs.Should().Equal(original.Evidence.EvidenceRefs);
        back.Evidence.Conclusion.Should().Be(original.Evidence.Conclusion);
        back.Evidence.AlternativePathsConsidered.Should().Equal(original.Evidence.AlternativePathsConsidered);
        back.Evidence.RuleId.Should().Be(original.Evidence.RuleId);
    }
}
