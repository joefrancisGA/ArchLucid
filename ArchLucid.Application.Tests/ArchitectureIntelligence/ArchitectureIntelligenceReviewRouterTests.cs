using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ArchitectureIntelligenceReviewRouterTests
{
    [Fact]
    public void IsLlmReviewEnabled_is_false_when_option_disabled()
    {
        ArchitectureIntelligenceReviewRouter router = CreateRouter(
            useLlmReview: false,
            clientAvailable: true);

        router.IsLlmReviewEnabled.Should().BeFalse();
    }

    [Fact]
    public void IsLlmReviewEnabled_is_false_when_client_unavailable()
    {
        ArchitectureIntelligenceReviewRouter router = CreateRouter(
            useLlmReview: true,
            clientAvailable: false);

        router.IsLlmReviewEnabled.Should().BeFalse();
    }

    [Fact]
    public void IsLlmReviewEnabled_is_true_when_option_and_client_available()
    {
        ArchitectureIntelligenceReviewRouter router = CreateRouter(
            useLlmReview: true,
            clientAvailable: true);

        router.IsLlmReviewEnabled.Should().BeTrue();
    }

    private static ArchitectureIntelligenceReviewRouter CreateRouter(bool useLlmReview, bool clientAvailable)
    {
        OptionsWrapper<ArchitectureIntelligencePipelineOptions> options = new(new ArchitectureIntelligencePipelineOptions
        {
            UseLlmReview = useLlmReview,
        });

        FixedAvailabilityGateway gateway = new(clientAvailable);

        return new ArchitectureIntelligenceReviewRouter(options, gateway);
    }

    private sealed class FixedAvailabilityGateway : IArchitectureIntelligenceLlmGateway
    {
        public FixedAvailabilityGateway(bool isClientAvailable)
        {
            IsClientAvailable = isClientAvailable;
        }

        public bool IsClientAvailable
        {
            get;
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
            Task.FromResult<SemanticSupportAssessment?>(null);
    }
}
