using ArchLucid.Core.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scim.Filtering;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Identity;
using ArchLucid.Persistence.Scim;

using Dapper;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PersistencePackageCoverageBatch4Tests
{
    [Fact]
    public async Task InMemoryAuthenticationIdentityRepository_covers_lifecycle_paths()
    {
        InMemoryAuthenticationIdentityRepository sut = new();
        Guid userId = Guid.NewGuid();
        Guid identityId = Guid.NewGuid();
        AuthenticationIdentityInsert insert = new()
        {
            Id = identityId,
            UserId = userId,
            ProviderType = AuthenticationProviderType.MicrosoftIdentity,
            NormalizedIssuer = "https://login.example/",
            Subject = "sub-1",
            NormalizedEmail = "user@example.com",
            DisplayEmail = "user@example.com",
            EmailVerified = true,
            TenantId = Guid.NewGuid(),
        };

        AuthenticationIdentityRecord created = await sut.InsertAsync(insert, CancellationToken.None);
        created.Id.Should().Be(identityId);

        ExternalIdentityKey key = new()
        {
            ProviderType = insert.ProviderType,
            NormalizedIssuer = insert.NormalizedIssuer,
            Subject = insert.Subject,
            TenantId = insert.TenantId,
            TenantIdentityProviderId = insert.TenantIdentityProviderId,
        };

        AuthenticationIdentityRecord? found = await sut.FindByExternalKeyAsync(key, CancellationToken.None);
        found.Should().NotBeNull();
        (await sut.GetByIdAsync(identityId, CancellationToken.None)).Should().NotBeNull();
        (await sut.ListByUserIdAsync(userId, CancellationToken.None)).Should().ContainSingle();
        (await sut.HasActiveIdentityAsync(userId, CancellationToken.None)).Should().BeTrue();

        await sut.RecordAuthenticationAsync(identityId, DateTimeOffset.UtcNow, CancellationToken.None);
        await sut.DisableAsync(identityId, DateTimeOffset.UtcNow, CancellationToken.None);
        (await sut.FindByExternalKeyAsync(key, CancellationToken.None)).Should().BeNull();
        (await sut.FindAnyByExternalKeyAsync(key, CancellationToken.None)).Should().NotBeNull();
        (await sut.HasActiveIdentityAsync(userId, CancellationToken.None)).Should().BeFalse();

        bool reenabled = await sut.ReEnableAsync(identityId, CancellationToken.None);
        reenabled.Should().BeTrue();
        (await sut.FindByExternalKeyAsync(key, CancellationToken.None)).Should().NotBeNull();

        Func<Task> duplicate = () => sut.InsertAsync(insert, CancellationToken.None);
        await duplicate.Should().ThrowAsync<DuplicateAuthenticationIdentityException>();

        (await sut.ReEnableAsync(Guid.NewGuid(), CancellationToken.None)).Should().BeFalse();
        await sut.DisableAsync(Guid.NewGuid(), DateTimeOffset.UtcNow, CancellationToken.None);
        await sut.RecordAuthenticationAsync(Guid.NewGuid(), DateTimeOffset.UtcNow, CancellationToken.None);
    }

    [Fact]
    public async Task InMemoryUserInvitationRepository_covers_pending_revoke_and_accept()
    {
        InMemoryUserInvitationRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        byte[] tokenHash = [1, 2, 3, 4];
        DateTimeOffset expires = DateTimeOffset.UtcNow.AddDays(7);

        UserInvitationRecord created = await sut.InsertAsync(
            tenantId,
            workspaceId,
            "invitee@example.com",
            "Reader",
            "actor-1",
            "welcome",
            tokenHash,
            expires,
            CancellationToken.None);

        (await sut.GetByIdAsync(tenantId, created.Id, CancellationToken.None)).Should().NotBeNull();
        (await sut.GetPendingByIdAsync(created.Id, CancellationToken.None)).Should().NotBeNull();
        (await sut.GetPendingByEmailAsync(tenantId, "invitee@example.com", CancellationToken.None))
            .Should()
            .NotBeNull();
        (await sut.ListByTenantAsync(tenantId, CancellationToken.None)).Should().ContainSingle();
        (await sut.GetPendingByTokenHashAsync(tokenHash, CancellationToken.None)).Should().NotBeNull();
        (await sut.GetByTokenHashAsync(tokenHash, CancellationToken.None)).Should().NotBeNull();
        (await sut.ListPendingByNormalizedEmailAsync("invitee@example.com", CancellationToken.None))
            .Should()
            .ContainSingle();

        bool accepted = await sut.MarkAcceptedAsync(created.Id, DateTimeOffset.UtcNow, CancellationToken.None);
        accepted.Should().BeTrue();
        (await sut.GetPendingByIdAsync(created.Id, CancellationToken.None)).Should().BeNull();
        (await sut.MarkAcceptedAsync(created.Id, DateTimeOffset.UtcNow, CancellationToken.None)).Should().BeFalse();

        UserInvitationRecord second = await sut.InsertAsync(
            tenantId,
            workspaceId,
            "second@example.com",
            "Admin",
            "actor-1",
            null,
            [9, 8, 7],
            expires,
            CancellationToken.None);
        bool revoked = await sut.RevokeAsync(tenantId, second.Id, DateTimeOffset.UtcNow, CancellationToken.None);
        revoked.Should().BeTrue();
        (await sut.RevokeAsync(tenantId, second.Id, DateTimeOffset.UtcNow, CancellationToken.None)).Should().BeFalse();
        (await sut.RevokeAsync(Guid.NewGuid(), second.Id, DateTimeOffset.UtcNow, CancellationToken.None))
            .Should()
            .BeFalse();
        (await sut.MarkAcceptedAsync(Guid.NewGuid(), DateTimeOffset.UtcNow, CancellationToken.None)).Should().BeFalse();
        (await sut.GetPendingByTokenHashAsync([0], CancellationToken.None)).Should().BeNull();
        (await sut.GetByTokenHashAsync([0], CancellationToken.None)).Should().BeNull();
    }

    [Fact]
    public void AuditEventFilterEnumerable_applies_all_filter_dimensions()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid keepId = Guid.NewGuid();
        DateTime pivot = new(2026, 7, 1, 12, 0, 0, DateTimeKind.Utc);
        List<AuditEvent> events =
        [
            new()
            {
                EventId = keepId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                EventType = "RunStarted",
                OccurredUtc = pivot,
                CorrelationId = "corr-1",
                ActorUserId = "actor-1",
                ActorUserName = "Actor One",
                RunId = runId,
            },
            new()
            {
                EventId = Guid.NewGuid(),
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                EventType = "RunCompleted",
                OccurredUtc = pivot.AddHours(1),
                CorrelationId = "corr-2",
                ActorUserId = "actor-2",
                ActorUserName = "Actor Two",
                RunId = Guid.NewGuid(),
            },
            new()
            {
                EventId = Guid.NewGuid(),
                TenantId = Guid.NewGuid(),
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                EventType = "RunStarted",
                OccurredUtc = pivot,
                ActorUserId = "actor-x",
                ActorUserName = "Actor X",
            },
        ];

        AuditEventFilter filter = new()
        {
            EventType = "RunStarted",
            FromUtc = pivot.AddMinutes(-1),
            ToUtc = pivot.AddMinutes(1),
            CorrelationId = "corr-1",
            ActorUserId = "actor-1",
            RunId = runId,
            BeforeUtc = pivot.AddMinutes(1),
            BeforeEventId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
        };

        List<AuditEvent> matched = AuditEventFilterEnumerable
            .WhereMatches(events, tenantId, workspaceId, projectId, filter)
            .ToList();

        matched.Should().ContainSingle();
        matched[0].EventId.Should().Be(keepId);

        List<AuditEvent> beforeOnly = AuditEventFilterEnumerable
            .WhereMatches(
                events,
                tenantId,
                workspaceId,
                projectId,
                new AuditEventFilter { BeforeUtc = pivot })
            .ToList();

        beforeOnly.Should().BeEmpty();
    }

    [Fact]
    public void SqlScimUserFilterTranslator_builds_null_and_and_or_not_present_and_comparison()
    {
        DynamicParameters parameters = new();
        int next = 0;

        string nullFilter = SqlScimUserFilterTranslator.BuildWhere(null, parameters, ref next);
        nullFilter.Should().Be("1 = 1");

        ScimFilterNode filter = new ScimAndNode(
            new ScimOrNode(
                new ScimComparisonNode("userName", "eq", "alice"),
                new ScimComparisonNode("userName", "co", "ali")),
            new ScimNotNode(new ScimPresentNode("externalId")));

        string sql = SqlScimUserFilterTranslator.BuildWhere(filter, parameters, ref next);
        sql.Should().Contain("u.UserName");
        sql.Should().Contain("LIKE");
        sql.Should().Contain("NOT");
        sql.Should().Contain("IS NOT NULL");

        DynamicParameters activeParams = new();
        int activeNext = 0;
        string activeSql = SqlScimUserFilterTranslator.BuildWhere(
            new ScimComparisonNode("active", "eq", "true"),
            activeParams,
            ref activeNext);
        activeSql.Should().Contain("u.Active");

        DynamicParameters idParams = new();
        int idNext = 0;
        string idSql = SqlScimUserFilterTranslator.BuildWhere(
            new ScimComparisonNode("id", "eq", Guid.NewGuid().ToString("D")),
            idParams,
            ref idNext);
        idSql.Should().Contain("CAST(u.Id AS NVARCHAR(36))");

        Action unknown = () =>
        {
            DynamicParameters p = new();
            int n = 0;
            _ = SqlScimUserFilterTranslator.BuildWhere(
                new ScimComparisonNode("unknownAttr", "eq", "x"),
                p,
                ref n);
        };

        unknown.Should().Throw<ScimFilterSqlException>();
    }
}
