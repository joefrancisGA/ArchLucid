using ArchLucid.Application.AiUsage;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.AiUsage;

[Trait("Category", "Unit")]
public sealed class AiBudgetPreCallGuardTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    [SkippableFact]
    public async Task EnsureAllowedAsync_PublicDemoBlocksExpensiveFeature()
    {
        AiBudgetPreCallGuard sut = CreateSut(
            workspaceKind: AiUsageWorkspaceKind.PublicDemo,
            blocks: false,
            demoMode: true,
            featureCap: 0m);

        Func<Task> act = () => sut.EnsureAllowedAsync(
            TenantId,
            AiUsageFeature.ArchitectureGeneration,
            "azure-openai",
            "system",
            "user",
            null,
            null,
            CancellationToken.None);

        await act.Should().ThrowAsync<LlmTokenQuotaExceededException>();
    }

    [SkippableFact]
    public async Task EnsureAllowedAsync_TrialWithinBudget_AllowsCall()
    {
        AiBudgetPreCallGuard sut = CreateSut(
            workspaceKind: AiUsageWorkspaceKind.Trial,
            blocks: false,
            remainingUsd: 5m);

        AiBudgetPreCallGuardResult result = await sut.EnsureAllowedAsync(
            TenantId,
            AiUsageFeature.ReviewAnalysis,
            "azure-openai",
            "system",
            "user",
            null,
            null,
            CancellationToken.None);

        result.ServedFromDemoCache.Should().BeFalse();
    }

    [SkippableFact]
    public async Task EnsureAllowedAsync_TrialOverBudget_ThrowsTrialMessage()
    {
        AiBudgetPreCallGuard sut = CreateSut(
            workspaceKind: AiUsageWorkspaceKind.Trial,
            blocks: true);

        Func<Task> act = () => sut.EnsureAllowedAsync(
            TenantId,
            AiUsageFeature.EvidenceQa,
            "azure-openai",
            "system",
            "user",
            null,
            null,
            CancellationToken.None);

        LlmTokenQuotaExceededException ex = (await act.Should().ThrowAsync<LlmTokenQuotaExceededException>()).Which;
        ex.Message.Should().Contain("Trial AI budget exhausted");
    }

    [SkippableFact]
    public async Task EnsureAllowedAsync_PaidTenantWithinBudget_AllowsCall()
    {
        AiBudgetPreCallGuard sut = CreateSut(
            workspaceKind: AiUsageWorkspaceKind.Paid,
            blocks: false,
            remainingUsd: 25m);

        AiBudgetPreCallGuardResult result = await sut.EnsureAllowedAsync(
            TenantId,
            AiUsageFeature.ReportGeneration,
            "azure-openai",
            "system",
            "user",
            null,
            null,
            CancellationToken.None);

        result.ServedFromDemoCache.Should().BeFalse();
    }

    [SkippableFact]
    public async Task EnsureAllowedAsync_CustomerOwnedProvider_BypassesBudgetChecks()
    {
        AiBudgetPreCallGuard sut = CreateSut(
            workspaceKind: AiUsageWorkspaceKind.Trial,
            blocks: true,
            customerProvider: true);

        AiBudgetPreCallGuardResult result = await sut.EnsureAllowedAsync(
            TenantId,
            AiUsageFeature.ArchitectureGeneration,
            "customer-openai",
            "system",
            "user",
            null,
            null,
            CancellationToken.None);

        result.ServedFromDemoCache.Should().BeFalse();
    }

    [SkippableFact]
    public async Task EnsureAllowedAsync_DemoCacheHit_DoesNotConsumeBudget()
    {
        InMemoryDemoCache cache = new();
        cache.Set(DemoAiPromptCacheKeys.Build("system", "user"), "{\"ok\":true}");

        AiBudgetPreCallGuard sut = CreateSut(
            workspaceKind: AiUsageWorkspaceKind.PublicDemo,
            blocks: false,
            demoMode: true,
            featureCap: 1m,
            demoCache: cache);

        AiBudgetPreCallGuardResult result = await sut.EnsureAllowedAsync(
            TenantId,
            AiUsageFeature.EvidenceQa,
            "azure-openai",
            "system",
            "user",
            null,
            null,
            CancellationToken.None);

        result.ServedFromDemoCache.Should().BeTrue();
        result.CachedResponseJson.Should().Be("{\"ok\":true}");
    }

    [SkippableFact]
    public async Task EnsureAllowedAsync_BlockedRequest_LogsBudgetEvent()
    {
        InMemoryAiUsageEventRepository events = new();

        AiBudgetPreCallGuard sut = CreateSut(
            workspaceKind: AiUsageWorkspaceKind.Trial,
            blocks: true,
            usageEvents: events);

        await Assert.ThrowsAsync<LlmTokenQuotaExceededException>(() =>
            sut.EnsureAllowedAsync(
                TenantId,
                AiUsageFeature.Comparison,
                "azure-openai",
                "system",
                "user",
                "corr-1",
                "user-1",
                CancellationToken.None));

        IReadOnlyList<AiUsageEventRecord> rows =
            await events.ListRecentForTenantAsync(TenantId, 10, CancellationToken.None);

        rows.Should().ContainSingle(e => e.BudgetBlocked && e.Feature == AiUsageFeature.Comparison);
    }

    [SkippableFact]
    public async Task RecordCompletionAsync_LogsUsageEventWithTokens()
    {
        InMemoryAiUsageEventRepository events = new();

        AiBudgetPreCallGuard sut = CreateSut(
            workspaceKind: AiUsageWorkspaceKind.Trial,
            blocks: false,
            usageEvents: events);

        await sut.RecordCompletionAsync(
            TenantId,
            AiUsageFeature.ReviewAnalysis,
            "azure-openai",
            120,
            80,
            0.42m,
            "corr-2",
            "user-2",
            CancellationToken.None);

        IReadOnlyList<AiUsageEventRecord> rows =
            await events.ListRecentForTenantAsync(TenantId, 10, CancellationToken.None);

        rows.Should().ContainSingle(e =>
            e.InputTokens == 120 &&
            e.OutputTokens == 80 &&
            e.EstimatedCostUsd == 0.42m &&
            e.Feature == AiUsageFeature.ReviewAnalysis);
    }

    private static AiBudgetPreCallGuard CreateSut(
        AiUsageWorkspaceKind workspaceKind,
        bool blocks,
        bool demoMode = false,
        decimal featureCap = 1m,
        decimal remainingUsd = 10m,
        bool customerProvider = false,
        IDemoAiPromptCache? demoCache = null,
        InMemoryAiUsageEventRepository? usageEvents = null)
    {
        Mock<ITenantAiBudgetPolicyResolver> policyResolver = new();
        policyResolver
            .Setup(p => p.ResolveAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantAiBudgetPolicySnapshot
                {
                    WorkspaceKind = workspaceKind,
                    BudgetAmountUsd = 10m,
                    UsedAmountUsd = 10m - remainingUsd,
                    RemainingAmountUsd = remainingUsd,
                    HardStopEnabled = true,
                    BlocksAdditionalLlmExecution = blocks,
                    CustomerAiProviderConfigured = customerProvider,
                });

        AiUsageControlsOptions controls = new()
        {
            DemoMode = demoMode,
            PublicDemoFeatureDailyLimitUsd = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
            {
                [AiUsageFeature.ArchitectureGeneration.ToString()] = featureCap,
                [AiUsageFeature.EvidenceQa.ToString()] = featureCap,
            },
        };

        Mock<IOptionsMonitor<AiUsageControlsOptions>> optionsMonitor = new();
        optionsMonitor.Setup(o => o.CurrentValue).Returns(controls);

        return new AiBudgetPreCallGuard(
            policyResolver.Object,
            demoCache ?? new InMemoryDemoCache(),
            usageEvents ?? new InMemoryAiUsageEventRepository(),
            optionsMonitor.Object,
            TimeProvider.System);
    }

    private sealed class InMemoryDemoCache : IDemoAiPromptCache
    {
        private readonly Dictionary<string, string> _entries = new(StringComparer.Ordinal);

        public bool TryGet(string cacheKey, out string responseJson) => _entries.TryGetValue(cacheKey, out responseJson!);

        public void Set(string cacheKey, string responseJson) => _entries[cacheKey] = responseJson;
    }

    private sealed class InMemoryAiUsageEventRepository : IAiUsageEventRepository
    {
        private readonly List<AiUsageEventRecord> _events = [];

        public Task InsertAsync(AiUsageEventRecord record, CancellationToken cancellationToken = default)
        {
            _events.Add(record);

            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<AiUsageEventRecord>> ListRecentForTenantAsync(
            Guid tenantId,
            int limit,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<AiUsageEventRecord>>(
                _events.Where(e => e.TenantId == tenantId).OrderByDescending(e => e.OccurredUtc).Take(limit).ToList());

        public Task<IReadOnlyDictionary<AiUsageFeature, decimal>> SumEstimatedCostByFeatureAsync(
            Guid tenantId,
            DateTimeOffset fromUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyDictionary<AiUsageFeature, decimal>>(
                _events
                    .Where(e => e.TenantId == tenantId && e.OccurredUtc >= fromUtc)
                    .GroupBy(e => e.Feature)
                    .ToDictionary(g => g.Key, g => g.Sum(x => x.EstimatedCostUsd)));
    }
}
