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
    public void Validate_completeness_detail_requires_integrity_before_verified_wording()
    {
        EvidenceValidationResult result = _pipeline.Validate(
            "finding-5",
            [],
            ["orphan quote"],
            _store,
            "Critical finding");

        EvidenceValidationStageOutcome completenessStage = result.StageResults
            .Single(stage => stage.Stage == EvidenceValidationStage.Completeness);

        completenessStage.Detail.Should().Be("Completeness was not verified because integrity verification did not pass.");
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

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Unverified_supplemental_quote_fails_before_semantic_review(bool asyncPath)
    {
        ImmutableSourceArtifact source = StoreArtifact("The inventory contains the approved endpoint.");
        var gateway = new FixedSemanticGateway(SemanticSupportAssessment.Supports);
        var pipeline = new EvidenceValidationPipeline(gateway);
        string[] ids = [source.ArtifactId];
        string[] quotes = ["approved endpoint", "All endpoints were verified as private."];
        const string claim = "All endpoints were verified as private.";

        var result = asyncPath
            ? await pipeline.ValidateAsync("f", ids, quotes, _store, claim)
            : pipeline.Validate("f", ids, quotes, _store, claim);

        result.OverallPassedIntegrity.Should().BeFalse();
        result.SemanticAssessment.Should().Be(SemanticSupportAssessment.DoesNotEstablish);
        result.Escalated.Should().BeTrue();
        result.SemanticMethod.Should().Be(SemanticAssessmentMethod.NotPerformed);
        gateway.SemanticCalls.Should().Be(0);
    }

    [Fact]
    public async Task Authentic_additional_passage_allows_one_semantic_review()
    {
        ImmutableSourceArtifact source = StoreArtifact("Inventory includes the endpoint. A private link is recorded.");
        var gateway = new FixedSemanticGateway(SemanticSupportAssessment.PartiallySupports);
        var pipeline = new EvidenceValidationPipeline(gateway);
        var result = await pipeline.ValidateAsync("f", [source.ArtifactId],
            ["includes the endpoint", "A private link is recorded"], _store, "Private endpoint");

        result.OverallPassedIntegrity.Should().BeTrue();
        result.SemanticAssessment.Should().Be(SemanticSupportAssessment.PartiallySupports);
        result.SemanticMethod.Should().Be(SemanticAssessmentMethod.Model);
        gateway.SemanticCalls.Should().Be(1);
    }

    [Fact]
    public async Task Intact_artifact_without_a_passage_spends_no_semantic_review_call()
    {
        ImmutableSourceArtifact source = StoreArtifact("Inventory includes the endpoint.");
        var gateway = new FixedSemanticGateway(SemanticSupportAssessment.Supports);
        var result = await new EvidenceValidationPipeline(gateway).ValidateAsync(
            "f", [source.ArtifactId], [], _store, "All endpoints are private");

        result.OverallPassedIntegrity.Should().BeTrue();
        result.SemanticAssessment.Should().Be(SemanticSupportAssessment.DoesNotEstablish);
        gateway.SemanticCalls.Should().Be(0);
    }

    private sealed class FixedSemanticGateway : IArchitectureIntelligenceLlmGateway
    {
        private readonly SemanticSupportAssessment _assessment;

        public FixedSemanticGateway(SemanticSupportAssessment assessment)
        {
            _assessment = assessment;
        }

        public int SemanticCalls { get; private set; }

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
            CancellationToken cancellationToken = default)
        {
            SemanticCalls++;
            return Task.FromResult<SemanticSupportAssessment?>(_assessment);
        }
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
