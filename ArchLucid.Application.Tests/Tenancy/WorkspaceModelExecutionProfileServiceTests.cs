using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Suite", "Core")]
public sealed class WorkspaceModelExecutionProfileServiceTests
{
    [Fact]
    public async Task GetAsync_returns_balanced_workspace_default_when_no_override()
    {
        WorkspaceModelExecutionProfileService sut = CreateService(Guid.NewGuid());

        WorkspaceModelExecutionProfileSnapshot snapshot =
            await sut.GetAsync(CancellationToken.None);

        snapshot.EffectiveProfile.Should().Be(AgentModelExecutionProfile.Balanced);
        snapshot.Source.Should().Be(WorkspaceModelExecutionProfileSource.WorkspaceDefault);
    }

    [Fact]
    public async Task SetAsync_persists_tenant_override()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantSettingsRepository settings = new();
        WorkspaceModelExecutionProfileService sut = CreateService(tenantId, settings);

        WorkspaceModelExecutionProfileSnapshot snapshot =
            await sut.SetAsync(AgentModelExecutionProfile.HighAssurance, CancellationToken.None);

        snapshot.EffectiveProfile.Should().Be(AgentModelExecutionProfile.HighAssurance);
        snapshot.Source.Should().Be(WorkspaceModelExecutionProfileSource.TenantOverride);

        string? stored = await settings.TryGetAsync(
            tenantId,
            TenantSettingKeys.DefaultModelExecutionProfile,
            CancellationToken.None);

        stored.Should().Be(nameof(AgentModelExecutionProfile.HighAssurance));
    }

    [Fact]
    public async Task ClearOverrideAsync_removes_tenant_override()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantSettingsRepository settings = new();
        WorkspaceModelExecutionProfileService sut = CreateService(tenantId, settings);

        await sut.SetAsync(AgentModelExecutionProfile.Economy, CancellationToken.None);

        WorkspaceModelExecutionProfileSnapshot snapshot =
            await sut.ClearOverrideAsync(CancellationToken.None);

        snapshot.EffectiveProfile.Should().Be(AgentModelExecutionProfile.Balanced);
        snapshot.Source.Should().Be(WorkspaceModelExecutionProfileSource.WorkspaceDefault);
    }

    private static WorkspaceModelExecutionProfileService CreateService(Guid tenantId) =>
        CreateService(tenantId, new InMemoryTenantSettingsRepository());

    private static WorkspaceModelExecutionProfileService CreateService(
        Guid tenantId,
        InMemoryTenantSettingsRepository settingsRepository)
    {
        TestScopeContextProvider scopeProvider = new(
            new ScopeContext
            {
                TenantId = tenantId,
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid()
            });

        return new WorkspaceModelExecutionProfileService(scopeProvider, settingsRepository);
    }

    private sealed class TestScopeContextProvider(ScopeContext scope) : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope() => scope;
    }
}
