using ArchLucid.Application.AiProviders;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Diagnostics;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Composition.Services;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Host.Composition.Tests.Services;

[Trait("Suite", "Core")]
public sealed class AgentExecutionReadinessGuardTests
{
    [Fact]
    public async Task EnsureReadyForExecuteAsync_allows_simulator_mode()
    {
        AgentExecutionReadinessGuard sut = BuildSut(
            DevAgentExecutionModeHeaderNames.Simulator,
            new Dictionary<string, string?> { ["AgentExecution:Mode"] = "Simulator" });

        Func<Task> act = async () => await sut.EnsureReadyForExecuteAsync(CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task EnsureReadyForExecuteAsync_blocks_real_mode_without_azure_openai()
    {
        AgentExecutionReadinessGuard sut = BuildSut(
            DevAgentExecutionModeHeaderNames.Real,
            new Dictionary<string, string?> { ["AgentExecution:Mode"] = "Simulator" });

        Func<Task> act = async () => await sut.EnsureReadyForExecuteAsync(CancellationToken.None);

        InvalidOperationException exception = (await act.Should().ThrowAsync<InvalidOperationException>()).Which;
        exception.Message.Should().Be(AgentExecutionReadinessMessages.LiveCompletionUnavailable);
    }

    private static AgentExecutionReadinessGuard BuildSut(
        string effectiveMode,
        Dictionary<string, string?> settings)
    {
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();

        return new AgentExecutionReadinessGuard(
            new FixedEffectiveAgentExecutionModeAccessor(effectiveMode),
            configuration,
            new FakeScopeContextProvider(),
            new FakeAiBudgetPolicyResolver(
                new TenantAiBudgetPolicySnapshot
                {
                    WorkspaceKind = AiUsageWorkspaceKind.Paid,
                    CustomerAiProviderConfigured = false,
                }));
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
}
