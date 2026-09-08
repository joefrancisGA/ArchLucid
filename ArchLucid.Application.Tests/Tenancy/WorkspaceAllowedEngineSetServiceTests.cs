using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class WorkspaceAllowedEngineSetServiceTests
{
    [Fact]
    public async Task SetAsync_throws_when_serialized_allowed_engine_set_exceeds_tenant_setting_value_limit()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantSettingsRepository settings = new();
        IReadOnlyList<string> aliasIds = Enumerable
            .Range(1, 14)
            .Select(index => $"managed-azure-openai-alias-{index:D2}")
            .ToList();

        WorkspaceAllowedEngineSetService sut = CreateService(
            tenantId,
            settings,
            CreateRegistry(aliasIds));

        WorkspaceAllowedEngineSetSnapshot snapshot = new(
            aliasIds,
            aliasIds[0],
            WorkspaceAllowedEngineSetSource.TenantOverride);

        Func<Task> act = () => sut.SetAsync(snapshot, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*at most {TenantSettingsSchemaLimits.SettingValueMaxLength}*");
    }

    [Fact]
    public async Task SetAsync_persists_when_default_catalog_alias_count_fits_tenant_setting_value_limit()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantSettingsRepository settings = new();
        IReadOnlyList<string> aliasIds =
        [
            AgentModelAliasIds.EconomyGeneral,
            AgentModelAliasIds.StandardGeneral,
            AgentModelAliasIds.PremiumAssurance,
        ];

        WorkspaceAllowedEngineSetService sut = CreateService(
            tenantId,
            settings,
            CreateRegistry(aliasIds));

        await sut.SetAsync(
            new WorkspaceAllowedEngineSetSnapshot(
                aliasIds,
                AgentModelAliasIds.StandardGeneral,
                WorkspaceAllowedEngineSetSource.TenantOverride),
            CancellationToken.None);

        string? stored = await settings.TryGetAsync(
            tenantId,
            TenantSettingKeys.WorkspaceAllowedEngineAliases,
            CancellationToken.None);

        stored.Should().NotBeNullOrWhiteSpace();
        stored!.Length.Should().BeLessThanOrEqualTo(TenantSettingsSchemaLimits.SettingValueMaxLength);
    }

    private static WorkspaceAllowedEngineSetService CreateService(
        Guid tenantId,
        InMemoryTenantSettingsRepository settings,
        IAgentModelAliasRegistry aliasRegistry)
    {
        TestScopeContextProvider scopeProvider = new(
            new ScopeContext
            {
                TenantId = tenantId,
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            });

        return new WorkspaceAllowedEngineSetService(scopeProvider, settings, aliasRegistry);
    }

    private static StubAliasRegistry CreateRegistry(IReadOnlyList<string> aliasIds)
    {
        List<AgentModelAliasRegistryEntry> entries = aliasIds
            .Select(
                aliasId => new AgentModelAliasRegistryEntry
                {
                    AliasId = aliasId,
                    ProviderConnectionKind = AgentModelAliasProviderKinds.ArchLucidManagedAzureOpenAi,
                    DeploymentName = "deployment",
                    CapabilityTags = [AgentModelAliasCapabilities.StructuredOutput],
                    ApprovedTaskTypes = [AgentModelTaskTypes.Primary],
                })
            .ToList();

        return new StubAliasRegistry(entries);
    }

    private sealed class TestScopeContextProvider(ScopeContext scope) : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope() => scope;
    }

    private sealed class StubAliasRegistry(IReadOnlyCollection<AgentModelAliasRegistryEntry> entries)
        : IAgentModelAliasRegistry
    {
        public IReadOnlyCollection<AgentModelAliasRegistryEntry> ListEntries() => entries.ToList();

        public AgentModelAliasRegistryEntry GetRequired(string aliasId) =>
            entries.First(entry => string.Equals(entry.AliasId, aliasId, StringComparison.OrdinalIgnoreCase));

        public bool TryGet(string aliasId, out AgentModelAliasRegistryEntry? entry)
        {
            entry = entries.FirstOrDefault(
                candidate => string.Equals(candidate.AliasId, aliasId, StringComparison.OrdinalIgnoreCase));

            return entry is not null;
        }

        public string ResolveAliasIdForTier(Contracts.Common.LlmModelTier tier) =>
            AgentModelAliasIds.StandardGeneral;
    }
}
