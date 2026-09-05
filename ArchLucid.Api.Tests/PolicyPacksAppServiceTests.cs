using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Persistence.Ports;
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
    public async Task CreatePackAsync_returns_existing_pack_and_skips_duplicate_audit_on_identical_operator_retry()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid existingPackId = Guid.NewGuid();
        const string body = """{"complianceRuleKeys":["a"]}""";

        PolicyPack existingPack = new()
        {
            PolicyPackId = existingPackId,
            TenantId = tenantId,
            Name = "pack-a",
            Description = "d",
            PackType = PolicyPackType.ProjectCustom,
            IsDeleted = false,
            CurrentVersion = "1.0.0",
        };

        PolicyPack created = new()
        {
            PolicyPackId = Guid.NewGuid(),
            Name = "pack-a",
            PackType = PolicyPackType.ProjectCustom,
        };

        Mock<IPolicyPackRepository> packs = new();
        packs
            .SetupSequence(p => p.ListByScopeAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<PolicyPack>())
            .ReturnsAsync(new[] { existingPack });

        Mock<IPolicyPackVersionRepository> versions = new();
        versions
            .Setup(v => v.GetByPackAndVersionAsync(existingPackId, "1.0.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPackVersion
                {
                    PolicyPackId = existingPackId,
                    Version = "1.0.0",
                    ContentJson = body,
                });

        Mock<IPolicyPackManagementService> management = new();
        management
            .Setup(m => m.CreatePackAsync(
                tenantId,
                workspaceId,
                projectId,
                "pack-a",
                "d",
                PolicyPackType.ProjectCustom,
                body,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(created);

        Mock<IAuditService> audit = new();
        audit.Setup(x => x.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        PolicyPacksAppService sut = CreateSut(management.Object, packs: packs.Object, versions: versions.Object, audit: audit.Object);

        PolicyPack first = await sut.CreatePackAsync(
            tenantId,
            workspaceId,
            projectId,
            "pack-a",
            "d",
            PolicyPackType.ProjectCustom,
            body,
            CancellationToken.None);
        PolicyPack second = await sut.CreatePackAsync(
            tenantId,
            workspaceId,
            projectId,
            "pack-a",
            "d",
            PolicyPackType.ProjectCustom,
            body,
            CancellationToken.None);

        first.Should().BeSameAs(created);
        second.Should().BeSameAs(existingPack);
        management.Verify(
            m => m.CreatePackAsync(
                tenantId,
                workspaceId,
                projectId,
                "pack-a",
                "d",
                PolicyPackType.ProjectCustom,
                body,
                It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            x => x.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.PolicyPackCreated),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task CreatePackAsync_returns_existing_pack_and_skips_duplicate_audit_when_description_differs_only_by_casing()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid existingPackId = Guid.NewGuid();
        const string body = """{"complianceRuleKeys":["a"]}""";

        PolicyPack existingPack = new()
        {
            PolicyPackId = existingPackId,
            TenantId = tenantId,
            Name = "pack-a",
            Description = "My description",
            PackType = PolicyPackType.ProjectCustom,
            IsDeleted = false,
            CurrentVersion = "1.0.0",
        };

        PolicyPack created = new()
        {
            PolicyPackId = Guid.NewGuid(),
            Name = "pack-a",
            PackType = PolicyPackType.ProjectCustom,
        };

        Mock<IPolicyPackRepository> packs = new();
        packs
            .SetupSequence(p => p.ListByScopeAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<PolicyPack>())
            .ReturnsAsync(new[] { existingPack });

        Mock<IPolicyPackVersionRepository> versions = new();
        versions
            .Setup(v => v.GetByPackAndVersionAsync(existingPackId, "1.0.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPackVersion
                {
                    PolicyPackId = existingPackId,
                    Version = "1.0.0",
                    ContentJson = body,
                });

        Mock<IPolicyPackManagementService> management = new();
        management
            .Setup(m => m.CreatePackAsync(
                tenantId,
                workspaceId,
                projectId,
                "pack-a",
                "My description",
                PolicyPackType.ProjectCustom,
                body,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(created);

        Mock<IAuditService> audit = new();
        audit.Setup(x => x.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        PolicyPacksAppService sut = CreateSut(management.Object, packs: packs.Object, versions: versions.Object, audit: audit.Object);

        await sut.CreatePackAsync(
            tenantId,
            workspaceId,
            projectId,
            "pack-a",
            "My description",
            PolicyPackType.ProjectCustom,
            body,
            CancellationToken.None);
        PolicyPack second = await sut.CreatePackAsync(
            tenantId,
            workspaceId,
            projectId,
            "pack-a",
            "my description",
            PolicyPackType.ProjectCustom,
            body,
            CancellationToken.None);

        second.Should().BeSameAs(existingPack);
        management.Verify(
            m => m.CreatePackAsync(
                tenantId,
                workspaceId,
                projectId,
                "pack-a",
                It.IsAny<string>(),
                PolicyPackType.ProjectCustom,
                body,
                It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            x => x.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.PolicyPackCreated),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task CreatePackAsync_returns_existing_pack_and_skips_duplicate_audit_when_name_differs_only_by_casing()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid existingPackId = Guid.NewGuid();
        const string body = """{"complianceRuleKeys":["a"]}""";

        PolicyPack existingPack = new()
        {
            PolicyPackId = existingPackId,
            TenantId = tenantId,
            Name = "pack-a",
            Description = "d",
            PackType = PolicyPackType.ProjectCustom,
            IsDeleted = false,
            CurrentVersion = "1.0.0",
        };

        PolicyPack created = new()
        {
            PolicyPackId = Guid.NewGuid(),
            Name = "pack-a",
            PackType = PolicyPackType.ProjectCustom,
        };

        Mock<IPolicyPackRepository> packs = new();
        packs
            .SetupSequence(p => p.ListByScopeAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<PolicyPack>())
            .ReturnsAsync(new[] { existingPack });

        Mock<IPolicyPackVersionRepository> versions = new();
        versions
            .Setup(v => v.GetByPackAndVersionAsync(existingPackId, "1.0.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPackVersion
                {
                    PolicyPackId = existingPackId,
                    Version = "1.0.0",
                    ContentJson = body,
                });

        Mock<IPolicyPackManagementService> management = new();
        management
            .Setup(m => m.CreatePackAsync(
                tenantId,
                workspaceId,
                projectId,
                "pack-a",
                "d",
                PolicyPackType.ProjectCustom,
                body,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(created);

        Mock<IAuditService> audit = new();
        audit.Setup(x => x.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        PolicyPacksAppService sut = CreateSut(management.Object, packs: packs.Object, versions: versions.Object, audit: audit.Object);

        await sut.CreatePackAsync(
            tenantId,
            workspaceId,
            projectId,
            "pack-a",
            "d",
            PolicyPackType.ProjectCustom,
            body,
            CancellationToken.None);
        PolicyPack second = await sut.CreatePackAsync(
            tenantId,
            workspaceId,
            projectId,
            "PACK-A",
            "d",
            PolicyPackType.ProjectCustom,
            body,
            CancellationToken.None);

        second.Should().BeSameAs(existingPack);
        management.Verify(
            m => m.CreatePackAsync(
                tenantId,
                workspaceId,
                projectId,
                It.IsAny<string>(),
                "d",
                PolicyPackType.ProjectCustom,
                body,
                It.IsAny<CancellationToken>()),
            Times.Once);
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
    public async Task TryAssignAsync_skips_duplicate_audit_when_identical_operator_retry()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid packId = Guid.NewGuid();
        Guid assignmentId = Guid.NewGuid();
        PolicyPackAssignment assignment = new()
        {
            AssignmentId = assignmentId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            PolicyPackId = packId,
            PolicyPackVersion = "1.0.0",
            ScopeLevel = GovernanceScopeLevel.Project,
            IsPinned = false,
            IsOrganizationRequired = false,
            IsEnabled = true,
        };

        Mock<IPolicyPackVersionRepository> versions = new();
        versions
            .Setup(v => v.GetByPackAndVersionAsync(packId, "1.0.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackVersion { PolicyPackId = packId, Version = "1.0.0" });

        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .SetupSequence(a => a.ListByScopeAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<PolicyPackAssignment>())
            .ReturnsAsync(new[] { assignment });

        Mock<IPolicyPackManagementService> management = new();
        management
            .Setup(m => m.AssignAsync(
                tenantId,
                workspaceId,
                projectId,
                packId,
                "1.0.0",
                GovernanceScopeLevel.Project,
                false,
                false,
                true,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(assignment);

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        PolicyPacksAppService sut = CreateSut(
            management.Object,
            versions: versions.Object,
            assignments: assignments.Object,
            audit: audit.Object);

        await sut.TryAssignAsync(
            tenantId,
            workspaceId,
            projectId,
            packId,
            "1.0.0",
            GovernanceScopeLevel.Project,
            false,
            false,
            CancellationToken.None);
        await sut.TryAssignAsync(
            tenantId,
            workspaceId,
            projectId,
            packId,
            "1.0.0",
            GovernanceScopeLevel.Project,
            false,
            false,
            CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.PolicyPackAssignmentCreated),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task TryArchiveAssignmentAsync_skips_duplicate_audit_when_already_archived_retry()
    {
        Guid tenantId = Guid.NewGuid();
        Guid assignmentId = Guid.NewGuid();
        PolicyPackAssignment archived = new()
        {
            AssignmentId = assignmentId,
            TenantId = tenantId,
            ArchivedUtc = DateTime.UtcNow.AddDays(-1),
        };

        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .SetupSequence(a => a.GetByTenantAndAssignmentIdAsync(tenantId, assignmentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyPackAssignment?)null)
            .ReturnsAsync(archived);

        Mock<IPolicyPackManagementService> management = new();
        management
            .Setup(m => m.TryArchiveAssignmentAsync(tenantId, assignmentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        PolicyPacksAppService sut = CreateSut(management.Object, assignments: assignments.Object, audit: audit.Object);

        await sut.TryArchiveAssignmentAsync(tenantId, assignmentId, CancellationToken.None);
        await sut.TryArchiveAssignmentAsync(tenantId, assignmentId, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.PolicyPackAssignmentArchived),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task TrySoftDeletePackAsync_skips_duplicate_audit_when_pack_already_deleted_retry()
    {
        Guid tenantId = Guid.NewGuid();
        Guid packId = Guid.NewGuid();
        PolicyPack deletedPack = new()
        {
            PolicyPackId = packId,
            TenantId = tenantId,
            Name = "retired",
            IsDeleted = true,
            Status = PolicyPackStatus.Retired,
        };

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(p => p.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(deletedPack);

        Mock<IPolicyPackManagementService> management = new(MockBehavior.Strict);
        Mock<IAuditService> audit = new(MockBehavior.Strict);

        PolicyPacksAppService sut = CreateSut(management.Object, packs: packs.Object, audit: audit.Object);

        bool ok = await sut.TrySoftDeletePackAsync(tenantId, packId, CancellationToken.None);

        ok.Should().BeTrue();
        packs.Verify(p => p.UpdateAsync(It.IsAny<PolicyPack>(), It.IsAny<CancellationToken>()), Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
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
    public async Task PublishVersionAsync_skips_duplicate_audit_when_identical_operator_retry()
    {
        Guid packId = Guid.NewGuid();
        const string version = "1.0.0";
        const string contentJson = """{"rules":["a"]}""";

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(p => p.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPack
                {
                    PolicyPackId = packId,
                    TenantId = Guid.NewGuid(),
                    PackType = PolicyPackType.ProjectCustom,
                    CurrentVersion = version,
                    Status = PolicyPackStatus.Active,
                });

        PolicyPackVersion published = new()
        {
            PolicyPackId = packId,
            Version = version,
            ContentJson = contentJson,
            IsPublished = true,
        };

        Mock<IPolicyPackVersionRepository> versions = new();
        versions
            .SetupSequence(v => v.GetByPackAndVersionAsync(packId, version, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyPackVersion?)null)
            .ReturnsAsync(published);

        Mock<IPolicyPackManagementService> management = new();
        management
            .Setup(m => m.PublishVersionAsync(packId, version, contentJson, It.IsAny<CancellationToken>()))
            .ReturnsAsync(published);

        Mock<IAuditService> audit = new();
        audit.Setup(x => x.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        PolicyPacksAppService sut = CreateSut(management.Object, packs: packs.Object, versions: versions.Object, audit: audit.Object);

        await sut.PublishVersionAsync(packId, version, contentJson, CancellationToken.None);
        await sut.PublishVersionAsync(packId, version, contentJson, CancellationToken.None);

        audit.Verify(
            x => x.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.PolicyPackVersionPublished),
                It.IsAny<CancellationToken>()),
            Times.Once);
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

    [SkippableFact]
    public async Task TryDuplicatePackAsync_returns_existing_copy_and_skips_duplicate_audit_on_identical_operator_retry()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid packId = Guid.NewGuid();
        Guid existingCopyId = Guid.NewGuid();
        const string body = """{"complianceRuleKeys":["a"]}""";

        PolicyPack sourcePack = new()
        {
            PolicyPackId = packId,
            TenantId = tenantId,
            Name = "Source",
            Description = "d",
            PackType = PolicyPackType.ProjectCustom,
            IsDeleted = false,
            CurrentVersion = "1.2.0",
        };

        PolicyPack existingCopy = new()
        {
            PolicyPackId = existingCopyId,
            TenantId = tenantId,
            Name = "Source (Copy)",
            Description = "d",
            PackType = PolicyPackType.ProjectCustom,
            IsDeleted = false,
            CurrentVersion = "1.0.0",
        };

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(p => p.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(sourcePack);
        packs
            .SetupSequence(p => p.ListByScopeAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<PolicyPack>())
            .ReturnsAsync(new[] { existingCopy });

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
        versions
            .Setup(v => v.GetByPackAndVersionAsync(existingCopyId, "1.0.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPackVersion
                {
                    PolicyPackId = existingCopyId,
                    Version = "1.0.0",
                    ContentJson = body,
                    IsPublished = false,
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

        PolicyPack? first = await sut.TryDuplicatePackAsync(tenantId, workspaceId, projectId, packId, CancellationToken.None);
        PolicyPack? second = await sut.TryDuplicatePackAsync(tenantId, workspaceId, projectId, packId, CancellationToken.None);

        first.Should().BeSameAs(created);
        second.Should().BeSameAs(existingCopy);
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
        audit.Verify(
            x => x.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.PolicyPackDuplicated),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task TryDuplicatePackAsync_returns_existing_copy_and_skips_duplicate_audit_when_copy_name_differs_only_by_casing()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid packId = Guid.NewGuid();
        Guid existingCopyId = Guid.NewGuid();
        const string body = """{"complianceRuleKeys":["a"]}""";

        PolicyPack sourcePack = new()
        {
            PolicyPackId = packId,
            TenantId = tenantId,
            Name = "Source",
            Description = "d",
            PackType = PolicyPackType.ProjectCustom,
            IsDeleted = false,
            CurrentVersion = "1.2.0",
        };

        PolicyPack existingCopy = new()
        {
            PolicyPackId = existingCopyId,
            TenantId = tenantId,
            Name = "source (copy)",
            Description = "d",
            PackType = PolicyPackType.ProjectCustom,
            IsDeleted = false,
            CurrentVersion = "1.0.0",
        };

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(p => p.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(sourcePack);
        packs
            .Setup(p => p.ListByScopeAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { existingCopy });

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
        versions
            .Setup(v => v.GetByPackAndVersionAsync(existingCopyId, "1.0.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPackVersion
                {
                    PolicyPackId = existingCopyId,
                    Version = "1.0.0",
                    ContentJson = body,
                    IsPublished = false,
                });

        Mock<IPolicyPackManagementService> management = new(MockBehavior.Strict);
        Mock<IAuditService> audit = new(MockBehavior.Strict);

        PolicyPacksAppService sut = CreateSut(management.Object, packs: packs.Object, versions: versions.Object, audit: audit.Object);

        PolicyPack? result = await sut.TryDuplicatePackAsync(tenantId, workspaceId, projectId, packId, CancellationToken.None);

        result.Should().BeSameAs(existingCopy);
        management.Verify(
            m => m.CreatePackAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            x => x.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.PolicyPackDuplicated),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task TryDuplicatePackAsync_returns_existing_copy_and_skips_duplicate_audit_when_description_differs_only_by_casing()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid packId = Guid.NewGuid();
        Guid existingCopyId = Guid.NewGuid();
        const string body = """{"complianceRuleKeys":["a"]}""";

        PolicyPack sourcePack = new()
        {
            PolicyPackId = packId,
            TenantId = tenantId,
            Name = "Source",
            Description = "Baseline Pack",
            PackType = PolicyPackType.ProjectCustom,
            IsDeleted = false,
            CurrentVersion = "1.2.0",
        };

        PolicyPack existingCopy = new()
        {
            PolicyPackId = existingCopyId,
            TenantId = tenantId,
            Name = "Source (Copy)",
            Description = "baseline pack",
            PackType = PolicyPackType.ProjectCustom,
            IsDeleted = false,
            CurrentVersion = "1.0.0",
        };

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(p => p.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(sourcePack);
        packs
            .Setup(p => p.ListByScopeAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { existingCopy });

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
        versions
            .Setup(v => v.GetByPackAndVersionAsync(existingCopyId, "1.0.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPackVersion
                {
                    PolicyPackId = existingCopyId,
                    Version = "1.0.0",
                    ContentJson = body,
                    IsPublished = false,
                });

        Mock<IPolicyPackManagementService> management = new(MockBehavior.Strict);
        Mock<IAuditService> audit = new(MockBehavior.Strict);

        PolicyPacksAppService sut = CreateSut(management.Object, packs: packs.Object, versions: versions.Object, audit: audit.Object);

        PolicyPack? result = await sut.TryDuplicatePackAsync(tenantId, workspaceId, projectId, packId, CancellationToken.None);

        result.Should().BeSameAs(existingCopy);
        management.Verify(
            m => m.CreatePackAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            x => x.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.PolicyPackDuplicated),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static PolicyPacksAppService CreateSut(
        IPolicyPackManagementService management,
        IPolicyPackRepository? packs = null,
        IPolicyPackVersionRepository? versions = null,
        IPolicyPackAssignmentRepository? assignments = null,
        IAuditService? audit = null) =>
        new(
            management,
            packs ?? Mock.Of<IPolicyPackRepository>(),
            versions ?? Mock.Of<IPolicyPackVersionRepository>(),
            assignments ?? Mock.Of<IPolicyPackAssignmentRepository>(),
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
