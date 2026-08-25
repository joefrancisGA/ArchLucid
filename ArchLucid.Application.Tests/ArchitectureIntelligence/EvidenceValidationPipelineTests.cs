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

    [Fact]
    public async Task ValidateAsync_uses_llm_semantic_assessment_when_gateway_returns_value()
    {
        ImmutableSourceArtifact artifact = StoreArtifact("quote appears in source for critical finding");
        EvidenceValidationPipeline pipeline = new(new FixedSemanticGateway(SemanticSupportAssessment.Supports));

        EvidenceValidationResult result = await pipeline.ValidateAsync(
            "finding-llm",
            [artifact.ArtifactId],
            ["quote appears in source for critical finding"],
            _store,
            "Critical finding");

        result.SemanticAssessment.Should().Be(SemanticSupportAssessment.Supports);
        result.StageResults.Single(stage => stage.Stage == EvidenceValidationStage.SemanticSupport)
            .Detail.Should().Contain("via LLM");
    }

    private sealed class FixedSemanticGateway : IArchitectureIntelligenceLlmGateway
    {
        private readonly SemanticSupportAssessment _assessment;

        public FixedSemanticGateway(SemanticSupportAssessment assessment)
        {
            _assessment = assessment;
        }

        public bool IsClientAvailable => true;

        public Task<IReadOnlyList<ArchitectureModelElement>?> ExtractElementsAsync(
            string sourceText,
            string artifactId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<ArchitectureModelElement>?>(null);

        public Task<SpecialistReviewResult?> ReviewDimensionAsync(
            ArchitectureKnowledgeModel model,
            QualityDimension dimension,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<SpecialistReviewResult?>(null);

        public Task<IReadOnlyList<AdversarialChallenge>?> GenerateAdversarialChallengesAsync(
            IReadOnlyList<SpecialistReviewFinding> findings,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<AdversarialChallenge>?>(null);

        public Task<IReadOnlyList<ArchitectureRecommendation>?> DraftRecommendationsAsync(
            ArchitectureKnowledgeModel model,
            IReadOnlyList<SpecialistReviewFinding> findings,
            IReadOnlyList<string> declaredPriorities,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<ArchitectureRecommendation>?>(null);

        public Task<SemanticSupportAssessment?> AssessSemanticSupportAsync(
            string claimedConclusion,
            IReadOnlyList<string> citedQuotes,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<SemanticSupportAssessment?>(_assessment);
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
