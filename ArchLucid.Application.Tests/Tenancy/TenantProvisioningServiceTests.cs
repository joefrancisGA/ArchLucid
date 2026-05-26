using ArchLucid.Application.Common;
using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Application.Marketing;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TenantProvisioningServiceTests
{
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
            new Mock<IMarketingAttributionService>().Object);

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
    public async Task ProvisionAsync_rejects_unknown_data_region_when_configured_allowlist_strict()
    {
        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.GetBySlugAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync((TenantRecord?)null);

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
            new Mock<IMarketingAttributionService>().Object);

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

        TenantProvisioningService sut = new(
            repo,
            projects,
            actor.Object,
            audit.Object,
            NullLogger<TenantProvisioningService>.Instance,
            options.Object,
            sqlCatalog.Object,
            packSeeder.Object,
            new Mock<IMarketingAttributionService>().Object);

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
    public async Task ProvisionAsync_uses_audit_actor_override_when_set()
    {
        Mock<ITenantRepository> repo = new();

        repo.Setup(r => r.GetBySlugAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

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
            new Mock<IMarketingAttributionService>().Object);

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
    public async Task ProvisionAsync_passes_entra_tenant_id_to_repository()
    {
        Guid entraTenantId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        Mock<ITenantRepository> repo = new();

        repo.Setup(r => r.GetBySlugAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

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
            new Mock<IMarketingAttributionService>().Object);

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
