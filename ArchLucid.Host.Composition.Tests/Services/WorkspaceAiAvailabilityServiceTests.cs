using ArchLucid.Application.Budgeting;
using ArchLucid.Contracts.Admin;
using ArchLucid.Contracts.Diagnostics;
using ArchLucid.Core.AiProviders;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Secrets;
using ArchLucid.Host.Composition.Services;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Host.Composition.Tests.Services;

[Trait("Suite", "Core")]
public sealed class WorkspaceAiAvailabilityServiceTests
{
    [Fact]
    public async Task ProbeAsync_simulator_mode_reports_available_without_live_probe()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["AgentExecution:Mode"] = "Simulator",
                })
            .Build();

        WorkspaceAiAvailabilityService sut = BuildSut(
            configuration,
            policy: new TenantAiBudgetPolicySnapshot
            {
                WorkspaceKind = AiUsageWorkspaceKind.Paid,
                CustomerAiProviderConfigured = false,
            });

        WorkspaceAiAvailabilityResponse response = await sut.ProbeAsync(CancellationToken.None);

        response.Validated.Should().BeTrue();
        response.IsAvailable.Should().BeTrue();
        response.AiSource.Should().Be("simulator");
        response.Checks.Should().Contain(row => row.Name == "agent_execution_mode" && row.Status == "ok");
        response.Debug.Should().ContainKey("configuredAgentExecutionMode");
        response.Debug.Should().ContainKey("effectiveAgentExecutionMode");
    }

    [Fact]
    public async Task ProbeAsync_effective_real_without_azure_openai_reports_unavailable()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["AgentExecution:Mode"] = "Simulator",
                })
            .Build();

        WorkspaceAiAvailabilityService sut = BuildSut(
            configuration,
            policy: new TenantAiBudgetPolicySnapshot
            {
                WorkspaceKind = AiUsageWorkspaceKind.Paid,
                CustomerAiProviderConfigured = false,
            },
            effectiveMode: DevAgentExecutionModeHeaderNames.Real);

        WorkspaceAiAvailabilityResponse response = await sut.ProbeAsync(CancellationToken.None);

        response.Validated.Should().BeTrue();
        response.IsAvailable.Should().BeFalse();
        response.AiSource.Should().Be("managed-platform");
        response.Debug["configuredAgentExecutionMode"].Should().Be("Simulator");
        response.Debug["effectiveAgentExecutionMode"].Should().Be("Real");
        response.Checks.Should().Contain(row => row.Name == "azure_openai_configuration" && row.Status == "failed");
    }

    [Fact]
    public async Task ProbeAsync_customer_connection_missing_secret_reports_unavailable_without_persisting()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["AgentExecution:Mode"] = "Real",
                })
            .Build();

        WorkspaceAiAvailabilityService sut = BuildSut(
            configuration,
            policy: new TenantAiBudgetPolicySnapshot
            {
                WorkspaceKind = AiUsageWorkspaceKind.Paid,
                CustomerAiProviderConfigured = true,
            },
            secretProvider: new FakeSecretProvider(secret: null));

        WorkspaceAiAvailabilityResponse response = await sut.ProbeAsync(CancellationToken.None);

        response.Validated.Should().BeTrue();
        response.IsAvailable.Should().BeFalse();
        response.AiSource.Should().Be("customer-connection");
        response.Checks.Should().Contain(row => row.Name == "customer_connection_live_probe" && row.Status == "failed");
    }

    private static WorkspaceAiAvailabilityService BuildSut(
        IConfiguration configuration,
        TenantAiBudgetPolicySnapshot policy,
        FakeSecretProvider? secretProvider = null,
        string effectiveMode = DevAgentExecutionModeHeaderNames.Simulator)
    {
        FakeScopeContextProvider scopeProvider = new();
        FakeAiBudgetPolicyResolver policyResolver = new(policy);
        FakeBudgetStatusService budgetStatusService = new();

        return new WorkspaceAiAvailabilityService(
            configuration,
            scopeProvider,
            policyResolver,
            new FakeConnectionRepository(),
            secretProvider ?? new FakeSecretProvider("test-key"),
            budgetStatusService,
            new FixedEffectiveAgentExecutionModeAccessor(effectiveMode),
            new ServiceCollection().BuildServiceProvider(),
            NullLogger<AgentRuntime.AzureOpenAiCompletionClient>.Instance,
            TimeProvider.System);
    }

    private sealed class FixedEffectiveAgentExecutionModeAccessor(string mode) : IEffectiveAgentExecutionModeAccessor
    {
        public string GetEffectiveMode() => mode;
    }

    private sealed class FakeScopeContextProvider : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope() =>
            new()
            {
                TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            };
    }

    private sealed class FakeAiBudgetPolicyResolver(TenantAiBudgetPolicySnapshot policy) : ITenantAiBudgetPolicyResolver
    {
        public Task<TenantAiBudgetPolicySnapshot> ResolveAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
            Task.FromResult(policy);

        public Task<AiUsageWorkspaceKind> ResolveWorkspaceKindAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
            Task.FromResult(policy.WorkspaceKind);
    }

    private sealed class FakeBudgetStatusService : ILlmMonthlyTenantDollarBudgetStatusService
    {
        public Task<LlmMonthlyTenantDollarBudgetStatusResult> GetStatusAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult(
                new LlmMonthlyTenantDollarBudgetStatusResult
                {
                    MonthlyBudgetMonitoringActive = false,
                    BlocksAdditionalLlmExecution = false,
                    UtcMonth = "2026-08",
                });
    }

    private sealed class FakeSecretProvider(string? secret) : ISecretProvider
    {
        public Task<string?> GetSecretAsync(string secretName, CancellationToken cancellationToken = default) =>
            Task.FromResult(secret);
    }

    private sealed class FakeConnectionRepository : ITenantAzureOpenAiConnectionRepository
    {
        public Task<TenantAzureOpenAiConnectionRecord?> GetAsync(
            Guid tenantId,
            CancellationToken cancellationToken) =>
            Task.FromResult<TenantAzureOpenAiConnectionRecord?>(
                new TenantAzureOpenAiConnectionRecord
                {
                    TenantId = tenantId,
                    Endpoint = "https://example.openai.azure.com/",
                    IsEnabled = true,
                    DeploymentsJson = """{"default":"gpt-4o"}""",
                    ApiKeyKeyVaultSecretName = "secret",
                    AuthMode = TenantAzureOpenAiAuthMode.ApiKey,
                });

        public Task<TenantAzureOpenAiConnectionRecord?> UpsertAsync(
            Guid tenantId,
            TenantAzureOpenAiConnectionUpsertCommand command,
            CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<bool> DeleteAsync(Guid tenantId, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<bool> UpdateProbeResultAsync(
            Guid tenantId,
            bool succeeded,
            string? message,
            CancellationToken cancellationToken) =>
            Task.FromResult(true);
    }
}
