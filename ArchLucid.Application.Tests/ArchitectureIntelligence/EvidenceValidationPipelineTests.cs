using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using Moq;

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
        result.CitationProbe.Should().Be(CitationProbeOutcome.Refuted);
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
        result.CitationProbe.Should().Be(CitationProbeOutcome.SurvivedWithinCitedSources);
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
        result.CitationProbe.Should().Be(CitationProbeOutcome.Untestable);
        result.SemanticAssessment.Should().Be(SemanticSupportAssessment.DoesNotEstablish);
        gateway.SemanticCalls.Should().Be(0);
    }

    [Fact]
    public void Unavailable_source_leaves_citation_probe_untestable()
    {
        var result = _pipeline.Validate("f", ["absent"], ["an attributed passage"], _store, "Private endpoint");
        result.OverallPassedIntegrity.Should().BeFalse();
        result.CitationProbe.Should().Be(CitationProbeOutcome.Untestable);
    }

    [Theory]
    [InlineData(0, "0.25", "token budget")]
    [InlineData(16384, "0", "cost budget")]
    public async Task Exhausted_capacity_never_calls_the_model_or_promotes_valid_citations(
        int tokens, string dollars, string reason)
    {
        const string passage = "The inventory includes the endpoint but does not establish that it is private.";
        var source = StoreArtifact(passage);
        Mock<IAgentCompletionClient> provider = new(MockBehavior.Strict);
        using var services = CreateServices(provider.Object,
            new ArchitectureIntelligencePipelineOptions
            {
                SemanticVerificationTokenAllowance = tokens,
                SemanticVerificationEstimatedUsdAllowance = decimal.Parse(dollars, System.Globalization.CultureInfo.InvariantCulture),
            });
        var pipeline = new EvidenceValidationPipeline(new ArchitectureIntelligenceLlmGateway(services));

        var result = await pipeline.ValidateAsync("f", [source.ArtifactId], [passage], _store,
            "Fail:Critical:endpoint is private");

        provider.VerifyNoOtherCalls();
        result.SemanticVerificationDeferredReason.Should().Contain(reason);
        AssertDeferred(result);
    }

    [Fact]
    public async Task Ordinary_findings_cannot_spend_capacity_reserved_for_high_severity()
    {
        const string passage = "The inventory records the approved endpoint.";
        var source = StoreArtifact(passage);
        Mock<IAgentCompletionClient> provider = new(MockBehavior.Strict);
        provider.Setup(client => client.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), 128, null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("""{"assessment":"Supports"}""");
        provider.Setup(client => client.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), 256, null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("""{"assessment":"Supports"}""");
        using var services = CreateServices(provider.Object, new ArchitectureIntelligencePipelineOptions(), cost: 0.08m);
        var pipeline = new EvidenceValidationPipeline(new ArchitectureIntelligenceLlmGateway(services));

        var first = await pipeline.ValidateAsync("first", [source.ArtifactId], [passage], _store, "Fail:Medium:endpoint");
        var second = await pipeline.ValidateAsync("second", [source.ArtifactId], [passage], _store, "Fail:Low:endpoint");
        var third = await pipeline.ValidateAsync("third", [source.ArtifactId], [passage], _store, "Fail:High:endpoint");

        first.SemanticMethod.Should().Be(SemanticAssessmentMethod.Model);
        AssertDeferred(second);
        third.SemanticMethod.Should().Be(SemanticAssessmentMethod.Model);
        provider.Verify(client => client.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), 128, null,
            It.IsAny<CancellationToken>()), Times.Once);
        provider.Verify(client => client.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), 256, null,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Concurrent_findings_cannot_oversubscribe_remaining_budget()
    {
        const string passage = "The inventory records the approved endpoint.";
        var source = StoreArtifact(passage);
        TaskCompletionSource<string> providerReply = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<IAgentCompletionClient> provider = new(MockBehavior.Strict);
        provider.Setup(client => client.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), 256, null,
                It.IsAny<CancellationToken>()))
            .Returns(providerReply.Task);
        using var services = CreateServices(provider.Object,
            new ArchitectureIntelligencePipelineOptions { SemanticVerificationEstimatedUsdAllowance = 0.10m }, cost: 0.08m);
        var pipeline = new EvidenceValidationPipeline(new ArchitectureIntelligenceLlmGateway(services));

        Task<EvidenceValidationResult> admitted = pipeline.ValidateAsync("first", [source.ArtifactId], [passage],
            _store, "Fail:High:endpoint");
        var denied = await pipeline.ValidateAsync("second", [source.ArtifactId], [passage], _store, "Fail:High:endpoint");

        AssertDeferred(denied);
        providerReply.SetResult("""{"assessment":"Supports"}""");
        (await admitted).SemanticMethod.Should().Be(SemanticAssessmentMethod.Model);
        provider.Verify(client => client.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), 256, null,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Deadline_discards_a_late_supported_assessment()
    {
        const string passage = "The inventory records the approved endpoint.";
        var source = StoreArtifact(passage);
        FakeTimeProvider clock = new();
        TaskCompletionSource<string> providerReply = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<IAgentCompletionClient> provider = new(MockBehavior.Strict);
        provider.Setup(client => client.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), 256, null,
                It.IsAny<CancellationToken>()))
            .Returns(providerReply.Task);
        using var services = CreateServices(provider.Object, new ArchitectureIntelligencePipelineOptions(), clock: clock);
        var pipeline = new EvidenceValidationPipeline(new ArchitectureIntelligenceLlmGateway(services));

        var pending = pipeline.ValidateAsync("f", [source.ArtifactId], [passage], _store, "Fail:High:endpoint");
        clock.Advance(TimeSpan.FromSeconds(11));
        var result = await pending.WaitAsync(TimeSpan.FromSeconds(2));
        providerReply.SetResult("""{"assessment":"Supports"}""");

        result.SemanticVerificationDeferredReason.Should().Contain("deadline");
        AssertDeferred(result);
    }

    [Fact]
    public async Task Tenant_budget_denial_cannot_promote_a_claim_through_heuristic_fallback()
    {
        const string passage = "The inventory records the approved endpoint.";
        var source = StoreArtifact(passage);
        Mock<IAgentCompletionClient> provider = new(MockBehavior.Strict);
        provider.Setup(client => client.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), 256, null,
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new LlmTokenQuotaExceededException("Tenant limit reached."));
        using var services = CreateServices(provider.Object, new ArchitectureIntelligencePipelineOptions());
        var pipeline = new EvidenceValidationPipeline(new ArchitectureIntelligenceLlmGateway(services));

        var result = await pipeline.ValidateAsync("f", [source.ArtifactId], [passage], _store, "Fail:High:endpoint");

        result.SemanticVerificationDeferredReason.Should().Contain("tenant AI");
        AssertDeferred(result);
    }

    private static ServiceProvider CreateServices(IAgentCompletionClient provider,
        ArchitectureIntelligencePipelineOptions options, decimal cost = 0.01m, TimeProvider? clock = null)
    {
        Mock<ILlmCostEstimator> estimator = new();
        estimator.Setup(value => value.EstimateUsd(It.IsAny<int>(), It.IsAny<int>(), 0, null, null)).Returns(cost);
        return new ServiceCollection()
            .AddSingleton(provider)
            .AddSingleton(Options.Create(options))
            .AddSingleton(estimator.Object)
            .AddSingleton(clock ?? TimeProvider.System)
            .BuildServiceProvider();
    }

    private static void AssertDeferred(EvidenceValidationResult result)
    {
        result.OverallPassedIntegrity.Should().BeTrue();
        result.SemanticAssessment.Should().Be(SemanticSupportAssessment.DoesNotEstablish);
        result.SemanticMethod.Should().Be(SemanticAssessmentMethod.NotPerformed);
        result.SupportTier.Should().Be(EvidenceSupportTier.Unverified);
        result.Escalated.Should().BeTrue();
        result.StageResults.Should().Contain(stage =>
            stage.Stage == EvidenceValidationStage.Escalation && stage.Detail!.Contains("Human review"));
        var finding = new SpecialistReviewFinding { FindingId = result.FindingId, Confidence = 1 };
        new TrustPublishGate().Decide([finding], [], [result], []).PublishableFindings.Should().BeEmpty();
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
