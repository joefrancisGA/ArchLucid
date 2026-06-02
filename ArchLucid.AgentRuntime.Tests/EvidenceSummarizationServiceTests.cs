using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.AgentRuntime.Tokens;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
public sealed class EvidenceSummarizationServiceTests
{
    [Fact]
    public async Task SummarizeAsync_returns_original_text_when_disabled()
    {
        SpyAgentCompletionClient completionClient = new("{\"summary\":\"ignored\"}");
        EvidenceSummarizationService service = CreateService(completionClient, enabled: false);

        string evidence = new('x', 500);

        string result = await service.SummarizeAsync(evidence, targetMaxTokens: 100, AgentType.Topology);

        result.Should().Be(evidence);
        completionClient.CompleteCallCount.Should().Be(0);
    }

    [Fact]
    public async Task SummarizeAsync_uses_economy_tier_and_returns_summary()
    {
        SpyAgentCompletionClient completionClient = new("compressed evidence");
        RecordingTierRouter tierRouter = new(completionClient);
        EvidenceSummarizationService service = CreateService(tierRouter, enabled: true);

        string result = await service.SummarizeAsync("long evidence", targetMaxTokens: 200, AgentType.Compliance);

        result.Should().Be("compressed evidence");
        tierRouter.LastAgentType.Should().Be(AgentType.Compliance);
        tierRouter.LastTierOverride.Should().Be(LlmModelTier.Economy);
        completionClient.CompleteCallCount.Should().Be(1);
    }

    [Fact]
    public async Task SummarizeAsync_fail_open_on_completion_exception()
    {
        EvidenceSummarizationService service = CreateService(
            new ThrowingTierRouter(),
            enabled: true);

        string evidence = "original evidence payload";

        string result = await service.SummarizeAsync(evidence, targetMaxTokens: 100, AgentType.Topology);

        result.Should().Be(evidence);
    }

    private static EvidenceSummarizationService CreateService(IAgentCompletionClient inner, bool enabled) =>
        CreateService(AgentTierCompletionRouterTestFactory.CreatePassThrough(inner), enabled);

    private static EvidenceSummarizationService CreateService(IAgentTierCompletionRouter tierRouter, bool enabled)
    {
        TestOptionsMonitor<EvidenceSummarizationOptions> options = new(new EvidenceSummarizationOptions
        {
            Enabled = enabled,
            MaxInputCharacters = 128_000,
        });

        return new EvidenceSummarizationService(
            tierRouter,
            options,
            NullLogger<EvidenceSummarizationService>.Instance);
    }

    private sealed class SpyAgentCompletionClient(string json) : IAgentCompletionClient
    {
        public int CompleteCallCount
        {
            get;
            private set;
        }

        public LlmProviderDescriptor Descriptor => LlmProviderDescriptor.ForOffline("spy", "spy");

        public Task<string> CompleteJsonAsync(
            string systemPrompt,
            string userPrompt,
            int? maxTokens = null,
            float? temperature = null,
            CancellationToken cancellationToken = default)
        {
            CompleteCallCount++;

            return Task.FromResult(json);
        }
    }

    private sealed class RecordingTierRouter(IAgentCompletionClient inner) : IAgentTierCompletionRouter
    {
        public AgentType LastAgentType
        {
            get;
            private set;
        }

        public LlmModelTier? LastTierOverride
        {
            get;
            private set;
        }

        public IAgentCompletionClient DefaultCompletionClient => inner;

        public (IAgentCompletionClient Client, LlmModelTier ResolvedTier) ResolveForAgent(
            AgentType agentType,
            LlmModelTier? taskTierOverride)
        {
            LastAgentType = agentType;
            LastTierOverride = taskTierOverride;

            return (inner, taskTierOverride ?? LlmModelTier.Standard);
        }
    }

    private sealed class ThrowingTierRouter : IAgentTierCompletionRouter
    {
        public IAgentCompletionClient DefaultCompletionClient =>
            new ThrowingAgentCompletionClient();

        public (IAgentCompletionClient Client, LlmModelTier ResolvedTier) ResolveForAgent(
            AgentType agentType,
            LlmModelTier? taskTierOverride) =>
            (DefaultCompletionClient, LlmModelTier.Economy);
    }

    private sealed class ThrowingAgentCompletionClient : IAgentCompletionClient
    {
        public LlmProviderDescriptor Descriptor => LlmProviderDescriptor.ForOffline("throw", "throw");

