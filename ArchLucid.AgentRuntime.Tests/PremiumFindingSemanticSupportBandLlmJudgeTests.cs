using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
public sealed class PremiumFindingSemanticSupportBandLlmJudgeTests
{
    [Fact]
    public void TryScore_sync_path_always_returns_null()
    {
        PremiumFindingSemanticSupportBandLlmJudge judge = CreateJudge(
            new StubAgentCompletionClient("""{"band":"Supported"}"""));

        FindingSemanticSupportBand? band = judge.TryScore(
            CreateFinding("The API gateway should terminate TLS for the storefront."),
            "The API gateway should terminate TLS for the storefront.",
            ["The API gateway terminates TLS and forwards traffic to the internal router service."],
            new FindingSemanticSupportBandOptions());

        band.Should().BeNull();
    }

    [Fact]
    public async Task TryScoreAsync_parses_supported_for_paraphrase_unchecked_heuristic()
    {
        PremiumFindingSemanticSupportBandLlmJudge judge = CreateJudge(
            new StubAgentCompletionClient("""{"band":"Supported"}"""));

        const string claim = "Gateway layer provides encrypted transport before requests reach the router tier.";
        string[] excerpts = ["The API gateway terminates TLS and forwards traffic to the internal router service."];

        FindingSemanticSupportBand heuristic = FindingSemanticSupportBandScorer.Score(claim, excerpts);
        heuristic.Should().Be(FindingSemanticSupportBand.Unchecked);

        FindingSemanticSupportBand? band = await judge.TryScoreAsync(
            CreateFinding(claim),
            claim,
            excerpts,
            new FindingSemanticSupportBandOptions());

        band.Should().Be(FindingSemanticSupportBand.Supported);
    }

    [Fact]
    public async Task TryScoreAsync_fail_open_on_unparsable_json()
    {
        PremiumFindingSemanticSupportBandLlmJudge judge = CreateJudge(
            new StubAgentCompletionClient("not-json"));

        FindingSemanticSupportBand? band = await judge.TryScoreAsync(
            CreateFinding("The API gateway should terminate TLS for the storefront."),
            "The API gateway should terminate TLS for the storefront.",
            ["The API gateway terminates TLS and forwards traffic to the internal router service."],
            new FindingSemanticSupportBandOptions());

        band.Should().BeNull();
    }

    [Fact]
    public async Task TryScoreAsync_rejects_supported_invented_from_disjoint_citations()
    {
        PremiumFindingSemanticSupportBandLlmJudge judge = CreateJudge(
            new StubAgentCompletionClient("""{"band":"Supported"}"""));

        const string claim =
            "PostgreSQL firewall rules allow unrestricted storage account access from the public internet.";
        string[] excerpts =
            ["Kubernetes ingress controller exposes the storefront workload on port 443."];

        FindingSemanticSupportBand heuristic = FindingSemanticSupportBandScorer.Score(claim, excerpts);
        heuristic.Should().Be(FindingSemanticSupportBand.Unsupported);

        FindingSemanticSupportBand? band = await judge.TryScoreAsync(
            CreateFinding(claim),
            claim,
            excerpts,
            new FindingSemanticSupportBandOptions());

        band.Should().BeNull();
    }

    [Fact]
    public async Task TryScoreAsync_fail_open_when_completion_throws()
    {
        PremiumFindingSemanticSupportBandLlmJudge judge = CreateJudge(new ThrowingCompletionClient());

        FindingSemanticSupportBand? band = await judge.TryScoreAsync(
            CreateFinding("The API gateway should terminate TLS for the storefront."),
            "The API gateway should terminate TLS for the storefront.",
            ["The API gateway terminates TLS and forwards traffic to the internal router service."],
            new FindingSemanticSupportBandOptions());

        band.Should().BeNull();
    }

    [Fact]
    public async Task TryScoreAsync_returns_null_when_citations_empty()
    {
        PremiumFindingSemanticSupportBandLlmJudge judge = CreateJudge(
            new StubAgentCompletionClient("""{"band":"Supported"}"""));

        FindingSemanticSupportBand? band = await judge.TryScoreAsync(
            CreateFinding("The API gateway should terminate TLS for the storefront."),
            "The API gateway should terminate TLS for the storefront.",
            [],
            new FindingSemanticSupportBandOptions());

        band.Should().BeNull();
    }

    [Fact]
    public void System_prompt_forbids_invented_citations_and_seal_language()
    {
        FindingSemanticSupportBandLlmJudgePrompts.SystemPrompt.Should().Contain("JSON only");
        FindingSemanticSupportBandLlmJudgePrompts.SystemPrompt.Should().Contain("Do not mark Supported when the excerpts are disjoint");
        FindingSemanticSupportBandLlmJudgePrompts.SystemPrompt.Should().Contain("Do not mark Unsupported when the claim is an exact quote");
        FindingSemanticSupportBandLlmJudgePrompts.SystemPrompt.Should().Contain("inventing citations");
        FindingSemanticSupportBandLlmJudgePrompts.SystemPrompt.Should().Contain("When unsure, return Unchecked");
    }

    private static PremiumFindingSemanticSupportBandLlmJudge CreateJudge(IAgentCompletionClient client)
    {
        return new PremiumFindingSemanticSupportBandLlmJudge(
            new StubAgentTierCompletionRouter(client),
            NullLogger<PremiumFindingSemanticSupportBandLlmJudge>.Instance);
    }

    private static Finding CreateFinding(string rationale) =>
        new()
        {
            FindingId = "f-semantic",
            Classification = FindingClassification.DecisionGradeFinding,
            Title = "Semantic row",
            Rationale = rationale,
            SemanticSupportBand = FindingSemanticSupportBand.Unchecked,
            EvidenceRefs = ["placeholder"],
        };

    private sealed class StubAgentTierCompletionRouter(IAgentCompletionClient client) : IAgentTierCompletionRouter
    {
        public IAgentCompletionClient DefaultCompletionClient => client;

        public (IAgentCompletionClient Client, LlmModelTier ResolvedTier) ResolveForAgent(
            AgentType agentType,
            LlmModelTier? taskTierOverride) => (client, LlmModelTier.Premium);

        public (IAgentCompletionClient Client, LlmModelTier ResolvedTier) ResolveForAgentTypeName(
            string agentTypeName,
            LlmModelTier? taskTierOverride) => (client, LlmModelTier.Premium);
    }

    private sealed class ThrowingCompletionClient : IAgentCompletionClient
    {
        public LlmProviderDescriptor Descriptor => LlmProviderDescriptor.ForOffline("throw", "throw");

        public Task<string> CompleteJsonAsync(
            string systemPrompt,
            string userPrompt,
            int? maxTokens = null,
            float? temperature = null,
            CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException("completion failed");
    }
}
