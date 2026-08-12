using ArchLucid.AgentRuntime.Caching;
using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.AgentRuntime.Evaluation.ReferenceCases;
using ArchLucid.AgentRuntime.Safety;
using ArchLucid.AgentRuntime.Tests.Support;
using ArchLucid.Application.Budgeting;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Metering;
using ArchLucid.Core.Safety;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

using Azure.AI.ContentSafety;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentRuntimePackageCoverageBatch16Tests
{
    private const string PassingTopologyJson = """
                                               {"resultId":"r1","taskId":"t1","runId":"run-1","agentType":"Topology","claims":[],"evidenceRefs":[],"confidence":0.5,"findings":[]}
                                               """;

    [Fact]
    public async Task CompleteJsonAsync_when_guard_serves_demo_cache_skips_inner_client()
    {
        Mock<IAgentCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("stub", "stub"));
        inner
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("{\"unexpected\":true}");

        IAiBudgetPreCallGuard guard = new DemoCacheAiBudgetPreCallGuard("{\"cached\":true}");
        LlmCompletionAccountingClient sut = CreateAccountingClient(inner.Object, Guid.NewGuid(), aiBudgetPreCallGuard: guard);

        string result = await sut.CompleteJsonAsync("sys", "user", cancellationToken: CancellationToken.None);

        result.Should().Be("{\"cached\":true}");
        inner.Verify(
            c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CompleteJsonAsync_when_demo_mode_enabled_stores_completion_in_demo_cache()
    {
        Mock<IAgentCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("stub", "stub"));
        inner
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("{\"demo\":true}");

        RecordingDemoAiPromptCache demoCache = new();
        AiUsageControlsOptions aiUsageControls = new() { DemoMode = true };
        LlmCompletionAccountingClient sut = CreateAccountingClient(
            inner.Object,
            Guid.NewGuid(),
            demoPromptCache: demoCache,
            aiUsageControlsOptions: aiUsageControls);

        await sut.CompleteJsonAsync("demo-sys", "demo-user", cancellationToken: CancellationToken.None);

        string expectedKey = DemoAiPromptCacheKeys.Build("demo-sys", "demo-user");
        demoCache.TryGet(expectedKey, out string cachedJson).Should().BeTrue();
        cachedJson.Should().Be("{\"demo\":true}");
    }

    [Fact]
    public async Task StreamJsonAsync_when_token_usage_seeded_records_quota_and_metering()
    {
        Guid tenant = Guid.NewGuid();
        Mock<IAgentCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("stub", "stub"));
        inner
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                AzureOpenAiCompletionClient.SeedLastCompletionTokenUsageForTests(6, 9);

                return Task.FromResult("{\"streamed\":true}");
            });

        Mock<IUsageMeteringService> metering = new();
        metering
            .Setup(m => m.RecordAsync(It.IsAny<UsageEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        LlmCompletionAccountingClient sut = CreateAccountingClient(inner.Object, tenant, usageMetering: metering.Object);

        List<string> chunks = [];

        await foreach (string chunk in sut.StreamJsonAsync("sys", "user", cancellationToken: CancellationToken.None))
        {
            chunks.Add(chunk);
        }

        chunks.Should().NotBeEmpty();
        metering.Verify(
            m => m.RecordAsync(
                It.Is<UsageEvent>(e => e.TenantId == tenant && e.Kind == UsageMeterKind.LlmPromptTokens && e.Quantity == 6),
                It.IsAny<CancellationToken>()),
            Times.Once);
        metering.Verify(
            m => m.RecordAsync(
                It.Is<UsageEvent>(e => e.TenantId == tenant && e.Kind == UsageMeterKind.LlmCompletionTokens && e.Quantity == 9),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public void ComputeAnyPassingReferenceCase_returns_true_for_matching_topology_trace()
    {
        AgentOutputReferenceCaseRunEvaluator sut = CreateReferenceCaseEvaluator(enabled: true);
        AgentExecutionTrace trace = new()
        {
            TraceId = "trace-pass",
            AgentType = AgentType.Topology,
            ParseSucceeded = true,
            ParsedResultJson = PassingTopologyJson,
        };

        bool passing = sut.ComputeAnyPassingReferenceCase(trace);

        passing.Should().BeTrue();
    }

    [Theory]
    [InlineData(false, true, AgentType.Topology, PassingTopologyJson, false)]
    [InlineData(true, false, AgentType.Topology, PassingTopologyJson, false)]
    [InlineData(true, true, AgentType.Critic, PassingTopologyJson, false)]
    public void ComputeAnyPassingReferenceCase_returns_false_for_guard_and_mismatch_cases(
        bool enabled,
        bool parseSucceeded,
        AgentType agentType,
        string parsedJson,
        bool expected)
    {
        AgentOutputReferenceCaseRunEvaluator sut = CreateReferenceCaseEvaluator(enabled: enabled);
        AgentExecutionTrace trace = new()
        {
            TraceId = "trace-guard",
            AgentType = agentType,
            ParseSucceeded = parseSucceeded,
            ParsedResultJson = parsedJson,
        };

        sut.ComputeAnyPassingReferenceCase(trace).Should().Be(expected);
    }

    [Fact]
    public void ComputeAnyPassingReferenceCase_returns_false_when_required_json_key_missing()
    {
        AgentOutputReferenceCaseRunEvaluator sut = CreateReferenceCaseEvaluator(
            enabled: true,
            cases:
            [
                new AgentOutputReferenceCaseDefinition
                {
                    CaseId = "requires-missing-key",
                    AgentType = AgentType.Topology,
                    RequiredJsonKeys = ["missingKey"],
                },
            ]);

        AgentExecutionTrace trace = new()
        {
            TraceId = "trace-keys",
            AgentType = AgentType.Topology,
            ParseSucceeded = true,
            ParsedResultJson = PassingTopologyJson,
        };

        sut.ComputeAnyPassingReferenceCase(trace).Should().BeFalse();
    }

    [Fact]
    public async Task CachingLlmCompletionClient_partition_by_scope_with_empty_tenant_throws()
    {
        CountingCompletionClient inner = new();
        MutableOptionsMonitor<LlmCompletionCacheOptions> opts =
            new(new LlmCompletionCacheOptions
            {
                Enabled = true,
                PartitionByScope = true,
                TTLSeconds = 3600,
                MaxEntries = 32,
            });

        MutableOptionsMonitor<LlmTelemetryLabelOptions> telemetry =
            new(new LlmTelemetryLabelOptions { ProviderId = "unit", ModelDeploymentLabel = "m1" });

        MemoryCache memCache = new(new MemoryCacheOptions { SizeLimit = 32 });
        using MemorySemanticCache semanticCache = new(memCache, opts);
        ILlmCompletionResponseCache cacheBackend = new LlmCompletionResponseCache(semanticCache);

        CachingLlmCompletionClient sut = new(
            inner,
            cacheBackend,
            simulatorMode: false,
            new FixedScopeProvider(new ScopeContext { TenantId = Guid.Empty }),
            opts,
            telemetry,
            NullLogger<CachingLlmCompletionClient>.Instance);

        Func<Task> act = async () => await sut.CompleteJsonAsync("sys", "user", cancellationToken: CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*PartitionByScope is enabled*");
    }

    [Fact]
    public async Task CachingLlmCompletionClient_simulator_mode_allows_empty_tenant_scope()
    {
        CountingCompletionClient inner = new();
        MutableOptionsMonitor<LlmCompletionCacheOptions> opts =
            new(new LlmCompletionCacheOptions
            {
                Enabled = true,
                PartitionByScope = true,
                TTLSeconds = 3600,
                MaxEntries = 32,
            });

        MutableOptionsMonitor<LlmTelemetryLabelOptions> telemetry =
            new(new LlmTelemetryLabelOptions { ProviderId = "sim", ModelDeploymentLabel = "m1" });

        MemoryCache memCache = new(new MemoryCacheOptions { SizeLimit = 32 });
        using MemorySemanticCache semanticCache = new(memCache, opts);
        ILlmCompletionResponseCache cacheBackend = new LlmCompletionResponseCache(semanticCache);

        CachingLlmCompletionClient sut = new(
            inner,
            cacheBackend,
            simulatorMode: true,
            new FixedScopeProvider(new ScopeContext { TenantId = Guid.Empty }),
            opts,
            telemetry,
            NullLogger<CachingLlmCompletionClient>.Instance);

        await sut.CompleteJsonAsync("sys", "user", cancellationToken: CancellationToken.None);
        await sut.CompleteJsonAsync("sys", "user", cancellationToken: CancellationToken.None);

        inner.CallCount.Should().Be(1);
    }

    [Theory]
    [InlineData("prompt-a", "prompt-b", 2)]
    [InlineData("same", "same", 1)]
    public async Task CachingLlmCompletionClient_miss_then_hit_varies_by_prompt_hash(
        string firstUserPrompt,
        string secondUserPrompt,
        int expectedInnerCalls)
    {
        CountingCompletionClient inner = new();
        MutableOptionsMonitor<LlmCompletionCacheOptions> opts =
            new(new LlmCompletionCacheOptions { Enabled = true, TTLSeconds = 3600, MaxEntries = 32 });

        MutableOptionsMonitor<LlmTelemetryLabelOptions> telemetry =
            new(new LlmTelemetryLabelOptions { ProviderId = "unit", ModelDeploymentLabel = "m1" });

        MemoryCache memCache = new(new MemoryCacheOptions { SizeLimit = 32 });
        using MemorySemanticCache semanticCache = new(memCache, opts);
        ILlmCompletionResponseCache cacheBackend = new LlmCompletionResponseCache(semanticCache);

        CachingLlmCompletionClient sut = new(
            inner,
            cacheBackend,
            simulatorMode: false,
            new FixedScopeProvider(
                new ScopeContext
                {
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                    ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                }),
            opts,
            telemetry,
            NullLogger<CachingLlmCompletionClient>.Instance);

        await sut.CompleteJsonAsync("sys", firstUserPrompt, cancellationToken: CancellationToken.None);
        await sut.CompleteJsonAsync("sys", secondUserPrompt, cancellationToken: CancellationToken.None);

        inner.CallCount.Should().Be(expectedInnerCalls);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task MemorySemanticCache_rejects_blank_prompt_hash_on_get_and_set(string blankHash)
    {
        MutableOptionsMonitor<LlmCompletionCacheOptions> optionsMonitor =
            new(new LlmCompletionCacheOptions { TTLSeconds = 60, MaxEntries = 16 });

        MemoryCache backing = new(new MemoryCacheOptions { SizeLimit = 16 });
        using MemorySemanticCache sut = new(backing, optionsMonitor);

        Func<Task> getAct = async () => await sut.GetCachedResponseAsync(blankHash, CancellationToken.None);
        Func<Task> setAct = async () => await sut.SetCachedResponseAsync(blankHash, "body", CancellationToken.None);

        await getAct.Should().ThrowAsync<ArgumentException>();
        await setAct.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task MemorySemanticCache_get_ignores_empty_cached_string_values()
    {
        MutableOptionsMonitor<LlmCompletionCacheOptions> optionsMonitor =
            new(new LlmCompletionCacheOptions { TTLSeconds = 60, MaxEntries = 16 });

        MemoryCache backing = new(new MemoryCacheOptions { SizeLimit = 16 });
        backing.Set("al:semantic:v1:empty-value", string.Empty, new MemoryCacheEntryOptions { Size = 1 });
        using MemorySemanticCache sut = new(backing, optionsMonitor);

        string? hit = await sut.GetCachedResponseAsync("empty-value", CancellationToken.None);

        hit.Should().BeNull();
    }

    [Fact]
    public void AzureContentSafetyGuard_map_result_skips_null_severity_rows()
    {
        AnalyzeTextResult result = ContentSafetyModelFactory.AnalyzeTextResult(
            [],
            [ContentSafetyModelFactory.TextCategoriesAnalysis(TextCategory.Hate, null)]);

        ContentSafetyResult mapped = AzureContentSafetyGuard.MapResult(result, blockSeverityThreshold: 2);

        mapped.IsAllowed.Should().BeTrue();
    }

    [Fact]
    public void AzureContentSafetyGuard_map_result_blocks_on_first_category_meeting_threshold()
    {
        AnalyzeTextResult result = ContentSafetyModelFactory.AnalyzeTextResult(
            [],
            [
                ContentSafetyModelFactory.TextCategoriesAnalysis(TextCategory.Hate, 2),
                ContentSafetyModelFactory.TextCategoriesAnalysis(TextCategory.Violence, 6),
            ]);

        ContentSafetyResult mapped = AzureContentSafetyGuard.MapResult(result, blockSeverityThreshold: 4);

        mapped.IsAllowed.Should().BeFalse();
        mapped.Category.Should().Be(TextCategory.Violence.ToString());
        mapped.Severity.Should().Be(6);
    }

    [Fact]
    public void AzureContentSafetyGuard_handle_sdk_failure_rejects_null_exception()
    {
        Action act = () => AzureContentSafetyGuard.HandleSdkFailure(null!, failClosedOnSdkError: true);

        act.Should().Throw<ArgumentNullException>();
    }

    private static AgentOutputReferenceCaseRunEvaluator CreateReferenceCaseEvaluator(
        bool enabled,
        IReadOnlyList<AgentOutputReferenceCaseDefinition>? cases = null)
    {
        Mock<IOptionsMonitor<AgentExecutionReferenceEvaluationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new AgentExecutionReferenceEvaluationOptions { Enabled = enabled });

        IReadOnlyList<AgentOutputReferenceCaseDefinition> caseList = cases ??
        [
            new AgentOutputReferenceCaseDefinition { CaseId = "topology-default", AgentType = AgentType.Topology },
        ];

        FixedReferenceCaseCatalog catalog = new(caseList);
        HeuristicAgentOutputSemanticEvaluator heuristicSemantic = new();
        HeuristicOnlyAgentOutputSemanticEvaluator facade = new(heuristicSemantic);

        return new AgentOutputReferenceCaseRunEvaluator(
            options.Object,
            catalog,
            new AgentOutputEvaluator(),
            heuristicSemantic,
            facade,
            Mock.Of<IAgentOutputEvaluationResultRepository>(),
            NullLogger<AgentOutputReferenceCaseRunEvaluator>.Instance);
    }

    private static LlmCompletionAccountingClient CreateAccountingClient(
        IAgentCompletionClient inner,
        Guid tenantId,
        IUsageMeteringService? usageMetering = null,
        IAiBudgetPreCallGuard? aiBudgetPreCallGuard = null,
        IDemoAiPromptCache? demoPromptCache = null,
        AiUsageControlsOptions? aiUsageControlsOptions = null)
    {
        LlmTokenQuotaOptions quotaOpts = new() { Enabled = false };
        LlmTokenQuotaWindowTracker quotaTracker =
            new(new FixedValueOptionsMonitor<LlmTokenQuotaOptions>(quotaOpts));

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(p => p.GetCurrentScope()).Returns(
            new ScopeContext { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        Mock<IUsageMeteringService> metering = usageMetering is not null
            ? Mock.Get(usageMetering)
            : new Mock<IUsageMeteringService>();

        metering.Setup(m => m.RecordAsync(It.IsAny<UsageEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<ILlmCostEstimator> costEstimator = new();
        costEstimator.Setup(e => e.EstimateUsd(It.IsAny<int>(), It.IsAny<int>())).Returns(0m);

        LlmDailyTenantTokenWindowOptions dailyOpts = new() { Enabled = false };
        LlmDailyTenantBudgetTracker dailyTracker = new(
            new FixedValueOptionsMonitor<LlmDailyTenantTokenWindowOptions>(dailyOpts),
            new InMemoryLlmTenantBudgetRepository());

        LlmMonthlyTenantDollarBudgetOptions monthlyOpts = new() { Enabled = false };

        // The reservation store reads and writes the same ledger the tracker does, so both must
        // share one repository instance rather than each holding a private in-memory copy.
        InMemoryLlmTenantBudgetRepository monthlyBudgetRepository = new();

        LlmMonthlyTenantDollarBudgetTracker monthlyTracker = new(
            new FixedValueOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>(monthlyOpts),
            costEstimator.Object,
            monthlyBudgetRepository,
            new InMemoryLlmMonthlyTenantBudgetReservationStore(monthlyBudgetRepository, TimeProvider.System),
            new NoOpLlmTenantWalletService(),
            new PassthroughTenantLlmMonthlyBudgetCapResolver(),
            new ConfigurationBuilder().Build(),
            CreateNonProductionHostEnvironment(),
            TimeProvider.System);

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        return new LlmCompletionAccountingClient(
            inner,
            quotaTracker,
            scope.Object,
            new FixedValueOptionsMonitor<LlmTokenQuotaOptions>(quotaOpts),
            new FixedValueOptionsMonitor<LlmTelemetryOptions>(new LlmTelemetryOptions()),
            new FixedValueOptionsMonitor<LlmTelemetryLabelOptions>(new LlmTelemetryLabelOptions()),
            new FixedValueOptionsMonitor<LlmPromptRedactionOptions>(new LlmPromptRedactionOptions { Enabled = false }),
            new NoOpPromptRedactor(),
            metering.Object,
            new FixedValueOptionsMonitor<LlmDailyTenantTokenWindowOptions>(dailyOpts),
            dailyTracker,
            new FixedValueOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>(monthlyOpts),
            monthlyTracker,
            costEstimator.Object,
            aiBudgetPreCallGuard ?? new NoOpAiBudgetPreCallGuard(),
            demoPromptCache ?? new NoOpDemoAiPromptCache(),
            new FixedValueOptionsMonitor<AiUsageControlsOptions>(aiUsageControlsOptions ?? new AiUsageControlsOptions()),
            audit.Object,
            NullLogger<LlmCompletionAccountingClient>.Instance);
    }

    private static IHostEnvironment CreateNonProductionHostEnvironment() => new NonProductionTestHostEnvironment();

    private sealed class DemoCacheAiBudgetPreCallGuard(string cachedJson) : IAiBudgetPreCallGuard
    {
        public Task<AiBudgetPreCallGuardResult> EnsureAllowedAsync(
            Guid tenantId,
            AiUsageFeature feature,
            string providerKind,
            string? systemPrompt,
            string? userPrompt,
            string? correlationId,
            string? actorUserId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new AiBudgetPreCallGuardResult
            {
                ServedFromDemoCache = true,
                CachedResponseJson = cachedJson,
            });

        public Task RecordCompletionAsync(
            Guid tenantId,
            AiUsageFeature feature,
            string providerKind,
            int inputTokens,
            int outputTokens,
            decimal? estimatedCostUsd,
            string? correlationId,
            string? actorUserId,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }

    private sealed class RecordingDemoAiPromptCache : IDemoAiPromptCache
    {
        private readonly Dictionary<string, string> _entries = new(StringComparer.Ordinal);

        public bool TryGet(string cacheKey, out string responseJson)
        {
            return _entries.TryGetValue(cacheKey, out responseJson!);
        }

        public void Set(string cacheKey, string responseJson)
        {
            _entries[cacheKey] = responseJson;
        }
    }

    private sealed class FixedReferenceCaseCatalog(IReadOnlyList<AgentOutputReferenceCaseDefinition> cases)
        : IAgentOutputReferenceCaseCatalog
    {
        public IReadOnlyList<AgentOutputReferenceCaseDefinition> Cases { get; } = cases;
    }

    private sealed class CountingCompletionClient : IAgentCompletionClient
    {
        public int CallCount
        {
            get;
            private set;
        }

        public LlmProviderDescriptor Descriptor => LlmProviderDescriptor.ForOffline("test", "counting");

        public Task<string> CompleteJsonAsync(
            string systemPrompt,
            string userPrompt,
            int? maxTokens = null,
            float? temperature = null,
            CancellationToken cancellationToken = default)
        {
            CallCount++;

            return Task.FromResult("{\"n\":" + CallCount + "}");
        }
    }

    private sealed class FixedScopeProvider(ScopeContext scope) : IScopeContextProvider
    {
        private readonly ScopeContext _scope = scope ?? throw new ArgumentNullException(nameof(scope));

        public ScopeContext GetCurrentScope()
        {
            return _scope;
        }
    }

    private sealed class MutableOptionsMonitor<T>(T initialValue) : IOptionsMonitor<T>
        where T : class
    {
        public T CurrentValue { get; } = initialValue ?? throw new ArgumentNullException(nameof(initialValue));

        public IDisposable OnChange(Action<T, string?> listener)
        {
            throw new NotSupportedException();
        }

        public T Get(string? name)
        {
            return CurrentValue;
        }
    }
}
