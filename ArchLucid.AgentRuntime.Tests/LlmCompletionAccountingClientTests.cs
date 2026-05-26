using System.Collections.Immutable;

using ArchLucid.AgentRuntime.Tests.Support;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Metering;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using ArchLucid.AgentRuntime.Tests.Support;

namespace ArchLucid.AgentRuntime.Tests;

/// <summary>
///     Unit tests for <see cref="LlmCompletionAccountingClient" /> — quota/redaction wrapping and token metering (circuit
///     breaking and HTTP retries live on outer decorators such as <c>CircuitBreakingAgentCompletionClient</c>).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class LlmCompletionAccountingClientTests
{
    [Fact]
    public async Task CompleteJsonAsync_when_quota_exceeded_before_inner_does_not_invoke_inner()
    {
        Guid tenant = Guid.NewGuid();
        LlmTokenQuotaOptions quotaOpts = new()
        {
            Enabled = true,
            WindowMinutes = 60,
            MaxPromptTokensPerTenantPerWindow = 50,
            AssumedMaxPromptTokensPerRequest = 10
        };

        LlmTokenQuotaWindowTracker quotaTracker = new(new FixedValueOptionsMonitor<LlmTokenQuotaOptions>(quotaOpts));
        quotaTracker.RecordUsage(tenant, 45, 0);

        Mock<IAgentCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("stub", "stub"));
        inner.Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("{}");

        LlmCompletionAccountingClient sut = CreateClient(inner.Object, tenant, quotaTracker, clientQuotaOptions: quotaOpts);

        Func<Task> act = async () =>
            await sut.CompleteJsonAsync("sys", "user", cancellationToken: CancellationToken.None);

        await act.Should().ThrowAsync<LlmTokenQuotaExceededException>();
        inner.Verify(
            c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CompleteJsonAsync_when_redaction_disabled_invokes_inner_with_original_prompts()
    {
        Mock<IAgentCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("stub", "stub"));
        inner.Setup(c => c.CompleteJsonAsync("sys-in", "user-in", It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>())).ReturnsAsync("{}");

        LlmPromptRedactionOptions redactionOpts = new() { Enabled = false };
        Mock<IPromptRedactor> redactor = new();
        LlmCompletionAccountingClient sut = CreateClient(
            inner.Object,
            Guid.NewGuid(),
            redactionOptions: redactionOpts,
            promptRedactor: redactor.Object);

        string result = await sut.CompleteJsonAsync("sys-in", "user-in", cancellationToken: CancellationToken.None);

        result.Should().Be("{}");
        redactor.Verify(r => r.Redact(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task CompleteJsonAsync_when_redaction_enabled_passes_redacted_text_to_inner()
    {
        Mock<IAgentCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("stub", "stub"));
        inner.Setup(c => c.CompleteJsonAsync("SYS-R", "USR-R", It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>())).ReturnsAsync("{}");

        IPromptRedactor redactor = new RecordingPromptRedactor(("sys-in", "SYS-R"), ("user-in", "USR-R"));
        LlmPromptRedactionOptions redactionOpts = new() { Enabled = true };
        LlmCompletionAccountingClient sut = CreateClient(
            inner.Object,
            Guid.NewGuid(),
            redactionOptions: redactionOpts,
            promptRedactor: redactor);

        await sut.CompleteJsonAsync("sys-in", "user-in", cancellationToken: CancellationToken.None);

        inner.Verify(c => c.CompleteJsonAsync("SYS-R", "USR-R", It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CompleteJsonAsync_when_token_usage_is_seeded_records_usage_metering_events()
    {
        Guid tenant = Guid.NewGuid();
        Mock<IAgentCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("stub", "stub"));
        inner
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                AzureOpenAiCompletionClient.SeedLastCompletionTokenUsageForTests(7, 13);

                return Task.FromResult("{}");
            });

        Mock<IUsageMeteringService> metering = new();
        metering
            .Setup(m => m.RecordAsync(It.IsAny<UsageEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        LlmCompletionAccountingClient sut = CreateClient(inner.Object, tenant, usageMetering: metering.Object);

        await sut.CompleteJsonAsync("s", "u", cancellationToken: CancellationToken.None);

        metering.Verify(
            m => m.RecordAsync(
                It.Is<UsageEvent>(e => e.TenantId == tenant && e.Kind == UsageMeterKind.LlmPromptTokens && e.Quantity == 7),
                It.IsAny<CancellationToken>()),
            Times.Once);
        metering.Verify(
            m => m.RecordAsync(
                It.Is<UsageEvent>(
                    e => e.TenantId == tenant && e.Kind == UsageMeterKind.LlmCompletionTokens && e.Quantity == 13),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CompleteJsonAsync_when_token_usage_not_seeded_skips_usage_metering()
    {
        Guid tenant = Guid.NewGuid();
        Mock<IAgentCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("stub", "stub"));
        inner.Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("{}");

        Mock<IUsageMeteringService> metering = new();
        LlmCompletionAccountingClient sut = CreateClient(inner.Object, tenant, usageMetering: metering.Object);

        await sut.CompleteJsonAsync("s", "u", cancellationToken: CancellationToken.None);

        metering.Verify(
            m => m.RecordAsync(It.IsAny<UsageEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CompleteJsonAsync_when_tenant_is_empty_skips_usage_metering_even_with_seeded_tokens()
    {
        Mock<IAgentCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("stub", "stub"));
        inner
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                AzureOpenAiCompletionClient.SeedLastCompletionTokenUsageForTests(5, 5);

                return Task.FromResult("{}");
            });

        Mock<IUsageMeteringService> metering = new();
        LlmCompletionAccountingClient sut = CreateClient(inner.Object, Guid.Empty, usageMetering: metering.Object);

        await sut.CompleteJsonAsync("s", "u", cancellationToken: CancellationToken.None);

        metering.Verify(
            m => m.RecordAsync(It.IsAny<UsageEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static LlmCompletionAccountingClient CreateClient(
        IAgentCompletionClient inner,
        Guid tenantId,
        LlmTokenQuotaWindowTracker? quotaTracker = null,
        LlmTokenQuotaOptions? clientQuotaOptions = null,
        LlmPromptRedactionOptions? redactionOptions = null,
        IPromptRedactor? promptRedactor = null,
        IUsageMeteringService? usageMetering = null,
        LlmDailyTenantTokenWindowOptions? dailyBudgetOptions = null,
        ILlmTenantBudgetRepository? dailyBudgetRepository = null,
        LlmMonthlyTenantDollarBudgetOptions? monthlyBudgetOptions = null,
        ILlmTenantBudgetRepository? monthlyBudgetRepository = null)
    {
        LlmTokenQuotaOptions quotaOptsBinding =
            clientQuotaOptions ?? new LlmTokenQuotaOptions { Enabled = false };

        LlmTokenQuotaWindowTracker tracker = quotaTracker ?? new LlmTokenQuotaWindowTracker(
            new FixedValueOptionsMonitor<LlmTokenQuotaOptions>(quotaOptsBinding));

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(p => p.GetCurrentScope()).Returns(
            new ScopeContext { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        LlmPromptRedactionOptions redaction = redactionOptions ?? new LlmPromptRedactionOptions { Enabled = false };
        IPromptRedactor redactor = promptRedactor ?? new NoOpPromptRedactor();

        Mock<IUsageMeteringService> metering = usageMetering is not null
            ? Mock.Get(usageMetering)
            : new Mock<IUsageMeteringService>();

        metering.Setup(m => m.RecordAsync(It.IsAny<UsageEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<ILlmCostEstimator> costEstimator = new();
        costEstimator.Setup(e => e.EstimateUsd(It.IsAny<int>(), It.IsAny<int>())).Returns(0m);

        LlmDailyTenantTokenWindowOptions dailyOptsBinding =
            dailyBudgetOptions ?? new LlmDailyTenantTokenWindowOptions { Enabled = false };
        ILlmTenantBudgetRepository dailyRepoBinding =
            dailyBudgetRepository ?? new InMemoryLlmTenantBudgetRepository();
        LlmDailyTenantBudgetTracker dailyTracker = new(
            new FixedValueOptionsMonitor<LlmDailyTenantTokenWindowOptions>(dailyOptsBinding),
            dailyRepoBinding);

        LlmMonthlyTenantDollarBudgetOptions monthlyOptsBinding =
            monthlyBudgetOptions ?? new LlmMonthlyTenantDollarBudgetOptions { Enabled = false };
        ILlmTenantBudgetRepository monthlyRepoBinding =
            monthlyBudgetRepository ?? new InMemoryLlmTenantBudgetRepository();
        LlmMonthlyTenantDollarBudgetTracker monthlyTracker = new(
            new FixedValueOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>(monthlyOptsBinding),
            costEstimator.Object,
            monthlyRepoBinding,
            new NoOpLlmTenantWalletService(),
            new ConfigurationBuilder().Build(),
            CreateNonProductionHostEnvironment(),
            TimeProvider.System);

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        return new LlmCompletionAccountingClient(
            inner,
            tracker,
            scope.Object,
            new FixedValueOptionsMonitor<LlmTokenQuotaOptions>(quotaOptsBinding),
            new FixedValueOptionsMonitor<LlmTelemetryOptions>(new LlmTelemetryOptions()),
            new FixedValueOptionsMonitor<LlmTelemetryLabelOptions>(new LlmTelemetryLabelOptions()),
            new FixedValueOptionsMonitor<LlmPromptRedactionOptions>(redaction),
            redactor,
            metering.Object,
            new FixedValueOptionsMonitor<LlmDailyTenantTokenWindowOptions>(dailyOptsBinding),
            dailyTracker,
            new FixedValueOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>(monthlyOptsBinding),
            monthlyTracker,
            costEstimator.Object,
            audit.Object,
            NullLogger<LlmCompletionAccountingClient>.Instance);
    }

    /// <summary>Maps inputs to fixed redacted outputs for deterministic assertions.</summary>
    private sealed class RecordingPromptRedactor(params (string In, string Out)[] map) : IPromptRedactor
    {
        private readonly Dictionary<string, string> _map = map.ToDictionary(x => x.In, x => x.Out, StringComparer.Ordinal);

        public PromptRedactionOutcome Redact(string? input)
        {
            string key = input ?? string.Empty;

            if (!_map.TryGetValue(key, out string? text))
                throw new InvalidOperationException($"Unexpected redaction input: {key}");

            return new PromptRedactionOutcome(text, ImmutableDictionary<string, int>.Empty);
        }

        public PromptRedactionOutcome RedactAlways(string? input) => Redact(input);
    }

    private static IHostEnvironment CreateNonProductionHostEnvironment() => new NonProductionTestHostEnvironment();
}
