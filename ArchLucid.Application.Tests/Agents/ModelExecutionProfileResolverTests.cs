using ArchLucid.Application.Agents;
using ArchLucid.Application.Tenancy;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Agents;

[Trait("Suite", "Core")]
public sealed class ModelExecutionProfileResolverTests
{
    [Fact]
    public async Task ResolveForRunCreate_returns_workspace_default_when_override_absent()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantSettingsRepository settings = new();
        await settings.UpsertAsync(
            tenantId,
            TenantSettingKeys.DefaultModelExecutionProfile,
            AgentModelExecutionProfileParser.Format(AgentModelExecutionProfile.Economy),
            CancellationToken.None);

        ModelExecutionProfileResolver sut = CreateResolver(tenantId, settings);
        ArchitectureRequest request = CreateRequest();

        ModelExecutionProfileResolution resolution =
            await sut.ResolveForRunCreateAsync(request, CancellationToken.None);

        resolution.EffectiveProfile.Should().Be(AgentModelExecutionProfile.Economy);
        resolution.WorkspaceDefault.Should().Be(AgentModelExecutionProfile.Economy);
        resolution.RequestedOverrideRaw.Should().BeNull();
        resolution.OverrideRejected.Should().BeFalse();
    }

    [Fact]
    public async Task ResolveForRunCreate_applies_valid_override()
    {
        ModelExecutionProfileResolver sut = CreateResolver(Guid.NewGuid(), new InMemoryTenantSettingsRepository());
        ArchitectureRequest request = CreateRequest();
        request.ModelExecutionProfileOverride = "HighAssurance";

        ModelExecutionProfileResolution resolution =
            await sut.ResolveForRunCreateAsync(request, CancellationToken.None);

        resolution.EffectiveProfile.Should().Be(AgentModelExecutionProfile.HighAssurance);
        resolution.WorkspaceDefault.Should().Be(AgentModelExecutionProfile.Balanced);
        resolution.RequestedOverrideRaw.Should().Be("HighAssurance");
        resolution.OverrideRejected.Should().BeFalse();
    }

    [Fact]
    public async Task ResolveForRunCreate_fails_closed_on_invalid_override()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantSettingsRepository settings = new();
        await settings.UpsertAsync(
            tenantId,
            TenantSettingKeys.DefaultModelExecutionProfile,
            AgentModelExecutionProfileParser.Format(AgentModelExecutionProfile.Economy),
            CancellationToken.None);

        ModelExecutionProfileResolver sut = CreateResolver(tenantId, settings);
        ArchitectureRequest request = CreateRequest();
        request.ModelExecutionProfileOverride = "turbo-mode";

        ModelExecutionProfileResolution resolution =
            await sut.ResolveForRunCreateAsync(request, CancellationToken.None);

        resolution.EffectiveProfile.Should().Be(AgentModelExecutionProfile.Economy);
        resolution.WorkspaceDefault.Should().Be(AgentModelExecutionProfile.Economy);
        resolution.RequestedOverrideRaw.Should().Be("turbo-mode");
        resolution.OverrideRejected.Should().BeTrue();
    }

    private static ModelExecutionProfileResolver CreateResolver(
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

        WorkspaceModelExecutionProfileService workspaceService =
            new(scopeProvider, settingsRepository);

        return new ModelExecutionProfileResolver(workspaceService);
    }

    private static ArchitectureRequest CreateRequest() =>
        new()
        {
            RequestId = "req-1",
            SystemName = "OrderService",
            Description = "Design a secure multi-tier web application on Azure.",
            Environment = "Production"
        };

    private sealed class TestScopeContextProvider(ScopeContext scope) : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope() => scope;
    }
}