        public Task<string> CompleteJsonAsync(
            string systemPrompt,
            string userPrompt,
            int? maxTokens = null,
            float? temperature = null,
            CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException("simulated summarization failure");
    }
}

[Trait("Suite", "Core")]
public sealed class ContextLengthGuardAgentCompletionClientSummarizationTests
{
    [Fact]
    public async Task CompleteJsonAsync_summarizes_before_inner_completion_when_enabled()
    {
        SpyAgentCompletionClient inner = new("{\"ok\":true}");
        Mock<IEvidenceSummarizationService> summarizer = new();
        Mock<IAuditService> audit = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        });

        string oversizedUserPrompt = new('u', 400);
        string summarizedUserPrompt = new('s', 20);

        summarizer
            .Setup(static s => s.SummarizeAsync(
                It.IsAny<string>(),
                It.IsAny<int>(),
                AgentType.Topology,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(summarizedUserPrompt);

        ContextLengthGuardAgentCompletionClient guard = CreateGuard(
            inner,
            summarizer.Object,
            summarizationEnabled: true,
            audit.Object,
            scopeProvider.Object);

        string result = await guard.CompleteJsonAsync("sys", oversizedUserPrompt);

        result.Should().Be("{\"ok\":true}");
        inner.LastUserPrompt.Should().Be(summarizedUserPrompt);
        audit.Verify(
            static a => a.LogAsync(
                It.Is<AuditEvent>(static e => e.EventType == AuditEventTypes.LlmEvidenceSummarized),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CompleteJsonAsync_fail_open_to_truncation_when_summarization_still_exceeds_budget()
    {
        SpyAgentCompletionClient inner = new("{\"ok\":true}");
        Mock<IEvidenceSummarizationService> summarizer = new();
        Mock<IAuditService> audit = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(new ScopeContext());

        string oversizedUserPrompt = new('u', 400);

        summarizer
            .Setup(static s => s.SummarizeAsync(
                It.IsAny<string>(),
                It.IsAny<int>(),
                AgentType.Topology,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(oversizedUserPrompt);

        ContextLengthGuardAgentCompletionClient guard = CreateGuard(
            inner,
            summarizer.Object,
            summarizationEnabled: true,
            audit.Object,
            scopeProvider.Object);

        _ = await guard.CompleteJsonAsync("sys", oversizedUserPrompt);

        inner.LastUserPrompt!.Length.Should().BeLessThan(oversizedUserPrompt.Length);
        audit.Verify(
            static a => a.LogAsync(
                It.Is<AuditEvent>(static e => e.EventType == AuditEventTypes.LlmContextTruncated),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static ContextLengthGuardAgentCompletionClient CreateGuard(
        IAgentCompletionClient inner,
        IEvidenceSummarizationService summarizer,
        bool summarizationEnabled,
        IAuditService audit,
        IScopeContextProvider scopeProvider)
    {
        TestOptionsMonitor<LlmContextWindowOptions> contextOptions = new(new LlmContextWindowOptions
        {
            Enabled = true,
            MaxContextTokens = 100,
            ThresholdRatio = 0.90,
            TruncateUserPromptOnExceeded = true,
        });

        TestOptionsMonitor<EvidenceSummarizationOptions> summarizationOptions = new(
            new EvidenceSummarizationOptions { Enabled = summarizationEnabled });

        return new ContextLengthGuardAgentCompletionClient(
            inner,
            new CharHeuristicTokenCounter(),
            contextOptions,
            summarizationOptions,
            summarizer,
            audit,
            scopeProvider,
            NullLogger<ContextLengthGuardAgentCompletionClient>.Instance);
    }

    private sealed class SpyAgentCompletionClient(string json) : IAgentCompletionClient
    {
        public string? LastUserPrompt
        {
            get;
            private set;
        }

        public LlmProviderDescriptor Descriptor => LlmProviderDescriptor.ForOffline("spy", "spy");

        public Task<string> CompleteJsonAsync(
            string systemPrompt,
            string userPrompt,
            int? maxTokens = null,
            float? temperature = null,
            CancellationToken cancellationToken = default)
        {
            LastUserPrompt = userPrompt;

            return Task.FromResult(json);
        }
    }
}

file sealed class TestOptionsMonitor<T>(T value) : IOptionsMonitor<T>
{
    public T CurrentValue => value;

    public T Get(string? name) => value;

    public IDisposable OnChange(Action<T, string?> listener) => NullDisposable.Instance;

    private sealed class NullDisposable : IDisposable
    {
        internal static readonly NullDisposable Instance = new();

        public void Dispose()
        {
        }
    }
}
