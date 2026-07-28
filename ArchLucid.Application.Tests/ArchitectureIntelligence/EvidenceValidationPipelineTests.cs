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
        ImmutableSourceArtifact artifact = StoreArtifact("quote appears in source for critical finding");
        EvidenceValidationResult result = _pipeline.Validate(
            "finding-1",
            [artifact.ArtifactId],
            ["quote appears in source for critical finding"],
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
        result.SemanticAssessment.Should().Be(SemanticSupportAssessment.DoesNotEstablish);
    }

    [Fact]
    public void Validate_fails_integrity_when_no_artifacts_cited()
    {
        EvidenceValidationResult result = _pipeline.Validate(
            "finding-3",
            [],
            [],
            _store,
            "Fail:High:Missing evidence");

        result.OverallPassedIntegrity.Should().BeFalse();
        result.StageResults.Single(stage => stage.Stage == EvidenceValidationStage.DeterministicIntegrity)
            .Passed.Should().BeFalse();
    }

    [Fact]
    public void Validate_fails_integrity_when_quoted_text_is_absent_from_source()
    {
        ImmutableSourceArtifact artifact = StoreArtifact("actual source text");
        EvidenceValidationResult result = _pipeline.Validate(
            "finding-4",
            [artifact.ArtifactId],
            ["text that is not in the artifact"],
            _store,
            "Fail:High:Fabricated quote");

        result.OverallPassedIntegrity.Should().BeFalse();
    }

    private ImmutableSourceArtifact StoreArtifact(string content)
    {
        ImmutableSourceArtifact artifact = new()
        {
            ArtifactId = $"{ArchitectureIntelligenceArtifactPrefixes.KnownArtifactIdPrefix}{Guid.NewGuid():N}",
            TenantId = "tenant-1",
            ContentType = "text/plain",
            Version = "1",
        };

        return _store.Store(artifact, System.Text.Encoding.UTF8.GetBytes(content));
    }
}
