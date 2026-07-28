using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class EvidenceValidationPipelineTests
{
    private readonly EvidenceValidationPipeline _pipeline = new();
    private readonly InMemoryImmutableSourceStore _store = new();

    [Fact]
    public void Validate_marks_integrity_stage_as_deterministic()
    {
        ImmutableSourceArtifact artifact = StoreArtifact("quote appears in source");
        EvidenceValidationResult result = _pipeline.Validate(
            "finding-1",
            [artifact.ArtifactId],
            ["quote appears in source"],
            _store,
            "Critical finding");

        EvidenceValidationStageOutcome integrityStage = result.StageResults
            .Single(stage => stage.Stage == EvidenceValidationStage.DeterministicIntegrity);

        integrityStage.IsDeterministic.Should().BeTrue();
        integrityStage.Passed.Should().BeTrue();
        result.OverallPassedIntegrity.Should().BeTrue();
    }

    [Fact]
    public void Validate_marks_semantic_stage_as_not_deterministic()
    {
        ImmutableSourceArtifact artifact = StoreArtifact("short");
        EvidenceValidationResult result = _pipeline.Validate(
            "finding-2",
            [artifact.ArtifactId],
            ["short"],
            _store,
            "Medium finding");

        EvidenceValidationStageOutcome semanticStage = result.StageResults
            .Single(stage => stage.Stage == EvidenceValidationStage.SemanticSupport);

        semanticStage.IsDeterministic.Should().BeFalse();
        result.SemanticAssessment.Should().Be(SemanticSupportAssessment.PartiallySupports);
    }

    private ImmutableSourceArtifact StoreArtifact(string content)
    {
        ImmutableSourceArtifact artifact = new()
        {
            ArtifactId = $"{ArchitectureIntelligenceArtifactPrefixes.KnownArtifactIdPrefix}test",
            TenantId = "tenant-1",
            ContentType = "text/plain",
            Version = "1",
        };

        return _store.Store(artifact, System.Text.Encoding.UTF8.GetBytes(content));
    }
}
