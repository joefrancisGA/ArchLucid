using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class LlmBackedAdversarialReviewServiceTests
{
    [Fact]
    public async Task ReviewAsync_uses_llm_challenges_when_gateway_returns_them()
    {
        AdversarialReviewService heuristic = new();
        LlmBackedAdversarialReviewService sut = new(new FixedAdversarialGateway(hasChallenges: true), heuristic);

        SpecialistReviewFinding finding = new()
        {
            FindingId = "f1",
            Dimension = QualityDimension.Security,
            Title = "Missing auth",
            Rationale = "Public endpoint.",
            Conclusion = ReviewConclusion.Fail,
            EvidenceCondition = EvidenceCondition.Insufficient,
            Severity = "High",
        };

        AdversarialReviewResult result = await sut.ReviewAsync([finding], integrityPassedFindingIds: new HashSet<string>());

        result.Challenges.Should().ContainSingle(challenge =>
            challenge.Hypothesis.Contains("LLM hypothesis", StringComparison.Ordinal));
    }

    [Fact]
    public async Task ReviewAsync_falls_back_to_heuristic_when_gateway_returns_null()
    {
        AdversarialReviewService heuristic = new();
        LlmBackedAdversarialReviewService sut = new(new FixedAdversarialGateway(hasChallenges: false), heuristic);

        SpecialistReviewFinding finding = new()
        {
            FindingId = "f2",
            Dimension = QualityDimension.Security,
            Title = "Missing auth",
            Rationale = "Public endpoint.",
            Conclusion = ReviewConclusion.Fail,
            EvidenceCondition = EvidenceCondition.Insufficient,
            Severity = "High",
        };

        AdversarialReviewResult result = await sut.ReviewAsync([finding]);

        result.Challenges.Should().ContainSingle();
        result.Challenges[0].Hypothesis.Should().Contain("Challenge finding");
    }

    private sealed class FixedAdversarialGateway : IArchitectureIntelligenceLlmGateway
    {
        private readonly bool _hasChallenges;

        public FixedAdversarialGateway(bool hasChallenges)
        {
            _hasChallenges = hasChallenges;
        }

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
            CancellationToken cancellationToken = default)
        {
            if (!_hasChallenges)
            {
                return Task.FromResult<IReadOnlyList<AdversarialChallenge>?>(null);
            }

            return Task.FromResult<IReadOnlyList<AdversarialChallenge>?>(
            [
                new AdversarialChallenge
                {
                    ChallengeId = "c1",
                    Hypothesis = "LLM hypothesis about missing auth",
                    FalsificationEvidenceNeeded = "Show auth middleware config",
                    Confidence = 0.6,
                    Lane = AdversarialLane.AdversarialChallenge,
                },
            ]);
        }

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
            Task.FromResult<SemanticSupportAssessment?>(null);
    }
}
