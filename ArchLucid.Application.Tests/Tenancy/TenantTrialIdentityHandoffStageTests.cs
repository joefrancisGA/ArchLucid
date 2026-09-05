using ArchLucid.Application.Tenancy;
using ArchLucid.Application.Tenancy.Trial;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class TenantTrialIdentityHandoffStageTests
{
    [Fact]
    public async Task LinkEntraAsync_when_local_identity_link_fails_leaves_entra_bound_for_idempotent_retry()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid entraTenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        const string normalizedEmail = "ADMIN@CUSTOMER.COM";

        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "home",
            Slug = "home",
            Tier = TenantTier.Standard,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialStatus = TrialLifecycleStatus.Converted,
        };

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.UpdateEntraTenantIdAsync(tenantId, entraTenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<ITrialIdentityUserRepository> trialUsers = new();
        trialUsers
            .Setup(r => r.TryLinkLocalIdentityToEntraAsync(normalizedEmail, "oid-home", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        Mock<IAuditService> audit = new();

        TenantTrialIdentityHandoffStage sut = new(tenants.Object, trialUsers.Object, audit.Object);

        TenantTrialLinkEntraResult first = await sut.LinkEntraAsync(
            new TenantTrialLinkEntraBody
            {
                EntraTenantId = entraTenantId,
                LocalEmail = "admin@customer.com",
                EntraOid = "oid-home",
            },
            tenant,
            scope,
            "admin",
            normalizedEmail,
            hasIdentityPayload: true,
            CancellationToken.None);

        first.Outcome.Should().Be(TenantTrialHttpOutcome.Conflict);

        trialUsers
            .Setup(r => r.TryLinkLocalIdentityToEntraAsync(normalizedEmail, "oid-home", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        TenantTrialLinkEntraResult retry = await sut.LinkEntraAsync(
            new TenantTrialLinkEntraBody
            {
                EntraTenantId = entraTenantId,
                LocalEmail = "admin@customer.com",
                EntraOid = "oid-home",
            },
            new TenantRecord
            {
                Id = tenant.Id,
                Name = tenant.Name,
                Slug = tenant.Slug,
                Tier = tenant.Tier,
                CreatedUtc = tenant.CreatedUtc,
                TrialStatus = tenant.TrialStatus,
                EntraTenantId = entraTenantId,
            },
            scope,
            "admin",
            normalizedEmail,
            hasIdentityPayload: true,
            CancellationToken.None);

        retry.Outcome.Should().Be(TenantTrialHttpOutcome.Success);
        tenants.Verify(
            t => t.UpdateEntraTenantIdAsync(tenantId, entraTenantId, It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    [Fact]
    public async Task LinkEntraAsync_skips_duplicate_directory_bound_audit_when_already_bound_retry()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid entraTenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "home",
            Slug = "home",
            Tier = TenantTier.Standard,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialStatus = TrialLifecycleStatus.Converted,
            EntraTenantId = entraTenantId,
        };

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.UpdateEntraTenantIdAsync(tenantId, entraTenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantTrialIdentityHandoffStage sut = new(tenants.Object, Mock.Of<ITrialIdentityUserRepository>(), audit.Object);

        TenantTrialLinkEntraResult result = await sut.LinkEntraAsync(
            new TenantTrialLinkEntraBody { EntraTenantId = entraTenantId },
            tenant,
            scope,
            "admin",
            normalizedLocalEmail: null,
            hasIdentityPayload: false,
            CancellationToken.None);

        result.Outcome.Should().Be(TenantTrialHttpOutcome.Success);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.TenantEntraDirectoryBound),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task LinkEntraAsync_skips_duplicate_local_identity_linked_audit_when_already_linked_retry()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid entraTenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        const string normalizedEmail = "ADMIN@CUSTOMER.COM";

        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "home",
            Slug = "home",
            Tier = TenantTier.Standard,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialStatus = TrialLifecycleStatus.Converted,
            EntraTenantId = entraTenantId,
        };

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.UpdateEntraTenantIdAsync(tenantId, entraTenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<ITrialIdentityUserRepository> trialUsers = new();
        trialUsers
            .Setup(r => r.GetByNormalizedEmailAsync(normalizedEmail, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TrialIdentityUserRecord
                {
                    NormalizedEmail = normalizedEmail,
                    LinkedEntraOid = "oid-home",
                });
        trialUsers
            .Setup(r => r.TryLinkLocalIdentityToEntraAsync(normalizedEmail, "oid-home", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantTrialIdentityHandoffStage sut = new(tenants.Object, trialUsers.Object, audit.Object);

        TenantTrialLinkEntraResult result = await sut.LinkEntraAsync(
            new TenantTrialLinkEntraBody
            {
                EntraTenantId = entraTenantId,
                LocalEmail = "admin@customer.com",
                EntraOid = "oid-home",
            },
            tenant,
            scope,
            "admin",
            normalizedEmail,
            hasIdentityPayload: true,
            CancellationToken.None);

        result.Outcome.Should().Be(TenantTrialHttpOutcome.Success);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.TrialLocalIdentityLinkedToEntra),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
