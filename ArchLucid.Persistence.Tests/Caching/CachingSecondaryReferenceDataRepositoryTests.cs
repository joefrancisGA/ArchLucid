using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.AiUsage;
using ArchLucid.Persistence.Alerts;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Identity;
using ArchLucid.Persistence.Roi;

namespace ArchLucid.Persistence.Tests.Caching;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CachingSecondaryReferenceDataRepositoryTests
{
    [Fact]
    public async Task PolicyPackVersion_GetByPackAndVersionAsync_returns_cached_content()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryPolicyPackVersionRepository inner = new();
        CachingPolicyPackVersionRepository repo = new(inner, hotPath);

        Guid packId = Guid.NewGuid();
        PolicyPackVersion version = new()
        {
            PolicyPackId = packId,
            Version = "1.0.0",
            ContentJson = """{"k":1}""",
            IsPublished = true,
        };

        await inner.CreateAsync(version, CancellationToken.None);

        PolicyPackVersion? first = await repo.GetByPackAndVersionAsync(packId, "1.0.0", CancellationToken.None);
        PolicyPackVersion? second = await repo.GetByPackAndVersionAsync(packId, "1.0.0", CancellationToken.None);

        first.Should().NotBeNull();
        second!.ContentJson.Should().Be("""{"k":1}""");
    }

    [Fact]
    public async Task PolicyPackVersion_ListByPackAsync_omits_content_json()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryPolicyPackVersionRepository inner = new();
        CachingPolicyPackVersionRepository repo = new(inner, hotPath);

        Guid packId = Guid.NewGuid();
        await inner.CreateAsync(
            new PolicyPackVersion
            {
                PolicyPackId = packId,
                Version = "1.0.0",
                ContentJson = """{"k":1}""",
                IsPublished = true,
            },
            CancellationToken.None);

        IReadOnlyList<PolicyPackVersion> list = await repo.ListByPackAsync(packId, CancellationToken.None);
        PolicyPackVersion? detail = await repo.GetByPackAndVersionAsync(packId, "1.0.0", CancellationToken.None);

        list.Should().ContainSingle();
        list[0].ContentJson.Should().BeEmpty();
        detail.Should().NotBeNull();
        detail!.ContentJson.Should().Be("""{"k":1}""");
    }

    [Fact]
    public async Task PolicyPackCatalog_ListPromotedAsync_invalidates_on_demote()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryPolicyPackCatalogRepository inner = new();
        CachingPolicyPackCatalogRepository repo = new(inner, hotPath);

        PolicyPackCatalogEntryDetail detail = await repo.UpsertPromotedFromSnapshotAsync(
            Guid.NewGuid(),
            "Baseline",
            "desc",
            "BuiltIn",
            "1.0.0",
            "{}",
            CancellationToken.None);

        (await repo.ListPromotedAsync(CancellationToken.None)).Should().ContainSingle();

        (await repo.TryDemoteAsync(detail.PolicyPackCatalogEntryId, CancellationToken.None)).Should().BeTrue();

        (await repo.ListPromotedAsync(CancellationToken.None)).Should().BeEmpty();
    }

    [Fact]
    public async Task AlertRule_ListEnabledByScopeAsync_refreshes_after_create()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryAlertRuleRepository inner = new();
        CachingAlertRuleRepository repo = new(inner, hotPath);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        (await repo.ListEnabledByScopeAsync(tenantId, workspaceId, projectId, CancellationToken.None))
            .Should().BeEmpty();

        await repo.CreateAsync(
            new AlertRule
            {
                RuleId = Guid.NewGuid(),
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                Name = "High findings",
                RuleType = "FindingCount",
                IsEnabled = true,
            },
            CancellationToken.None);

        (await repo.ListEnabledByScopeAsync(tenantId, workspaceId, projectId, CancellationToken.None))
            .Should().ContainSingle();
    }

    [Fact]
    public async Task TenantAiBudgetPolicy_GetByTenantIdAsync_invalidates_when_default_inserted()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryTenantAiBudgetPolicyRepository inner = new();
        CachingTenantAiBudgetPolicyRepository repo = new(inner, hotPath);

        Guid tenantId = Guid.NewGuid();

        (await repo.GetByTenantIdAsync(tenantId, CancellationToken.None)).Should().BeNull();

        (await repo.EnsureDefaultTrialPolicyIfAbsentAsync(
            tenantId,
            12m,
            TimeProvider.System.GetUtcNow().AddDays(14),
            CancellationToken.None)).Should().BeTrue();

        TenantAiBudgetPolicyRow? row = await repo.GetByTenantIdAsync(tenantId, CancellationToken.None);
        row.Should().NotBeNull();
        row!.BudgetAmountUsd.Should().Be(12m);
    }

    [Fact]
    public async Task TenantCostSettings_TryGetAsync_refreshes_after_upsert()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryTenantCostSettingsRepository inner = new();
        CachingTenantCostSettingsRepository repo = new(inner, hotPath);

        Guid tenantId = Guid.NewGuid();

        await repo.UpsertAsync(
            new TenantCostSettingsRecord
            {
                TenantId = tenantId,
                ArchitectHourlyRateUsd = 150m,
                AverageIncidentCostUsd = 5000m,
                EaDiscountMultiplier = 0.8m,
                UpdatedUtc = TimeProvider.System.GetUtcNow(),
            },
            CancellationToken.None);

        TenantCostSettingsRecord? cached = await repo.TryGetAsync(tenantId, CancellationToken.None);
        cached!.ArchitectHourlyRateUsd.Should().Be(150m);

        await repo.UpsertAsync(
            new TenantCostSettingsRecord
            {
                TenantId = tenantId,
                ArchitectHourlyRateUsd = 200m,
                AverageIncidentCostUsd = 5000m,
                EaDiscountMultiplier = 0.8m,
                UpdatedUtc = TimeProvider.System.GetUtcNow(),
            },
            CancellationToken.None);

        (await repo.TryGetAsync(tenantId, CancellationToken.None))!.ArchitectHourlyRateUsd.Should().Be(200m);
    }

    [Fact]
    public async Task TenantIdentityProvider_TryGetAsync_refreshes_after_upsert()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryTenantIdentityProviderConfigurationRepository inner = new();
        CachingTenantIdentityProviderConfigurationRepository repo = new(inner, hotPath);

        Guid tenantId = Guid.NewGuid();

        await repo.UpsertAsync(
            new TenantIdentityProviderConfigurationRecord
            {
                TenantId = tenantId,
                Protocol = TenantIdentityProtocol.Oidc,
                IssuerUri = "https://login.example/",
                ClaimMappingJson = "{}",
                UpdatedUtc = TimeProvider.System.GetUtcNow(),
                UpdatedByActorId = "test",
                IsActive = true,
            },
            CancellationToken.None);

        (await repo.TryGetAsync(tenantId, CancellationToken.None))!.IssuerUri.Should().Be("https://login.example/");
    }

    [Fact]
    public async Task TenantSignInEmailDomain_FindByNormalizedDomainAsync_refreshes_after_insert()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryTenantSignInEmailDomainRepository inner = new();
        CachingTenantSignInEmailDomainRepository repo = new(inner, hotPath);

        Guid tenantId = Guid.NewGuid();

        (await repo.FindByNormalizedDomainAsync("ACME.COM", CancellationToken.None)).Should().BeNull();

        await repo.InsertAsync(
            new TenantSignInEmailDomainRecord
            {
                TenantId = tenantId,
                DisplayDomain = "Acme.com",
                NormalizedDomain = "ACME.COM",
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            },
            CancellationToken.None);

        TenantSignInEmailDomainRecord? found =
            await repo.FindByNormalizedDomainAsync("ACME.COM", CancellationToken.None);

        found.Should().NotBeNull();
        found!.TenantId.Should().Be(tenantId);
    }
}
