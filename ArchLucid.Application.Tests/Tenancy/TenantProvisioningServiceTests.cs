using ArchLucid.Application.Common;
using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Marketing;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Application.Marketing;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TenantProvisioningServiceTests
{
    private static void SetupSlugNotFound(Mock<ITenantRepository> repo)
    {
        repo.Setup(r => r.GetByNormalizedOrganizationNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);
        repo.Setup(r => r.GetBySlugFromControlPlaneCatalogAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);
        repo.Setup(r => r.GetBySlugAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);
    }

    private static Mock<IOptionsMonitor<TenantProvisioningOptions>> DefaultProvisioningMonitor()
    {
        Mock<IOptionsMonitor<TenantProvisioningOptions>> m = new();
        m.Setup(x => x.CurrentValue).Returns(new TenantProvisioningOptions());

        return m;
    }

    [SkippableFact]
    public async Task ProvisionAsync_is_idempotent_by_slug()
    {
        InMemoryTenantRepository repo = new();
        InMemoryTenantSettingsRepository settingsRepo = new();
        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("admin@test");
        Mock<IAuditService> audit = new();
        Mock<ITenantSqlCatalogProvisioner> sqlCatalog = new();

        sqlCatalog
            .Setup(p => p.ProvisionTenantCatalogAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IDefaultPolicyPackSeeder> packSeeder = new();
        packSeeder
            .Setup(s =>
                s.EnsureDefaultPolicyPacksAsync(
                    It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = DefaultProvisioningMonitor();
        InMemoryArchitectureProjectRepository projects = new();

        TenantProvisioningService sut = new(
            repo,
            projects,
            actor.Object,
            audit.Object,
            NullLogger<TenantProvisioningService>.Instance,
            options.Object,
            sqlCatalog.Object,
            packSeeder.Object,
            new Mock<IMarketingAttributionService>().Object,
            settingsRepo);

        TenantProvisioningRequest req = new()
        {
            Name = "Contoso Labs", AdminEmail = "ops@contoso.example", Tier = TenantTier.Enterprise,
        };

        TenantProvisioningResult first = await sut.ProvisionAsync(req, CancellationToken.None);
        TenantProvisioningResult second = await sut.ProvisionAsync(req, CancellationToken.None);

        second.WasAlreadyProvisioned.Should().BeTrue();
        second.TenantId.Should().Be(first.TenantId);
        second.DefaultWorkspaceId.Should().Be(first.DefaultWorkspaceId);
        second.DefaultProjectId.Should().Be(first.DefaultProjectId);

        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Once);

        packSeeder.Verify(
            s => s.EnsureDefaultPolicyPacksAsync(first.TenantId, first.DefaultWorkspaceId, first.DefaultProjectId,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task ProvisionAsync_is_idempotent_by_normalized_organization_name()
    {
        InMemoryTenantRepository repo = new();
        InMemoryTenantSettingsRepository settingsRepo = new();
        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("admin@test");
        Mock<IAuditService> audit = new();
        Mock<ITenantSqlCatalogProvisioner> sqlCatalog = new();

        sqlCatalog
            .Setup(p => p.ProvisionTenantCatalogAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IDefaultPolicyPackSeeder> packSeeder = new();
        packSeeder
            .Setup(s =>
                s.EnsureDefaultPolicyPacksAsync(
                    It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = DefaultProvisioningMonitor();
        InMemoryArchitectureProjectRepository projects = new();

        TenantProvisioningService sut = new(
            repo,
            projects,
            actor.Object,
            audit.Object,
            NullLogger<TenantProvisioningService>.Instance,
            options.Object,
            sqlCatalog.Object,
            packSeeder.Object,
            new Mock<IMarketingAttributionService>().Object,
            settingsRepo);

        TenantProvisioningRequest firstRequest = new()
        {
            Name = "Contoso Labs",
            AdminEmail = "ops@contoso.example",
            Tier = TenantTier.Enterprise,
        };

        TenantProvisioningResult first = await sut.ProvisionAsync(firstRequest, CancellationToken.None);
        TenantProvisioningResult second = await sut.ProvisionAsync(
            new TenantProvisioningRequest
            {
                Name = "  contoso labs ",
                AdminEmail = "other@contoso.example",
                Tier = TenantTier.Enterprise,
            },
            CancellationToken.None);

        second.WasAlreadyProvisioned.Should().BeTrue();
        second.TenantId.Should().Be(first.TenantId);
    }

    [SkippableFact]
    public async Task ProvisionAsync_treats_unique_slug_violation_as_already_provisioned()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid projectId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        const string slug = "race-co";

        TenantRecord existing = new()
        {
            Id = tenantId,
            Name = "Race Co",
            Slug = slug,
            Tier = TenantTier.Free,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = DateTimeOffset.UtcNow,
        };

        Mock<ITenantRepository> repo = new();
        repo.SetupSequence(r => r.GetBySlugFromControlPlaneCatalogAsync(slug, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null)
            .ReturnsAsync(existing);
        repo.Setup(r => r.GetBySlugAsync(slug, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);
        repo.Setup(r => r.InsertTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                slug,
                It.IsAny<TenantTier>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .ThrowsAsync(SqlExceptionTestFactory.Create(
                2627,
                "Violation of UNIQUE KEY constraint 'IX_Tenants_Slug'. Cannot insert duplicate key in object 'dbo.Tenants'."));
        repo.Setup(r => r.GetFirstWorkspaceAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantWorkspaceLink { WorkspaceId = workspaceId, DefaultProjectId = projectId });

        TenantProvisioningService sut = new(
            repo.Object,
            Mock.Of<IArchitectureProjectRepository>(),
            Mock.Of<IActorContext>(),
            Mock.Of<IAuditService>(),
            NullLogger<TenantProvisioningService>.Instance,
            DefaultProvisioningMonitor().Object,
            Mock.Of<ITenantSqlCatalogProvisioner>(),
            Mock.Of<IDefaultPolicyPackSeeder>(),
            new Mock<IMarketingAttributionService>().Object,
            new Mock<ITenantSettingsRepository>().Object);

        TenantProvisioningRequest req = new()
        {
            Name = "Race Co",
            AdminEmail = "ops@race.example",
            Tier = TenantTier.Free,
        };

        TenantProvisioningResult result = await sut.ProvisionAsync(req, CancellationToken.None);

        result.WasAlreadyProvisioned.Should().BeTrue();
        result.TenantId.Should().Be(tenantId);
        result.DefaultWorkspaceId.Should().Be(workspaceId);
        result.DefaultProjectId.Should().Be(projectId);
        repo.Verify(r => r.InsertWorkspaceAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [SkippableFact]
    public async Task ProvisionAsync_rejects_unknown_data_region_when_configured_allowlist_strict()
    {
        Mock<ITenantRepository> repo = new();
        SetupSlugNotFound(repo);

        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = new();
        options.Setup(m => m.CurrentValue).Returns(new TenantProvisioningOptions { SupportedDataRegions = ["default"] });

        TenantProvisioningService sut = new(
            repo.Object,
            Mock.Of<IArchitectureProjectRepository>(),
            Mock.Of<IActorContext>(),
            Mock.Of<IAuditService>(),
            NullLogger<TenantProvisioningService>.Instance,
            options.Object,
            Mock.Of<ITenantSqlCatalogProvisioner>(),
            Mock.Of<IDefaultPolicyPackSeeder>(),
            new Mock<IMarketingAttributionService>().Object,
            new Mock<ITenantSettingsRepository>().Object);

        TenantProvisioningRequest req =
            new() { Name = "R Co", AdminEmail = "root@example.com", Tier = TenantTier.Standard, DataRegion = "eastus" };

        Func<Task> act = async () => await sut.ProvisionAsync(req, CancellationToken.None);

        await act.Should()
            .ThrowAsync<ArgumentException>()
            .WithParameterName(nameof(TenantProvisioningRequest.DataRegion));
    }

    [SkippableFact]
    public async Task ProvisionAsync_persists_normalized_DataRegion_and_audit_geo_field()
    {
        InMemoryTenantRepository repo = new();

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("admin@test");
        Mock<IAuditService> audit = new();
        AuditEvent? emitted = null;

        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((evt, _) => emitted = evt)
            .Returns(Task.CompletedTask);

        Mock<ITenantSqlCatalogProvisioner> sqlCatalog = new();

        sqlCatalog
            .Setup(p => p.ProvisionTenantCatalogAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IDefaultPolicyPackSeeder> packSeeder = new();

        packSeeder
            .Setup(s =>
                s.EnsureDefaultPolicyPacksAsync(
                    It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = DefaultProvisioningMonitor();
        InMemoryArchitectureProjectRepository projects = new();
        InMemoryTenantSettingsRepository settingsRepo = new();

        TenantProvisioningService sut = new(
            repo,
            projects,
            actor.Object,
            audit.Object,
            NullLogger<TenantProvisioningService>.Instance,
            options.Object,
            sqlCatalog.Object,
            packSeeder.Object,
            new Mock<IMarketingAttributionService>().Object,
            settingsRepo);

        TenantProvisioningRequest req = new()

            { Name = "Geo Co", AdminEmail = "geo@example.com", Tier = TenantTier.Enterprise, DataRegion = " EastUS ", };

        await sut.ProvisionAsync(req, CancellationToken.None);

        TenantRecord? stored = await repo.GetBySlugAsync(TenantSlugNormalizer.FromName(req.Name), CancellationToken.None);

        stored.Should().NotBeNull();
        stored!.DataRegion.Should().Be("eastus");
        emitted.Should().NotBeNull();
        emitted!.DataJson.Should().Contain("\"dataRegion\":\"eastus\"");
        emitted.TenantId.Should().Be(stored.Id);

        TenantRecord? roundTrip = await repo.GetByIdAsync(stored.Id, CancellationToken.None);

        roundTrip.Should().NotBeNull();
        roundTrip!.DataRegion.Should().Be("eastus");

        TenantProvisioningResult second =
            await sut.ProvisionAsync(
                new TenantProvisioningRequest { Name = req.Name, AdminEmail = req.AdminEmail, Tier = req.Tier, DataRegion = "eastUS", },
                CancellationToken.None);

        second.WasAlreadyProvisioned.Should().BeTrue();
    }

    [SkippableFact]
    public async Task ProvisionAsync_skips_workspace_insert_when_offboard_completes_after_catalog_before_workspace()
    {
        Guid capturedTenantId = Guid.Empty;
        DateTimeOffset anchor = new(2026, 10, 13, 0, 0, 0, TimeSpan.Zero);

        Mock<ITenantRepository> repo = new();

        SetupSlugNotFound(repo);

        repo.Setup(r => r.InsertTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<TenantTier>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .Callback<Guid, string, string, TenantTier, Guid?, string, CancellationToken, int?>(
                (tid, _, _, _, _, _, _, _) => capturedTenantId = tid)
            .Returns(Task.CompletedTask);

        int tenantReadCount = 0;
        repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) =>
            {
                tenantReadCount++;

                if (tenantReadCount == 1)
                {
                    return new TenantRecord { Id = id, Tier = TenantTier.Free };
                }

                return new TenantRecord
                {
                    Id = id,
                    Tier = TenantTier.Free,
                    OffboardedUtc = anchor,
                    ErasureEligibleUtc = anchor.AddDays(30),
                };
            });

        Mock<IArchitectureProjectRepository> projects = new(MockBehavior.Strict);
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITenantSqlCatalogProvisioner> sqlCatalog = new();

        sqlCatalog
            .Setup(p => p.ProvisionTenantCatalogAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = DefaultProvisioningMonitor();

        TenantProvisioningService sut = new(
            repo.Object,
            projects.Object,
            new Mock<IActorContext>().Object,
            audit.Object,
            NullLogger<TenantProvisioningService>.Instance,
            options.Object,
            sqlCatalog.Object,
            new Mock<IDefaultPolicyPackSeeder>().Object,
            new Mock<IMarketingAttributionService>().Object,
            new Mock<ITenantSettingsRepository>().Object);

        TenantProvisioningRequest req = new()
        {
            Name = "Workspace Race Co",
            AdminEmail = "owner@race.example",
            Tier = TenantTier.Free,
        };

        await sut.ProvisionAsync(req, CancellationToken.None);

        sqlCatalog.Verify(
            p => p.ProvisionTenantCatalogAsync(capturedTenantId, It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);
        repo.Verify(
            r => r.InsertWorkspaceAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        projects.Verify(
            p => p.InsertAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ProvisionAsync_skips_catalog_and_workspace_when_offboard_completes_after_tenant_insert_before_catalog()
    {
        Guid capturedTenantId = Guid.Empty;
        DateTimeOffset anchor = new(2026, 10, 13, 0, 0, 0, TimeSpan.Zero);

        Mock<ITenantRepository> repo = new();

        SetupSlugNotFound(repo);

        repo.Setup(r => r.InsertTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<TenantTier>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .Callback<Guid, string, string, TenantTier, Guid?, string, CancellationToken, int?>(
                (tid, _, _, _, _, _, _, _) => capturedTenantId = tid)
            .Returns(Task.CompletedTask);

        repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) =>
                id == capturedTenantId
                    ? new TenantRecord
                    {
                        Id = id,
                        Tier = TenantTier.Free,
                        OffboardedUtc = anchor,
                        ErasureEligibleUtc = anchor.AddDays(30),
                    }
                    : null);

        Mock<IArchitectureProjectRepository> projects = new(MockBehavior.Strict);
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITenantSqlCatalogProvisioner> sqlCatalog = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = DefaultProvisioningMonitor();

        TenantProvisioningService sut = new(
            repo.Object,
            projects.Object,
            new Mock<IActorContext>().Object,
            audit.Object,
            NullLogger<TenantProvisioningService>.Instance,
            options.Object,
            sqlCatalog.Object,
            new Mock<IDefaultPolicyPackSeeder>().Object,
            new Mock<IMarketingAttributionService>().Object,
            new Mock<ITenantSettingsRepository>().Object);

        TenantProvisioningRequest req = new()
        {
            Name = "Catalog Race Co",
            AdminEmail = "owner@race.example",
            Tier = TenantTier.Free,
        };

        TenantProvisioningResult result = await sut.ProvisionAsync(req, CancellationToken.None);

        result.TenantId.Should().Be(capturedTenantId);
        result.DefaultWorkspaceId.Should().Be(Guid.Empty);
        result.DefaultProjectId.Should().Be(Guid.Empty);
        sqlCatalog.Verify(
            p => p.ProvisionTenantCatalogAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        repo.Verify(
            r => r.InsertWorkspaceAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        projects.Verify(
            p => p.InsertAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ProvisionAsync_skips_policy_pack_seed_and_nav_settings_when_offboard_completes_after_workspace_insert_before_audit()
    {
        Guid capturedTenantId = Guid.Empty;
        DateTimeOffset anchor = new(2026, 10, 13, 0, 0, 0, TimeSpan.Zero);

        Mock<ITenantRepository> repo = new();

        SetupSlugNotFound(repo);

        repo.Setup(r => r.InsertTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<TenantTier>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .Callback<Guid, string, string, TenantTier, Guid?, string, CancellationToken, int?>(
                (tid, _, _, _, _, _, _, _) => capturedTenantId = tid)
            .Returns(Task.CompletedTask);

        repo.Setup(r => r.InsertWorkspaceAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        int tenantReadCount = 0;
        repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) =>
            {
                tenantReadCount++;

                if (tenantReadCount <= 3)
                {
                    return new TenantRecord { Id = id, Tier = TenantTier.Free };
                }

                return new TenantRecord
                {
                    Id = id,
                    Tier = TenantTier.Free,
                    OffboardedUtc = anchor,
                    ErasureEligibleUtc = anchor.AddDays(30),
                };
            });

        Mock<IArchitectureProjectRepository> projects = new();

        projects
            .Setup(p => p.InsertAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("admin@test");
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITenantSqlCatalogProvisioner> sqlCatalog = new();

        sqlCatalog
            .Setup(p => p.ProvisionTenantCatalogAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IDefaultPolicyPackSeeder> packSeeder = new(MockBehavior.Strict);

        Mock<ITenantSettingsRepository> settings = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = DefaultProvisioningMonitor();

        TenantProvisioningService sut = new(
            repo.Object,
            projects.Object,
            actor.Object,
            audit.Object,
            NullLogger<TenantProvisioningService>.Instance,
            options.Object,
            sqlCatalog.Object,
            packSeeder.Object,
            new Mock<IMarketingAttributionService>().Object,
            settings.Object);

        TenantProvisioningRequest req = new()
        {
            Name = "Policy Pack Race Co",
            AdminEmail = "owner@race.example",
            Tier = TenantTier.Free,
        };

        await sut.ProvisionAsync(req, CancellationToken.None);

        packSeeder.Verify(
            s => s.EnsureDefaultPolicyPacksAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
        settings.Verify(
            s => s.UpsertAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ProvisionAsync_skips_first_touch_persist_when_offboard_completes_after_workspace_insert_before_audit()
    {
        Guid capturedTenantId = Guid.Empty;
        DateTimeOffset anchor = new(2026, 10, 13, 0, 0, 0, TimeSpan.Zero);
        MarketingAttributionSnapshot firstTouch = new()
        {
            UtmSource = "newsletter",
            CapturedUtc = anchor,
        };

        Mock<ITenantRepository> repo = new();

        SetupSlugNotFound(repo);

        repo.Setup(r => r.InsertTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<TenantTier>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .Callback<Guid, string, string, TenantTier, Guid?, string, CancellationToken, int?>(
                (tid, _, _, _, _, _, _, _) => capturedTenantId = tid)
            .Returns(Task.CompletedTask);

        repo.Setup(r => r.InsertWorkspaceAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        int tenantReadCount = 0;
        repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) =>
            {
                tenantReadCount++;

                if (tenantReadCount <= 3)
                {
                    return new TenantRecord { Id = id, Tier = TenantTier.Free };
                }

                return new TenantRecord
                {
                    Id = id,
                    Tier = TenantTier.Free,
                    OffboardedUtc = anchor,
                    ErasureEligibleUtc = anchor.AddDays(30),
                };
            });

        Mock<IArchitectureProjectRepository> projects = new();

        projects
            .Setup(p => p.InsertAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("admin@test");
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITenantSqlCatalogProvisioner> sqlCatalog = new();

        sqlCatalog
            .Setup(p => p.ProvisionTenantCatalogAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IDefaultPolicyPackSeeder> packSeeder = new();

        packSeeder
            .Setup(s =>
                s.EnsureDefaultPolicyPacksAsync(
                    It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<ITenantSettingsRepository> settings = new();

        settings
            .Setup(s => s.UpsertAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IMarketingAttributionService> marketing = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = DefaultProvisioningMonitor();

        TenantProvisioningService sut = new(
            repo.Object,
            projects.Object,
            actor.Object,
            audit.Object,
            NullLogger<TenantProvisioningService>.Instance,
            options.Object,
            sqlCatalog.Object,
            packSeeder.Object,
            marketing.Object,
            settings.Object);

        TenantProvisioningRequest req = new()
        {
            Name = "Attribution Race Co",
            AdminEmail = "owner@race.example",
            Tier = TenantTier.Free,
            FirstTouch = firstTouch,
        };

        await sut.ProvisionAsync(req, CancellationToken.None);

        marketing.Verify(
            m => m.PersistFirstTouchIfPresentAsync(It.IsAny<Guid>(), It.IsAny<MarketingAttributionSnapshot>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ProvisionAsync_skips_project_insert_when_offboard_completes_after_workspace_before_project()
    {
        Guid capturedTenantId = Guid.Empty;
        DateTimeOffset anchor = new(2026, 10, 13, 0, 0, 0, TimeSpan.Zero);

        Mock<ITenantRepository> repo = new();

        SetupSlugNotFound(repo);

        repo.Setup(r => r.InsertTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<TenantTier>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .Callback<Guid, string, string, TenantTier, Guid?, string, CancellationToken, int?>(
                (tid, _, _, _, _, _, _, _) => capturedTenantId = tid)
            .Returns(Task.CompletedTask);

        repo.Setup(r => r.InsertWorkspaceAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        int tenantReadCount = 0;
        repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) =>
            {
                tenantReadCount++;

                if (tenantReadCount <= 2)
                {
                    return new TenantRecord { Id = id, Tier = TenantTier.Free };
                }

                return new TenantRecord
                {
                    Id = id,
                    Tier = TenantTier.Free,
                    OffboardedUtc = anchor,
                    ErasureEligibleUtc = anchor.AddDays(30),
                };
            });

        Mock<IArchitectureProjectRepository> projects = new(MockBehavior.Strict);
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITenantSqlCatalogProvisioner> sqlCatalog = new();

        sqlCatalog
            .Setup(p => p.ProvisionTenantCatalogAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = DefaultProvisioningMonitor();

        TenantProvisioningService sut = new(
            repo.Object,
            projects.Object,
            new Mock<IActorContext>().Object,
            audit.Object,
            NullLogger<TenantProvisioningService>.Instance,
            options.Object,
            sqlCatalog.Object,
            new Mock<IDefaultPolicyPackSeeder>().Object,
            new Mock<IMarketingAttributionService>().Object,
            new Mock<ITenantSettingsRepository>().Object);

        TenantProvisioningRequest req = new()
        {
            Name = "Project Race Co",
            AdminEmail = "owner@race.example",
            Tier = TenantTier.Free,
        };

        await sut.ProvisionAsync(req, CancellationToken.None);

        repo.Verify(
            r => r.InsertWorkspaceAsync(
                It.IsAny<Guid>(),
                capturedTenantId,
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
        projects.Verify(
            p => p.InsertAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ProvisionAsync_returns_without_platform_audit_when_offboard_completes_after_workspace_insert_before_audit()
    {
        Guid capturedTenantId = Guid.Empty;
        DateTimeOffset anchor = new(2026, 10, 13, 0, 0, 0, TimeSpan.Zero);

        Mock<ITenantRepository> repo = new();

        SetupSlugNotFound(repo);

        repo.Setup(r => r.InsertTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<TenantTier>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .Callback<Guid, string, string, TenantTier, Guid?, string, CancellationToken, int?>(
                (tid, _, _, _, _, _, _, _) => capturedTenantId = tid)
            .Returns(Task.CompletedTask);

        repo.Setup(r => r.InsertWorkspaceAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        int tenantReadCount = 0;
        repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) =>
            {
                tenantReadCount++;

                if (tenantReadCount <= 3)
                {
                    return new TenantRecord { Id = id, Tier = TenantTier.Free };
                }

                return new TenantRecord
                {
                    Id = id,
                    Tier = TenantTier.Free,
                    OffboardedUtc = anchor,
                    ErasureEligibleUtc = anchor.AddDays(30),
                };
            });

        Mock<IArchitectureProjectRepository> projects = new();

        projects
            .Setup(p => p.InsertAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("admin@test");
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITenantSqlCatalogProvisioner> sqlCatalog = new();

        sqlCatalog
            .Setup(p => p.ProvisionTenantCatalogAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IDefaultPolicyPackSeeder> packSeeder = new();

        packSeeder
            .Setup(s =>
                s.EnsureDefaultPolicyPacksAsync(
                    It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<ITenantSettingsRepository> settings = new();

        settings
            .Setup(s => s.UpsertAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = DefaultProvisioningMonitor();

        TenantProvisioningService sut = new(
            repo.Object,
            projects.Object,
            actor.Object,
            audit.Object,
            NullLogger<TenantProvisioningService>.Instance,
            options.Object,
            sqlCatalog.Object,
            packSeeder.Object,
            new Mock<IMarketingAttributionService>().Object,
            settings.Object);

        TenantProvisioningRequest req = new()
        {
            Name = "Race Co",
            AdminEmail = "owner@race.example",
            Tier = TenantTier.Free,
        };

        TenantProvisioningResult result = await sut.ProvisionAsync(req, CancellationToken.None);

        result.WasAlreadyProvisioned.Should().BeFalse();
        result.TenantId.Should().Be(capturedTenantId);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ProvisionAsync_skips_policy_pack_seed_when_offboard_completes_after_tenant_before_provision_audit_read_before_seed()
    {
        Guid capturedTenantId = Guid.Empty;
        DateTimeOffset anchor = new(2026, 10, 22, 10, 0, 0, TimeSpan.Zero);

        Mock<ITenantRepository> repo = new();

        SetupSlugNotFound(repo);

        repo.Setup(r => r.InsertTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<TenantTier>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .Callback<Guid, string, string, TenantTier, Guid?, string, CancellationToken, int?>(
                (tid, _, _, _, _, _, _, _) => capturedTenantId = tid)
            .Returns(Task.CompletedTask);

        repo.Setup(r => r.InsertWorkspaceAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        int tenantReadCount = 0;
        repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) =>
            {
                tenantReadCount++;

                if (tenantReadCount <= 4)
                {
                    return new TenantRecord { Id = id, Tier = TenantTier.Free };
                }

                return new TenantRecord
                {
                    Id = id,
                    Tier = TenantTier.Free,
                    OffboardedUtc = anchor,
                    ErasureEligibleUtc = anchor.AddDays(30),
                };
            });

        Mock<IArchitectureProjectRepository> projects = new();

        projects
            .Setup(p => p.InsertAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("admin@test");
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITenantSqlCatalogProvisioner> sqlCatalog = new();

        sqlCatalog
            .Setup(p => p.ProvisionTenantCatalogAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IDefaultPolicyPackSeeder> packSeeder = new(MockBehavior.Strict);

        Mock<ITenantSettingsRepository> settings = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = DefaultProvisioningMonitor();

        TenantProvisioningService sut = new(
            repo.Object,
            projects.Object,
            actor.Object,
            audit.Object,
            NullLogger<TenantProvisioningService>.Instance,
            options.Object,
            sqlCatalog.Object,
            packSeeder.Object,
            new Mock<IMarketingAttributionService>().Object,
            settings.Object);

        TenantProvisioningRequest req = new()
        {
            Name = "Policy Pack Pre Seed Race Co",
            AdminEmail = "owner@race.example",
            Tier = TenantTier.Free,
        };

        TenantProvisioningResult result = await sut.ProvisionAsync(req, CancellationToken.None);

        result.WasAlreadyProvisioned.Should().BeFalse();
        result.TenantId.Should().Be(capturedTenantId);
        packSeeder.Verify(
            s => s.EnsureDefaultPolicyPacksAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
        settings.Verify(
            s => s.UpsertAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ProvisionAsync_returns_without_platform_audit_when_offboard_completes_after_policy_pack_seed_before_audit()
    {
        Guid capturedTenantId = Guid.Empty;
        DateTimeOffset anchor = new(2026, 10, 21, 0, 0, 0, TimeSpan.Zero);

        Mock<ITenantRepository> repo = new();

        SetupSlugNotFound(repo);

        repo.Setup(r => r.InsertTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<TenantTier>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .Callback<Guid, string, string, TenantTier, Guid?, string, CancellationToken, int?>(
                (tid, _, _, _, _, _, _, _) => capturedTenantId = tid)
            .Returns(Task.CompletedTask);

        repo.Setup(r => r.InsertWorkspaceAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        int tenantReadCount = 0;
        repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) =>
            {
                tenantReadCount++;

                if (tenantReadCount <= 5)
                {
                    return new TenantRecord { Id = id, Tier = TenantTier.Free };
                }

                return new TenantRecord
                {
                    Id = id,
                    Tier = TenantTier.Free,
                    OffboardedUtc = anchor,
                    ErasureEligibleUtc = anchor.AddDays(30),
                };
            });

        Mock<IArchitectureProjectRepository> projects = new();

        projects
            .Setup(p => p.InsertAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("admin@test");
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITenantSqlCatalogProvisioner> sqlCatalog = new();

        sqlCatalog
            .Setup(p => p.ProvisionTenantCatalogAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IDefaultPolicyPackSeeder> packSeeder = new();

        packSeeder
            .Setup(s =>
                s.EnsureDefaultPolicyPacksAsync(
                    It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<ITenantSettingsRepository> settings = new();

        settings
            .Setup(s => s.UpsertAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = DefaultProvisioningMonitor();

        TenantProvisioningService sut = new(
            repo.Object,
            projects.Object,
            actor.Object,
            audit.Object,
            NullLogger<TenantProvisioningService>.Instance,
            options.Object,
            sqlCatalog.Object,
            packSeeder.Object,
            new Mock<IMarketingAttributionService>().Object,
            settings.Object);

        TenantProvisioningRequest req = new()
        {
            Name = "Policy Pack Post Seed Race Co",
            AdminEmail = "owner@race.example",
            Tier = TenantTier.Free,
        };

        TenantProvisioningResult result = await sut.ProvisionAsync(req, CancellationToken.None);

        result.WasAlreadyProvisioned.Should().BeFalse();
        result.TenantId.Should().Be(capturedTenantId);
        packSeeder.Verify(
            s => s.EnsureDefaultPolicyPacksAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ProvisionAsync_skips_nav_settings_when_offboard_completes_after_policy_pack_seed_before_settings()
    {
        Guid capturedTenantId = Guid.Empty;
        DateTimeOffset anchor = new(2026, 10, 21, 12, 0, 0, TimeSpan.Zero);

        Mock<ITenantRepository> repo = new();

        SetupSlugNotFound(repo);

        repo.Setup(r => r.InsertTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<TenantTier>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .Callback<Guid, string, string, TenantTier, Guid?, string, CancellationToken, int?>(
                (tid, _, _, _, _, _, _, _) => capturedTenantId = tid)
            .Returns(Task.CompletedTask);

        repo.Setup(r => r.InsertWorkspaceAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        int tenantReadCount = 0;
        repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) =>
            {
                tenantReadCount++;

                if (tenantReadCount <= 5)
                {
                    return new TenantRecord { Id = id, Tier = TenantTier.Free };
                }

                return new TenantRecord
                {
                    Id = id,
                    Tier = TenantTier.Free,
                    OffboardedUtc = anchor,
                    ErasureEligibleUtc = anchor.AddDays(30),
                };
            });

        Mock<IArchitectureProjectRepository> projects = new();

        projects
            .Setup(p => p.InsertAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("admin@test");
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITenantSqlCatalogProvisioner> sqlCatalog = new();

        sqlCatalog
            .Setup(p => p.ProvisionTenantCatalogAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IDefaultPolicyPackSeeder> packSeeder = new();

        packSeeder
            .Setup(s =>
                s.EnsureDefaultPolicyPacksAsync(
                    It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<ITenantSettingsRepository> settings = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = DefaultProvisioningMonitor();

        TenantProvisioningService sut = new(
            repo.Object,
            projects.Object,
            actor.Object,
            audit.Object,
            NullLogger<TenantProvisioningService>.Instance,
            options.Object,
            sqlCatalog.Object,
            packSeeder.Object,
            new Mock<IMarketingAttributionService>().Object,
            settings.Object);

        TenantProvisioningRequest req = new()
        {
            Name = "Nav Settings Post Policy Pack Race Co",
            AdminEmail = "owner@race.example",
            Tier = TenantTier.Free,
        };

        TenantProvisioningResult result = await sut.ProvisionAsync(req, CancellationToken.None);

        result.WasAlreadyProvisioned.Should().BeFalse();
        result.TenantId.Should().Be(capturedTenantId);
        packSeeder.Verify(
            s => s.EnsureDefaultPolicyPacksAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Once);
        settings.Verify(
            s => s.UpsertAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ProvisionAsync_skips_nav_settings_when_offboard_completes_after_tenant_before_nav_settings_read_before_upsert()
    {
        Guid capturedTenantId = Guid.Empty;
        DateTimeOffset anchor = new(2026, 10, 22, 11, 0, 0, TimeSpan.Zero);

        Mock<ITenantRepository> repo = new();

        SetupSlugNotFound(repo);

        repo.Setup(r => r.InsertTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<TenantTier>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .Callback<Guid, string, string, TenantTier, Guid?, string, CancellationToken, int?>(
                (tid, _, _, _, _, _, _, _) => capturedTenantId = tid)
            .Returns(Task.CompletedTask);

        repo.Setup(r => r.InsertWorkspaceAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        int tenantReadCount = 0;
        repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) =>
            {
                tenantReadCount++;

                if (tenantReadCount <= 6)
                {
                    return new TenantRecord { Id = id, Tier = TenantTier.Free };
                }

                return new TenantRecord
                {
                    Id = id,
                    Tier = TenantTier.Free,
                    OffboardedUtc = anchor,
                    ErasureEligibleUtc = anchor.AddDays(30),
                };
            });

        Mock<IArchitectureProjectRepository> projects = new();

        projects
            .Setup(p => p.InsertAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("admin@test");
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITenantSqlCatalogProvisioner> sqlCatalog = new();

        sqlCatalog
            .Setup(p => p.ProvisionTenantCatalogAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IDefaultPolicyPackSeeder> packSeeder = new();

        packSeeder
            .Setup(s =>
                s.EnsureDefaultPolicyPacksAsync(
                    It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<ITenantSettingsRepository> settings = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = DefaultProvisioningMonitor();

        TenantProvisioningService sut = new(
            repo.Object,
            projects.Object,
            actor.Object,
            audit.Object,
            NullLogger<TenantProvisioningService>.Instance,
            options.Object,
            sqlCatalog.Object,
            packSeeder.Object,
            new Mock<IMarketingAttributionService>().Object,
            settings.Object);

        TenantProvisioningRequest req = new()
        {
            Name = "Nav Settings Pre Upsert Race Co",
            AdminEmail = "owner@race.example",
            Tier = TenantTier.Free,
        };

        TenantProvisioningResult result = await sut.ProvisionAsync(req, CancellationToken.None);

        result.WasAlreadyProvisioned.Should().BeFalse();
        result.TenantId.Should().Be(capturedTenantId);
        packSeeder.Verify(
            s => s.EnsureDefaultPolicyPacksAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Once);
        settings.Verify(
            s => s.UpsertAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ProvisionAsync_skips_first_touch_persist_when_offboard_completes_after_nav_settings_before_marketing()
    {
        Guid capturedTenantId = Guid.Empty;
        DateTimeOffset anchor = new(2026, 10, 21, 14, 0, 0, TimeSpan.Zero);
        MarketingAttributionSnapshot firstTouch = new()
        {
            UtmSource = "newsletter",
            CapturedUtc = anchor,
        };

        Mock<ITenantRepository> repo = new();

        SetupSlugNotFound(repo);

        repo.Setup(r => r.InsertTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<TenantTier>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .Callback<Guid, string, string, TenantTier, Guid?, string, CancellationToken, int?>(
                (tid, _, _, _, _, _, _, _) => capturedTenantId = tid)
            .Returns(Task.CompletedTask);

        repo.Setup(r => r.InsertWorkspaceAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        int tenantReadCount = 0;
        repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) =>
            {
                tenantReadCount++;

                if (tenantReadCount <= 7)
                {
                    return new TenantRecord { Id = id, Tier = TenantTier.Free };
                }

                return new TenantRecord
                {
                    Id = id,
                    Tier = TenantTier.Free,
                    OffboardedUtc = anchor,
                    ErasureEligibleUtc = anchor.AddDays(30),
                };
            });

        Mock<IArchitectureProjectRepository> projects = new();

        projects
            .Setup(p => p.InsertAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("admin@test");
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITenantSqlCatalogProvisioner> sqlCatalog = new();

        sqlCatalog
            .Setup(p => p.ProvisionTenantCatalogAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IDefaultPolicyPackSeeder> packSeeder = new();

        packSeeder
            .Setup(s =>
                s.EnsureDefaultPolicyPacksAsync(
                    It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<ITenantSettingsRepository> settings = new();

        settings
            .Setup(s => s.UpsertAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IMarketingAttributionService> marketing = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = DefaultProvisioningMonitor();

        TenantProvisioningService sut = new(
            repo.Object,
            projects.Object,
            actor.Object,
            audit.Object,
            NullLogger<TenantProvisioningService>.Instance,
            options.Object,
            sqlCatalog.Object,
            packSeeder.Object,
            marketing.Object,
            settings.Object);

        TenantProvisioningRequest req = new()
        {
            Name = "Marketing Post Nav Race Co",
            AdminEmail = "owner@race.example",
            Tier = TenantTier.Free,
            FirstTouch = firstTouch,
        };

        TenantProvisioningResult result = await sut.ProvisionAsync(req, CancellationToken.None);

        result.WasAlreadyProvisioned.Should().BeFalse();
        result.TenantId.Should().Be(capturedTenantId);
        settings.Verify(
            s => s.UpsertAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
        marketing.Verify(
            m => m.PersistFirstTouchIfPresentAsync(It.IsAny<Guid>(), It.IsAny<MarketingAttributionSnapshot>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ProvisionAsync_skips_first_touch_persist_when_offboard_completes_after_tenant_before_marketing_attribution_read_before_persist()
    {
        Guid capturedTenantId = Guid.Empty;
        DateTimeOffset anchor = new(2026, 10, 22, 12, 0, 0, TimeSpan.Zero);
        MarketingAttributionSnapshot firstTouch = new()
        {
            UtmSource = "newsletter",
            CapturedUtc = anchor,
        };

        Mock<ITenantRepository> repo = new();

        SetupSlugNotFound(repo);

        repo.Setup(r => r.InsertTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<TenantTier>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .Callback<Guid, string, string, TenantTier, Guid?, string, CancellationToken, int?>(
                (tid, _, _, _, _, _, _, _) => capturedTenantId = tid)
            .Returns(Task.CompletedTask);

        repo.Setup(r => r.InsertWorkspaceAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        int tenantReadCount = 0;
        repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) =>
            {
                tenantReadCount++;

                if (tenantReadCount <= 8)
                {
                    return new TenantRecord { Id = id, Tier = TenantTier.Free };
                }

                return new TenantRecord
                {
                    Id = id,
                    Tier = TenantTier.Free,
                    OffboardedUtc = anchor,
                    ErasureEligibleUtc = anchor.AddDays(30),
                };
            });

        Mock<IArchitectureProjectRepository> projects = new();

        projects
            .Setup(p => p.InsertAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("admin@test");
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITenantSqlCatalogProvisioner> sqlCatalog = new();

        sqlCatalog
            .Setup(p => p.ProvisionTenantCatalogAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IDefaultPolicyPackSeeder> packSeeder = new();

        packSeeder
            .Setup(s =>
                s.EnsureDefaultPolicyPacksAsync(
                    It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<ITenantSettingsRepository> settings = new();

        settings
            .Setup(s => s.UpsertAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IMarketingAttributionService> marketing = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = DefaultProvisioningMonitor();

        TenantProvisioningService sut = new(
            repo.Object,
            projects.Object,
            actor.Object,
            audit.Object,
            NullLogger<TenantProvisioningService>.Instance,
            options.Object,
            sqlCatalog.Object,
            packSeeder.Object,
            marketing.Object,
            settings.Object);

        TenantProvisioningRequest req = new()
        {
            Name = "Marketing Pre Persist Race Co",
            AdminEmail = "owner@race.example",
            Tier = TenantTier.Free,
            FirstTouch = firstTouch,
        };

        TenantProvisioningResult result = await sut.ProvisionAsync(req, CancellationToken.None);

        result.WasAlreadyProvisioned.Should().BeFalse();
        result.TenantId.Should().Be(capturedTenantId);
        settings.Verify(
            s => s.UpsertAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
        marketing.Verify(
            m => m.PersistFirstTouchIfPresentAsync(It.IsAny<Guid>(), It.IsAny<MarketingAttributionSnapshot>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ProvisionAsync_returns_without_platform_audit_when_offboard_completes_after_tenant_before_provisioned_audit_read_before_audit()
    {
        Guid capturedTenantId = Guid.Empty;
        DateTimeOffset anchor = new(2026, 10, 22, 8, 0, 0, TimeSpan.Zero);

        Mock<ITenantRepository> repo = new();

        SetupSlugNotFound(repo);

        repo.Setup(r => r.InsertTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<TenantTier>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .Callback<Guid, string, string, TenantTier, Guid?, string, CancellationToken, int?>(
                (tid, _, _, _, _, _, _, _) => capturedTenantId = tid)
            .Returns(Task.CompletedTask);

        repo.Setup(r => r.InsertWorkspaceAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        int tenantReadCount = 0;
        repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) =>
            {
                tenantReadCount++;

                if (tenantReadCount <= 9)
                {
                    return new TenantRecord { Id = id, Tier = TenantTier.Free };
                }

                return new TenantRecord
                {
                    Id = id,
                    Tier = TenantTier.Free,
                    OffboardedUtc = anchor,
                    ErasureEligibleUtc = anchor.AddDays(30),
                };
            });

        Mock<IArchitectureProjectRepository> projects = new();

        projects
            .Setup(p => p.InsertAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("admin@test");
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITenantSqlCatalogProvisioner> sqlCatalog = new();

        sqlCatalog
            .Setup(p => p.ProvisionTenantCatalogAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IDefaultPolicyPackSeeder> packSeeder = new();

        packSeeder
            .Setup(s =>
                s.EnsureDefaultPolicyPacksAsync(
                    It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<ITenantSettingsRepository> settings = new();

        settings
            .Setup(s => s.UpsertAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = DefaultProvisioningMonitor();

        TenantProvisioningService sut = new(
            repo.Object,
            projects.Object,
            actor.Object,
            audit.Object,
            NullLogger<TenantProvisioningService>.Instance,
            options.Object,
            sqlCatalog.Object,
            packSeeder.Object,
            new Mock<IMarketingAttributionService>().Object,
            settings.Object);

        TenantProvisioningRequest req = new()
        {
            Name = "Provisioned Audit Race Co",
            AdminEmail = "owner@race.example",
            Tier = TenantTier.Free,
        };

        TenantProvisioningResult result = await sut.ProvisionAsync(req, CancellationToken.None);

        result.WasAlreadyProvisioned.Should().BeFalse();
        result.TenantId.Should().Be(capturedTenantId);
        packSeeder.Verify(
            s => s.EnsureDefaultPolicyPacksAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Once);
        settings.Verify(
            s => s.UpsertAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ProvisionAsync_uses_audit_actor_override_when_set()
    {
        Mock<ITenantRepository> repo = new();

        SetupSlugNotFound(repo);

        repo.Setup(r => r.InsertTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<TenantTier>(),
                It.IsAny<Guid?>(),
                It.Is<string>(region => region == TenantDataRegions.Default),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .Returns(Task.CompletedTask);

        repo.Setup(r => r.InsertWorkspaceAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IArchitectureProjectRepository> projects = new();

        projects
            .Setup(p => p.InsertAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("admin@test");
        Mock<IAuditService> audit = new();
        Mock<ITenantSqlCatalogProvisioner> sqlCatalog = new();

        sqlCatalog
            .Setup(p => p.ProvisionTenantCatalogAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IDefaultPolicyPackSeeder> packSeeder = new();

        packSeeder
            .Setup(s =>
                s.EnsureDefaultPolicyPacksAsync(
                    It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = DefaultProvisioningMonitor();

        TenantProvisioningService sut = new(
            repo.Object,
            projects.Object,
            actor.Object,
            audit.Object,
            NullLogger<TenantProvisioningService>.Instance,
            options.Object,
            sqlCatalog.Object,
            packSeeder.Object,
            new Mock<IMarketingAttributionService>().Object,
            new Mock<ITenantSettingsRepository>().Object);

        TenantProvisioningRequest req = new()
        {
            Name = "Override Co",
            AdminEmail = "owner@override.example",
            Tier = TenantTier.Free,
            AuditActorOverride = "self-service@override.example",
        };

        await sut.ProvisionAsync(req, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.ActorUserId == "self-service@override.example"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task ProvisionAsync_trims_actor_context_actor_on_tenant_provisioned_audit()
    {
        Mock<ITenantRepository> repo = new();

        SetupSlugNotFound(repo);

        repo.Setup(r => r.InsertTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<TenantTier>(),
                It.IsAny<Guid?>(),
                It.Is<string>(region => region == TenantDataRegions.Default),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .Returns(Task.CompletedTask);

        repo.Setup(r => r.InsertWorkspaceAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IArchitectureProjectRepository> projects = new();

        projects
            .Setup(p => p.InsertAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("  admin@test  ");
        Mock<IAuditService> audit = new();
        Mock<ITenantSqlCatalogProvisioner> sqlCatalog = new();

        sqlCatalog
            .Setup(p => p.ProvisionTenantCatalogAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IDefaultPolicyPackSeeder> packSeeder = new();

        packSeeder
            .Setup(s =>
                s.EnsureDefaultPolicyPacksAsync(
                    It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = DefaultProvisioningMonitor();

        TenantProvisioningService sut = new(
            repo.Object,
            projects.Object,
            actor.Object,
            audit.Object,
            NullLogger<TenantProvisioningService>.Instance,
            options.Object,
            sqlCatalog.Object,
            packSeeder.Object,
            new Mock<IMarketingAttributionService>().Object,
            new Mock<ITenantSettingsRepository>().Object);

        TenantProvisioningRequest req = new()
        {
            Name = "Trim Actor Co",
            AdminEmail = "owner@trim.example",
            Tier = TenantTier.Free,
        };

        await sut.ProvisionAsync(req, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.ActorUserId == "admin@test"
                    && e.ActorUserName == "admin@test"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task ProvisionAsync_trims_admin_email_in_tenant_provisioned_audit_payload()
    {
        Mock<ITenantRepository> repo = new();

        SetupSlugNotFound(repo);

        repo.Setup(r => r.InsertTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<TenantTier>(),
                It.IsAny<Guid?>(),
                It.Is<string>(region => region == TenantDataRegions.Default),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .Returns(Task.CompletedTask);

        repo.Setup(r => r.InsertWorkspaceAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IArchitectureProjectRepository> projects = new();

        projects
            .Setup(p => p.InsertAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("admin@test");
        AuditEvent? captured = null;
        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((e, _) => captured = e)
            .Returns(Task.CompletedTask);

        Mock<ITenantSqlCatalogProvisioner> sqlCatalog = new();

        sqlCatalog
            .Setup(p => p.ProvisionTenantCatalogAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IDefaultPolicyPackSeeder> packSeeder = new();

        packSeeder
            .Setup(s =>
                s.EnsureDefaultPolicyPacksAsync(
                    It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = DefaultProvisioningMonitor();

        TenantProvisioningService sut = new(
            repo.Object,
            projects.Object,
            actor.Object,
            audit.Object,
            NullLogger<TenantProvisioningService>.Instance,
            options.Object,
            sqlCatalog.Object,
            packSeeder.Object,
            new Mock<IMarketingAttributionService>().Object,
            new Mock<ITenantSettingsRepository>().Object);

        TenantProvisioningRequest req = new()
        {
            Name = "Padded Email Co",
            AdminEmail = "  owner@padded.example  ",
            Tier = TenantTier.Free,
        };

        await sut.ProvisionAsync(req, CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.DataJson.Should().Contain("\"adminEmail\":\"owner@padded.example\"");
        captured.DataJson.Should().NotContain("  owner@padded.example  ");
    }

    [SkippableFact]
    public async Task ProvisionAsync_passes_entra_tenant_id_to_repository()
    {
        Guid entraTenantId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        Mock<ITenantRepository> repo = new();

        SetupSlugNotFound(repo);

        repo.Setup(r => r.InsertTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<TenantTier>(),
                It.Is<Guid?>(g => g == entraTenantId),
                It.Is<string>(region => region == TenantDataRegions.Default),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .Returns(Task.CompletedTask)
            .Verifiable();

        repo.Setup(r => r.InsertWorkspaceAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IArchitectureProjectRepository> projects = new();

        projects
            .Setup(p => p.InsertAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("admin@test");
        Mock<IAuditService> audit = new();

        Mock<ITenantSqlCatalogProvisioner> sqlCatalog = new();

        sqlCatalog
            .Setup(p => p.ProvisionTenantCatalogAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IDefaultPolicyPackSeeder> packSeeder = new();

        packSeeder
            .Setup(s =>
                s.EnsureDefaultPolicyPacksAsync(
                    It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = DefaultProvisioningMonitor();

        TenantProvisioningService sut = new(
            repo.Object,
            projects.Object,
            actor.Object,
            audit.Object,
            NullLogger<TenantProvisioningService>.Instance,
            options.Object,
            sqlCatalog.Object,
            packSeeder.Object,
            new Mock<IMarketingAttributionService>().Object,
            new Mock<ITenantSettingsRepository>().Object);

        TenantProvisioningRequest req = new()
        {
            Name = "Entra Linked Org",
            AdminEmail = "admin@entra.example",
            Tier = TenantTier.Enterprise,
            EntraTenantId = entraTenantId,
        };

        await sut.ProvisionAsync(req, CancellationToken.None);

        repo.Verify();
    }
}
