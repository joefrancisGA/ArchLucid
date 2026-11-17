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
        tenants
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenant);

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
    public async Task LinkEntraAsync_returns_success_without_directory_audit_when_offboard_completes_after_bind_before_audit()
    {
        Guid tenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid entraTenantId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        DateTimeOffset anchor = new(2026, 5, 1, 0, 0, 0, TimeSpan.Zero);

        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "home",
            Slug = "home",
            Tier = TenantTier.Standard,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialStatus = TrialLifecycleStatus.Converted,
        };

        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Name = "home",
            Slug = "home",
            Tier = TenantTier.Standard,
            CreatedUtc = tenant.CreatedUtc,
            TrialStatus = TrialLifecycleStatus.Converted,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .Setup(t => t.UpdateEntraTenantIdAsync(tenantId, entraTenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenant)
            .ReturnsAsync(offboarded);

        Mock<IAuditService> audit = new(MockBehavior.Strict);

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
        tenants.Verify(
            t => t.UpdateEntraTenantIdAsync(tenantId, entraTenantId, It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task LinkEntraAsync_returns_success_without_entra_bind_when_offboard_completes_before_directory_bind()
    {
        Guid tenantId = Guid.Parse("12121212-1212-1212-1212-121212121212");
        Guid entraTenantId = Guid.Parse("13131313-1313-1313-1313-131313131313");
        DateTimeOffset anchor = new(2026, 10, 13, 12, 0, 0, TimeSpan.Zero);

        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "home",
            Slug = "home",
            Tier = TenantTier.Standard,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialStatus = TrialLifecycleStatus.Converted,
        };

        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Name = tenant.Name,
            Slug = tenant.Slug,
            Tier = tenant.Tier,
            CreatedUtc = tenant.CreatedUtc,
            TrialStatus = tenant.TrialStatus,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded);

        Mock<IAuditService> audit = new(MockBehavior.Strict);

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
        tenants.Verify(
            t => t.UpdateEntraTenantIdAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task LinkEntraAsync_returns_success_without_identity_link_when_offboard_completes_after_directory_audit_before_link()
    {
        Guid tenantId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        Guid entraTenantId = Guid.Parse("10101010-1010-1010-1010-101010101010");
        const string normalizedEmail = "owner@customer.com";
        DateTimeOffset anchor = new(2026, 10, 13, 0, 0, 0, TimeSpan.Zero);

        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "home",
            Slug = "home",
            Tier = TenantTier.Standard,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialStatus = TrialLifecycleStatus.Converted,
        };

        TenantRecord active = tenant;
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Name = tenant.Name,
            Slug = tenant.Slug,
            Tier = tenant.Tier,
            CreatedUtc = tenant.CreatedUtc,
            TrialStatus = tenant.TrialStatus,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .Setup(t => t.UpdateEntraTenantIdAsync(tenantId, entraTenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        Mock<ITrialIdentityUserRepository> trialUsers = new(MockBehavior.Strict);

        Mock<IAuditService> audit = new(MockBehavior.Strict);
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantTrialIdentityHandoffStage sut = new(tenants.Object, trialUsers.Object, audit.Object);

        TenantTrialLinkEntraResult result = await sut.LinkEntraAsync(
            new TenantTrialLinkEntraBody { EntraTenantId = entraTenantId, EntraOid = "oid-home" },
            tenant,
            scope,
            "admin",
            normalizedLocalEmail: normalizedEmail,
            hasIdentityPayload: true,
            CancellationToken.None);

        result.Outcome.Should().Be(TenantTrialHttpOutcome.Success);
        trialUsers.Verify(
            r => r.GetByNormalizedEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        trialUsers.Verify(
            r => r.TryLinkLocalIdentityToEntraAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.TrialLocalIdentityLinkedToEntra),
                It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.TenantEntraDirectoryBound),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task LinkEntraAsync_returns_success_without_identity_link_when_offboard_completes_after_email_lookup_before_link()
    {
        Guid tenantId = Guid.Parse("18181818-1818-1818-1818-181818181818");
        Guid entraTenantId = Guid.Parse("19191919-1919-1919-1919-191919191919");
        const string normalizedEmail = "owner@customer.com";
        DateTimeOffset anchor = new(2026, 10, 13, 17, 0, 0, TimeSpan.Zero);

        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "home",
            Slug = "home",
            Tier = TenantTier.Standard,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialStatus = TrialLifecycleStatus.Converted,
        };

        TenantRecord active = tenant;
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Name = tenant.Name,
            Slug = tenant.Slug,
            Tier = tenant.Tier,
            CreatedUtc = tenant.CreatedUtc,
            TrialStatus = tenant.TrialStatus,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .Setup(t => t.UpdateEntraTenantIdAsync(tenantId, entraTenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        Mock<ITrialIdentityUserRepository> trialUsers = new(MockBehavior.Strict);
        trialUsers
            .Setup(r => r.GetByNormalizedEmailAsync(normalizedEmail, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TrialIdentityUserRecord?)null);

        Mock<IAuditService> audit = new(MockBehavior.Strict);
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantTrialIdentityHandoffStage sut = new(tenants.Object, trialUsers.Object, audit.Object);

        TenantTrialLinkEntraResult result = await sut.LinkEntraAsync(
            new TenantTrialLinkEntraBody { EntraTenantId = entraTenantId, EntraOid = "oid-home" },
            tenant,
            scope,
            "admin",
            normalizedLocalEmail: normalizedEmail,
            hasIdentityPayload: true,
            CancellationToken.None);

        result.Outcome.Should().Be(TenantTrialHttpOutcome.Success);
        trialUsers.Verify(
            r => r.GetByNormalizedEmailAsync(normalizedEmail, It.IsAny<CancellationToken>()),
            Times.Once);
        trialUsers.Verify(
            r => r.TryLinkLocalIdentityToEntraAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.TrialLocalIdentityLinkedToEntra),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task LinkEntraAsync_returns_success_without_entra_update_when_offboard_completes_on_already_bound_retry()
    {
        Guid tenantId = Guid.Parse("14141414-1414-1414-1414-141414141414");
        Guid entraTenantId = Guid.Parse("15151515-1515-1515-1515-151515151515");
        DateTimeOffset anchor = new(2026, 10, 13, 16, 0, 0, TimeSpan.Zero);

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

        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Name = tenant.Name,
            Slug = tenant.Slug,
            Tier = tenant.Tier,
            CreatedUtc = tenant.CreatedUtc,
            TrialStatus = tenant.TrialStatus,
            EntraTenantId = entraTenantId,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded);

        Mock<IAuditService> audit = new(MockBehavior.Strict);

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
        tenants.Verify(
            t => t.UpdateEntraTenantIdAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task LinkEntraAsync_returns_success_without_identity_lookup_when_offboard_completes_on_already_bound_retry_before_email_lookup()
    {
        Guid tenantId = Guid.Parse("16161616-1616-1616-1616-161616161616");
        Guid entraTenantId = Guid.Parse("17171717-1717-1717-1717-171717171717");
        const string normalizedEmail = "owner@customer.com";
        DateTimeOffset anchor = new(2026, 10, 13, 16, 45, 0, TimeSpan.Zero);

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

        TenantRecord active = tenant;
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Name = tenant.Name,
            Slug = tenant.Slug,
            Tier = tenant.Tier,
            CreatedUtc = tenant.CreatedUtc,
            TrialStatus = tenant.TrialStatus,
            EntraTenantId = entraTenantId,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .Setup(t => t.UpdateEntraTenantIdAsync(tenantId, entraTenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        Mock<ITrialIdentityUserRepository> trialUsers = new(MockBehavior.Strict);
        Mock<IAuditService> audit = new(MockBehavior.Strict);

        TenantTrialIdentityHandoffStage sut = new(tenants.Object, trialUsers.Object, audit.Object);

        TenantTrialLinkEntraResult result = await sut.LinkEntraAsync(
            new TenantTrialLinkEntraBody { EntraTenantId = entraTenantId, EntraOid = "oid-home" },
            tenant,
            scope,
            "admin",
            normalizedLocalEmail: normalizedEmail,
            hasIdentityPayload: true,
            CancellationToken.None);

        result.Outcome.Should().Be(TenantTrialHttpOutcome.Success);
        trialUsers.Verify(
            r => r.GetByNormalizedEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        trialUsers.Verify(
            r => r.TryLinkLocalIdentityToEntraAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
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
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenant);
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

    [Fact]
    public async Task LinkEntraAsync_skips_duplicate_local_identity_linked_audit_when_entra_oid_differs_only_by_casing()
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
            .Setup(r => r.TryLinkLocalIdentityToEntraAsync(normalizedEmail, "OID-HOME", It.IsAny<CancellationToken>()))
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
                EntraOid = "OID-HOME",
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

    [Fact]
    public async Task LinkEntraAsync_returns_success_without_directory_audit_when_offboard_completes_after_tenant_before_directory_audit_read_before_audit()
    {
        Guid tenantId = Guid.Parse("20202020-2020-2020-2020-202020202020");
        Guid entraTenantId = Guid.Parse("21212121-2121-2121-2121-212121212121");
        DateTimeOffset anchor = new(2026, 10, 22, 7, 0, 0, TimeSpan.Zero);

        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "home",
            Slug = "home",
            Tier = TenantTier.Standard,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialStatus = TrialLifecycleStatus.Converted,
        };

        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Name = tenant.Name,
            Slug = tenant.Slug,
            Tier = tenant.Tier,
            CreatedUtc = tenant.CreatedUtc,
            TrialStatus = tenant.TrialStatus,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .Setup(t => t.UpdateEntraTenantIdAsync(tenantId, entraTenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenant)
            .ReturnsAsync(tenant)
            .ReturnsAsync(offboarded);

        Mock<IAuditService> audit = new(MockBehavior.Strict);

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
    public async Task LinkEntraAsync_returns_success_without_identity_audit_when_offboard_completes_after_tenant_before_identity_audit_read_before_audit()
    {
        Guid tenantId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid entraTenantId = Guid.Parse("23232323-2323-2323-2323-232323232323");
        const string normalizedEmail = "owner@customer.com";
        DateTimeOffset anchor = new(2026, 10, 22, 7, 30, 0, TimeSpan.Zero);

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

        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Name = tenant.Name,
            Slug = tenant.Slug,
            Tier = tenant.Tier,
            CreatedUtc = tenant.CreatedUtc,
            TrialStatus = tenant.TrialStatus,
            EntraTenantId = entraTenantId,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .Setup(t => t.UpdateEntraTenantIdAsync(tenantId, entraTenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenant)
            .ReturnsAsync(tenant)
            .ReturnsAsync(tenant)
            .ReturnsAsync(tenant)
            .ReturnsAsync(offboarded);

        Mock<ITrialIdentityUserRepository> trialUsers = new(MockBehavior.Strict);
        trialUsers
            .Setup(r => r.GetByNormalizedEmailAsync(normalizedEmail, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TrialIdentityUserRecord?)null);
        trialUsers
            .Setup(r => r.TryLinkLocalIdentityToEntraAsync(normalizedEmail, "oid-home", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IAuditService> audit = new(MockBehavior.Strict);

        TenantTrialIdentityHandoffStage sut = new(tenants.Object, trialUsers.Object, audit.Object);

        TenantTrialLinkEntraResult result = await sut.LinkEntraAsync(
            new TenantTrialLinkEntraBody
            {
                EntraTenantId = entraTenantId,
                LocalEmail = "owner@customer.com",
                EntraOid = "oid-home",
            },
            tenant,
            scope,
            "admin",
            normalizedLocalEmail: normalizedEmail,
            hasIdentityPayload: true,
            CancellationToken.None);

        result.Outcome.Should().Be(TenantTrialHttpOutcome.Success);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.TrialLocalIdentityLinkedToEntra),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task LinkEntraAsync_trims_actor_on_directory_bound_audit()
    {
        Guid tenantId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        Guid entraTenantId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

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
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenant);
        tenants
            .Setup(t => t.UpdateEntraTenantIdAsync(tenantId, entraTenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        AuditEvent? captured = null;
        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((e, _) => captured = e)
            .Returns(Task.CompletedTask);

        TenantTrialIdentityHandoffStage sut = new(tenants.Object, Mock.Of<ITrialIdentityUserRepository>(), audit.Object);

        TenantTrialLinkEntraResult result = await sut.LinkEntraAsync(
            new TenantTrialLinkEntraBody { EntraTenantId = entraTenantId },
            tenant,
            scope,
            "  pilot@example.com  ",
            normalizedLocalEmail: null,
            hasIdentityPayload: false,
            CancellationToken.None);

        result.Outcome.Should().Be(TenantTrialHttpOutcome.Success);
        captured.Should().NotBeNull();
        captured!.EventType.Should().Be(AuditEventTypes.TenantEntraDirectoryBound);
        captured.ActorUserId.Should().Be("pilot@example.com");
        captured.ActorUserName.Should().Be("pilot@example.com");
    }
}
