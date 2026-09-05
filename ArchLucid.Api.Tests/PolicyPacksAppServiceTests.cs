using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Host.Core.Services;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Interfaces;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Policy Packs App Service.
/// </summary>
[Trait("Category", "Unit")]
public sealed class PolicyPacksAppServiceTests
{
    [SkippableFact]
    public async Task CreatePackAsync_WhenManagementSucceeds_AuditsCreated()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        PolicyPack returned = new()
        {
            PolicyPackId = Guid.NewGuid(), Name = "pack-a", PackType = PolicyPackType.BuiltIn
        };

        Mock<IPolicyPackManagementService> management = new();
        management
            .Setup(x => x.CreatePackAsync(
                tenantId,
                workspaceId,
                projectId,
                "n",
                "d",
                PolicyPackType.BuiltIn,
                "{}",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(returned);

        Mock<IAuditService> audit = new();
        audit.Setup(x => x.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        PolicyPacksAppService sut = CreateSut(management.Object, audit: audit.Object);

        PolicyPack result = await sut.CreatePackAsync(tenantId, workspaceId, projectId, "n", "d",
            PolicyPackType.BuiltIn, "{}", CancellationToken.None);

        result.Should().BeSameAs(returned);
        audit.Verify(
            x => x.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.PolicyPackCreated),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task TryAssignAsync_WhenVersionMissing_ReturnsNullWithoutAssignOrAudit()
    {
        Guid packId = Guid.NewGuid();
        Mock<IPolicyPackVersionRepository> versions = new();
        versions
            .Setup(x => x.GetByPackAndVersionAsync(packId, "1.0.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyPackVersion?)null);

        Mock<IPolicyPackManagementService> management = new(MockBehavior.Strict);
        Mock<IAuditService> audit = new(MockBehavior.Strict);

        PolicyPacksAppService sut = CreateSut(management.Object, versions: versions.Object, audit: audit.Object);

        PolicyPackAssignment? result = await sut.TryAssignAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            packId,
            "1.0.0",
            "workspace",
            false,
            false,
            CancellationToken.None);

        result.Should().BeNull();
        management.Verify(
            x => x.AssignAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task TryArchiveAssignmentAsync_WhenManagementReturnsTrue_AuditsArchived()
    {
        Guid tenantId = Guid.NewGuid();
        Guid assignmentId = Guid.NewGuid();

        Mock<IPolicyPackManagementService> management = new();
        management
            .Setup(x => x.TryArchiveAssignmentAsync(tenantId, assignmentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IAuditService> audit = new();
        audit.Setup(x => x.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        PolicyPacksAppService sut = CreateSut(management.Object, audit: audit.Object);

        bool ok = await sut.TryArchiveAssignmentAsync(tenantId, assignmentId, CancellationToken.None);

        ok.Should().BeTrue();
        audit.Verify(
            x => x.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.PolicyPackAssignmentArchived),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task PublishVersionAsync_WhenPackIsPlatformDefault_ThrowsBeforeManagement()
    {
        Guid packId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(p => p.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPack { PolicyPackId = packId, PackType = PolicyPackType.PlatformDefault, Name = "Seeded", });

        Mock<IPolicyPackManagementService> management = new(MockBehavior.Strict);
        Mock<IAuditService> audit = new(MockBehavior.Strict);

        PolicyPacksAppService sut = CreateSut(management.Object, packs: packs.Object, audit: audit.Object);

        Func<Task> act = async () => await sut.PublishVersionAsync(packId, "1.0.0", "{}", CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*Platform-default*");
        management.Verify(
            x => x.PublishVersionAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task TryDuplicatePackAsync_loads_content_via_get_after_list_omits_body()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid packId = Guid.NewGuid();
        const string body = """{"complianceRuleKeys":["a"]}""";

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(p => p.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPack
                {
                    PolicyPackId = packId,
                    TenantId = tenantId,
                    Name = "Source",
                    Description = "d",
                    PackType = PolicyPackType.ProjectCustom,
                    IsDeleted = false,
                });

        Mock<IPolicyPackVersionRepository> versions = new();
        versions
            .Setup(v => v.ListByPackAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new PolicyPackVersion
                {
                    PolicyPackId = packId,
                    Version = "1.2.0",
                    ContentJson = string.Empty,
                    IsPublished = true,
                },
            ]);
        versions
            .Setup(v => v.GetByPackAndVersionAsync(packId, "1.2.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPackVersion
                {
                    PolicyPackId = packId,
                    Version = "1.2.0",
                    ContentJson = body,
                    IsPublished = true,
                });

        PolicyPack created = new() { PolicyPackId = Guid.NewGuid(), Name = "Source (Copy)" };
        Mock<IPolicyPackManagementService> management = new();
        management
            .Setup(m => m.CreatePackAsync(
                tenantId,
                workspaceId,
                projectId,
                "Source (Copy)",
                "d",
                PolicyPackType.ProjectCustom,
                body,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(created);

        Mock<IAuditService> audit = new();
        audit.Setup(x => x.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        PolicyPacksAppService sut = CreateSut(management.Object, packs: packs.Object, versions: versions.Object, audit: audit.Object);

        PolicyPack? result = await sut.TryDuplicatePackAsync(tenantId, workspaceId, projectId, packId, CancellationToken.None);

        result.Should().BeSameAs(created);
        versions.Verify(v => v.GetByPackAndVersionAsync(packId, "1.2.0", It.IsAny<CancellationToken>()), Times.Once);
        management.Verify(
            m => m.CreatePackAsync(
                tenantId,
                workspaceId,
                projectId,
                "Source (Copy)",
                "d",
                PolicyPackType.ProjectCustom,
                body,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static PolicyPacksAppService CreateSut(
        IPolicyPackManagementService management,
        IPolicyPackRepository? packs = null,
        IPolicyPackVersionRepository? versions = null,
        IAuditService? audit = null) =>
        new(
            management,
            packs ?? Mock.Of<IPolicyPackRepository>(),
            versions ?? Mock.Of<IPolicyPackVersionRepository>(),
            audit ?? Mock.Of<IAuditService>(),
            Mock.Of<IIntegrationEventOutboxRepository>(),
            Mock.Of<IIntegrationEventPublisher>(),
            CreateIntegrationEventsOptionsMonitor(),
            NullLogger<PolicyPacksAppService>.Instance);

    private static IOptionsMonitor<IntegrationEventsOptions> CreateIntegrationEventsOptionsMonitor()
    {
        Mock<IOptionsMonitor<IntegrationEventsOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new IntegrationEventsOptions());

        return options.Object;
    }
}
