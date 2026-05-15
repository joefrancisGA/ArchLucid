using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Tests.Support;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Tenancy;

/// <summary>
///     Exercises <see cref="DapperTenantRepository" /> against a real catalog (Dapper, transactions, and UPDATE paths).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class DapperTenantRepositorySqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task GetBySlug_rejects_whitespace_before_sql()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);

        Func<Task> act = async () => await sut.GetBySlugAsync("   ", CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [SkippableFact]
    public async Task Insert_get_by_id_slug_entra_list_and_workspace_round_trips()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        Guid entra = Guid.NewGuid();
        string slug = "ts-" + Guid.NewGuid().ToString("N")[..8];
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        await sut.InsertTenantAsync(
            tenantId,
            "SQL tenant A",
            slug,
            TenantTier.Free,
            entra,
            CancellationToken.None);

        TenantRecord? byId = await sut.GetByIdAsync(tenantId, CancellationToken.None);
        byId.Should().NotBeNull();
        byId.Slug.Should().Be(slug);
        byId.Tier.Should().Be(TenantTier.Free);
        byId.EntraTenantId.Should().Be(entra);

        TenantRecord? bySlug = await sut.GetBySlugAsync(slug, CancellationToken.None);
        bySlug!.Id.Should().Be(tenantId);

        (await sut.GetByEntraTenantIdAsync(entra, CancellationToken.None))!.Id.Should().Be(tenantId);

        IReadOnlyList<TenantRecord> list = await sut.ListAsync(CancellationToken.None);
        list.Select(static t => t.Id).Should().Contain(tenantId);

        await sut.InsertWorkspaceAsync(
            workspaceId,
            tenantId,
            "ws-1",
            projectId,
            CancellationToken.None);

        DapperArchitectureProjectRepository projects = new(factory);
        await projects.InsertAsync(projectId, tenantId, workspaceId, "default", CancellationToken.None);

        TenantWorkspaceLink? link = await sut.GetFirstWorkspaceAsync(tenantId, CancellationToken.None);
        link!.WorkspaceId.Should().Be(workspaceId);
        link.DefaultProjectId.Should().Be(projectId);
    }

    [SkippableFact]
    public async Task SuspendTenant_sets_suspended_utc()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        string slug = "sus-" + Guid.NewGuid().ToString("N")[..8];
        await sut.InsertTenantAsync(
            tenantId,
            "SQL suspend",
            slug,
            TenantTier.Standard,
            null,
            CancellationToken.None);

        await sut.SuspendTenantAsync(tenantId, CancellationToken.None);
        (await sut.GetByIdAsync(tenantId, CancellationToken.None))!.SuspendedUtc.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task Commit_trial_update_baseline_and_mark_converted()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        Guid sample = Guid.NewGuid();
        string slug = "tr-" + Guid.NewGuid().ToString("N")[..8];
        DateTimeOffset start = TimeProvider.System.GetUtcNow().AddDays(-1);
        DateTimeOffset exp = TimeProvider.System.GetUtcNow().AddDays(14);
        await sut.InsertTenantAsync(
            tenantId,
            "Trial T",
            slug,
            TenantTier.Standard,
            null,
            CancellationToken.None);
        await sut.CommitSelfServiceTrialAsync(
            tenantId,
            start,
            exp,
            runsLimit: 20,
            seatsLimit: 5,
            sample,
            10m,
            "src",
            start,
            "co",
            4,
            "ind",
            null,
            CancellationToken.None);
        (await sut.GetByIdAsync(tenantId, CancellationToken.None))!.TrialStatus.Should().Be(TrialLifecycleStatus.Active);

        await sut.UpdateBaselineAsync(
            tenantId,
            2.5m,
            2,
            TimeProvider.System.GetUtcNow(),
            CancellationToken.None);
        (await sut.GetByIdAsync(tenantId, CancellationToken.None))!.BaselinePeoplePerReview.Should().Be(2);

        await sut.MarkTrialConvertedAsync(tenantId, TenantTier.Enterprise, CancellationToken.None);
        TenantRecord? r = await sut.GetByIdAsync(tenantId, CancellationToken.None);
        r!.Tier.Should().Be(TenantTier.Enterprise);
        r.TrialStatus.Should().Be(TrialLifecycleStatus.Converted);
    }

    [SkippableFact]
    public async Task List_automation_ids_preseed_pipeline_and_first_manifest_idempotent()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        Guid sample = Guid.NewGuid();
        string slug = "pre-" + Guid.NewGuid().ToString("N")[..8];
        await sut.InsertTenantAsync(
            tenantId,
            "Pre T",
            slug,
            TenantTier.Standard,
            null,
            CancellationToken.None);
        await sut.CommitSelfServiceTrialAsync(
            tenantId,
            TimeProvider.System.GetUtcNow(),
            TimeProvider.System.GetUtcNow().AddDays(7),
            4,
            2,
            sample,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            CancellationToken.None);

        (await sut.ListTrialLifecycleAutomationTenantIdsAsync(CancellationToken.None))
            .Should()
            .Contain(tenantId);

        await sut.EnqueueTrialArchitecturePreseedAsync(tenantId, CancellationToken.None);
        (await sut.ListTenantIdsPendingTrialArchitecturePreseedAsync(5, CancellationToken.None))
            .Should()
            .Contain(tenantId);

        Guid welcome = Guid.NewGuid();
        await sut.MarkTrialArchitecturePreseedCompletedAsync(tenantId, welcome, CancellationToken.None);
        (await sut.GetByIdAsync(tenantId, CancellationToken.None))!.TrialWelcomeRunId.Should().Be(welcome);

        TrialFirstManifestCommitOutcome? first = await sut.TryMarkFirstManifestCommittedAsync(
            tenantId,
            TimeProvider.System.GetUtcNow(),
            CancellationToken.None);
        first.Should().NotBeNull();
        (await sut.TryMarkFirstManifestCommittedAsync(tenantId, TimeProvider.System.GetUtcNow(), CancellationToken.None))
            .Should()
            .BeNull();
    }

    [SkippableFact]
    public async Task E2eHarnessSetTrialExpiresUtc_persists()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        string slug = "e2e-" + Guid.NewGuid().ToString("N")[..8];
        await sut.InsertTenantAsync(
            tenantId,
            "E2E",
            slug,
            TenantTier.Standard,
            null,
            CancellationToken.None);
        await sut.CommitSelfServiceTrialAsync(
            tenantId,
            TimeProvider.System.GetUtcNow(),
            TimeProvider.System.GetUtcNow().AddDays(3),
            1,
            1,
            Guid.NewGuid(),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            CancellationToken.None);
        DateTimeOffset next = TimeProvider.System.GetUtcNow().AddDays(60);
        await sut.E2eHarnessSetTrialExpiresUtcAsync(tenantId, next, CancellationToken.None);
        (await sut.GetByIdAsync(tenantId, CancellationToken.None))!.TrialExpiresUtc.Should().BeCloseTo(next, TimeSpan.FromSeconds(1));
    }

    [SkippableFact]
    public async Task TryIncrementActiveTrialRun_increments_until_cap()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        string slug = "run-" + Guid.NewGuid().ToString("N")[..8];
        await sut.InsertTenantAsync(
            tenantId,
            "Run cap",
            slug,
            TenantTier.Standard,
            null,
            CancellationToken.None);
        await sut.CommitSelfServiceTrialAsync(
            tenantId,
            TimeProvider.System.GetUtcNow(),
            TimeProvider.System.GetUtcNow().AddDays(1),
            runsLimit: 2,
            seatsLimit: 3,
            Guid.NewGuid(),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            CancellationToken.None);
        await sut.TryIncrementActiveTrialRunAsync(tenantId, CancellationToken.None);
        (await sut.GetByIdAsync(tenantId, CancellationToken.None))!.TrialRunsUsed.Should().Be(1);
        await sut.TryIncrementActiveTrialRunAsync(tenantId, CancellationToken.None);
        (await sut.GetByIdAsync(tenantId, CancellationToken.None))!.TrialRunsUsed.Should().Be(2);
        await Assert.ThrowsAsync<TrialLimitExceededException>(
            async () => await sut.TryIncrementActiveTrialRunAsync(tenantId, CancellationToken.None));
    }

    [SkippableFact]
    public async Task TryClaimTrialSeat_respects_duplicate_and_seat_limit()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        string slug = "seat-" + Guid.NewGuid().ToString("N")[..8];
        await sut.InsertTenantAsync(
            tenantId,
            "Seats",
            slug,
            TenantTier.Standard,
            null,
            CancellationToken.None);
        await sut.CommitSelfServiceTrialAsync(
            tenantId,
            TimeProvider.System.GetUtcNow(),
            TimeProvider.System.GetUtcNow().AddDays(1),
            10,
            seatsLimit: 2,
            Guid.NewGuid(),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            CancellationToken.None);
        const string p1 = "p1@contoso.com";
        const string p2 = "p2@contoso.com";
        await sut.TryClaimTrialSeatAsync(tenantId, p1, CancellationToken.None);
        await sut.TryClaimTrialSeatAsync(tenantId, p1, CancellationToken.None);
        await sut.TryClaimTrialSeatAsync(tenantId, p2, CancellationToken.None);
        (await sut.GetByIdAsync(tenantId, CancellationToken.None))!.TrialSeatsUsed.Should().Be(2);
        await Assert.ThrowsAsync<TrialLimitExceededException>(
            async () => await sut.TryClaimTrialSeatAsync(tenantId, "p3@contoso.com", CancellationToken.None));
    }

    [SkippableFact]
    public async Task TryRecordTrialLifecycleTransition_succeeds_and_fails_on_mismatch()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        string slug = "tlc-" + Guid.NewGuid().ToString("N")[..8];
        await sut.InsertTenantAsync(
            tenantId,
            "Tlc",
            slug,
            TenantTier.Standard,
            null,
            CancellationToken.None);
        await sut.CommitSelfServiceTrialAsync(
            tenantId,
            TimeProvider.System.GetUtcNow(),
            TimeProvider.System.GetUtcNow().AddDays(1),
            5,
            3,
            Guid.NewGuid(),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            CancellationToken.None);

        bool ok = await sut.TryRecordTrialLifecycleTransitionAsync(
            tenantId,
            TrialLifecycleStatus.Active,
            TrialLifecycleStatus.Expired,
            "unit test",
            CancellationToken.None);
        ok.Should().BeTrue();
        (await sut.GetByIdAsync(tenantId, CancellationToken.None))!.TrialStatus.Should().Be(TrialLifecycleStatus.Expired);

        bool bad = await sut.TryRecordTrialLifecycleTransitionAsync(
            tenantId,
            TrialLifecycleStatus.Active,
            "x",
            "nope",
            CancellationToken.None);
        bad.Should().BeFalse();
    }

    [SkippableFact]
    public async Task Enterprise_scim_seat_bump_respects_limit_and_decrements()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        string slug = "ent-" + Guid.NewGuid().ToString("N")[..8];
        await sut.InsertTenantAsync(
            tenantId,
            "Ent",
            slug,
            TenantTier.Enterprise,
            null,
            CancellationToken.None,
            enterpriseScimSeatsLimit: 1);

        (await sut.TryIncrementEnterpriseScimSeatAsync(tenantId, CancellationToken.None)).Should().BeTrue();
        (await sut.TryIncrementEnterpriseScimSeatAsync(tenantId, CancellationToken.None)).Should().BeFalse();
        (await sut.GetByIdAsync(tenantId, CancellationToken.None))!.EnterpriseSeatsUsed.Should().Be(1);
        await sut.DecrementEnterpriseScimSeatAsync(tenantId, CancellationToken.None);
        (await sut.GetByIdAsync(tenantId, CancellationToken.None))!.EnterpriseSeatsUsed.Should().Be(0);
    }

    [SkippableFact]
    public async Task UpdateEntraTenantIdAsync_binds_after_trial_convert_and_is_idempotent()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        Guid corpEntra = Guid.NewGuid();
        string slug = "hand-" + Guid.NewGuid().ToString("N")[..8];
        await sut.InsertTenantAsync(
            tenantId,
            "Handoff T",
            slug,
            TenantTier.Standard,
            null,
            CancellationToken.None);
        await sut.CommitSelfServiceTrialAsync(
            tenantId,
            TimeProvider.System.GetUtcNow(),
            TimeProvider.System.GetUtcNow().AddDays(3),
            5,
            2,
            Guid.NewGuid(),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            CancellationToken.None);
        await sut.MarkTrialConvertedAsync(tenantId, TenantTier.Standard, CancellationToken.None);
        TenantRecord? converted = await sut.GetByIdAsync(tenantId, CancellationToken.None);
        converted!.TrialStatus.Should().Be(TrialLifecycleStatus.Converted);
        converted.EntraTenantId.Should().BeNull();

        (await sut.UpdateEntraTenantIdAsync(tenantId, corpEntra, CancellationToken.None)).Should().BeTrue();
        (await sut.GetByIdAsync(tenantId, CancellationToken.None))!.EntraTenantId.Should().Be(corpEntra);

        (await sut.UpdateEntraTenantIdAsync(tenantId, corpEntra, CancellationToken.None)).Should().BeTrue();
    }

    [SkippableFact]
    public async Task UpdateEntraTenantIdAsync_noop_when_row_has_different_entra()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        Guid first = Guid.NewGuid();
        Guid second = Guid.NewGuid();
        string slug = "lock-" + Guid.NewGuid().ToString("N")[..8];
        await sut.InsertTenantAsync(
            tenantId,
            "Locked",
            slug,
            TenantTier.Standard,
            first,
            CancellationToken.None);

        (await sut.UpdateEntraTenantIdAsync(tenantId, second, CancellationToken.None)).Should().BeFalse();
        (await sut.GetByIdAsync(tenantId, CancellationToken.None))!.EntraTenantId.Should().Be(first);
    }

    [SkippableFact]
    public async Task ListWorkspacesAsync_only_returns_workspaces_for_requested_tenant()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        
        Guid tenantA = Guid.NewGuid();
        Guid tenantB = Guid.NewGuid();
        
        await sut.InsertTenantAsync(tenantA, "Tenant A", "t-a-" + Guid.NewGuid().ToString("N")[..8], TenantTier.Standard, null, CancellationToken.None);
        await sut.InsertTenantAsync(tenantB, "Tenant B", "t-b-" + Guid.NewGuid().ToString("N")[..8], TenantTier.Standard, null, CancellationToken.None);

        Guid workspaceA1 = Guid.NewGuid();
        Guid workspaceA2 = Guid.NewGuid();
        Guid workspaceB1 = Guid.NewGuid();

        await sut.InsertWorkspaceAsync(workspaceA1, tenantA, "A1", Guid.NewGuid(), CancellationToken.None);
        await sut.InsertWorkspaceAsync(workspaceA2, tenantA, "A2", Guid.NewGuid(), CancellationToken.None);
        await sut.InsertWorkspaceAsync(workspaceB1, tenantB, "B1", Guid.NewGuid(), CancellationToken.None);

        var listA = await sut.ListWorkspacesAsync(tenantA, CancellationToken.None);
        listA.Should().HaveCount(2);
        listA.Select(x => x.WorkspaceId).Should().Contain(new[] { workspaceA1, workspaceA2 });
        listA.Select(x => x.WorkspaceId).Should().NotContain(workspaceB1);

        var listB = await sut.ListWorkspacesAsync(tenantB, CancellationToken.None);
        listB.Should().HaveCount(1);
        listB.Select(x => x.WorkspaceId).Should().Contain(workspaceB1);
    }

    [SkippableFact]
    public async Task Trial_lifecycle_methods_isolate_by_tenant_id()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        
        Guid tenantA = Guid.NewGuid();
        Guid tenantB = Guid.NewGuid();
        
        await sut.InsertTenantAsync(tenantA, "Tenant A", "t-a-" + Guid.NewGuid().ToString("N")[..8], TenantTier.Standard, null, CancellationToken.None);
        await sut.InsertTenantAsync(tenantB, "Tenant B", "t-b-" + Guid.NewGuid().ToString("N")[..8], TenantTier.Standard, null, CancellationToken.None);

        await sut.CommitSelfServiceTrialAsync(
            tenantA, TimeProvider.System.GetUtcNow(), TimeProvider.System.GetUtcNow().AddDays(14),
            20, 5, Guid.NewGuid(), null, null, null, null, null, null, null, CancellationToken.None);
            
        await sut.CommitSelfServiceTrialAsync(
            tenantB, TimeProvider.System.GetUtcNow(), TimeProvider.System.GetUtcNow().AddDays(14),
            20, 5, Guid.NewGuid(), null, null, null, null, null, null, null, CancellationToken.None);

        // Try to increment trial runs for tenant A
        await sut.TryIncrementActiveTrialRunAsync(tenantA, CancellationToken.None);
        
        // Tenant A should be incremented, B should remain 0
        (await sut.GetByIdAsync(tenantA, CancellationToken.None))!.TrialRunsUsed.Should().Be(1);
        (await sut.GetByIdAsync(tenantB, CancellationToken.None))!.TrialRunsUsed.Should().Be(0);

        // Claim seat for tenant A
        await sut.TryClaimTrialSeatAsync(tenantA, "userA@contoso.com", CancellationToken.None);
        
        // Tenant A should have 1 seat used, B should remain 0
        (await sut.GetByIdAsync(tenantA, CancellationToken.None))!.TrialSeatsUsed.Should().Be(1);
        (await sut.GetByIdAsync(tenantB, CancellationToken.None))!.TrialSeatsUsed.Should().Be(0);
        
        // E2E expiration set for tenant A shouldn't affect B
        DateTimeOffset next = TimeProvider.System.GetUtcNow().AddDays(60);
        await sut.E2eHarnessSetTrialExpiresUtcAsync(tenantA, next, CancellationToken.None);
        (await sut.GetByIdAsync(tenantA, CancellationToken.None))!.TrialExpiresUtc.Should().BeCloseTo(next, TimeSpan.FromSeconds(1));
        (await sut.GetByIdAsync(tenantB, CancellationToken.None))!.TrialExpiresUtc.Should().NotBeCloseTo(next, TimeSpan.FromSeconds(1));
    }

    [SkippableFact]
    public async Task PersistTrialSignupBaselineReviewCycle_persists_correctly()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        
        Guid tenantId = Guid.NewGuid();
        
        await sut.InsertTenantAsync(tenantId, "Tenant Baseline", "t-b-" + Guid.NewGuid().ToString("N")[..8], TenantTier.Standard, null, CancellationToken.None);
        
        var captureDate = TimeProvider.System.GetUtcNow();
        await sut.PersistTrialSignupBaselineReviewCycleAsync(tenantId, 40.5m, "Survey", captureDate, CancellationToken.None);
        
        var tenant = await sut.GetByIdAsync(tenantId, CancellationToken.None);
        tenant.Should().NotBeNull();
        tenant!.BaselineReviewCycleHours.Should().Be(40.5m);
        tenant.BaselineReviewCycleSource.Should().Be("Survey");
        tenant.BaselineReviewCycleCapturedUtc.Should().BeCloseTo(captureDate, TimeSpan.FromSeconds(1));
    }

    [SkippableFact]
    public async Task SuspendTenant_SystemWithPerTenantCatalogs_dual_plane_same_catalog_still_sets_suspended_utc()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForPerTenantCatalogSameDatabaseIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        string slug = "mc-sus-" + Guid.NewGuid().ToString("N")[..8];

        await sut.InsertTenantAsync(tenantId, "MC Suspend", slug, TenantTier.Standard, null, CancellationToken.None);
        await DapperTenantRepositoryTestFactory.EnsureActiveBindingForCurrentCatalogAsync(factory, tenantId, CancellationToken.None);

        await sut.SuspendTenantAsync(tenantId, CancellationToken.None);
        (await sut.GetByIdAsync(tenantId, CancellationToken.None))!.SuspendedUtc.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task ListTrialLifecycleAutomationTenantIdsAsync_SystemWithPerTenantCatalogs_fans_out_active_binding()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForPerTenantCatalogSameDatabaseIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        string slug = "mc-auto-" + Guid.NewGuid().ToString("N")[..8];

        await sut.InsertTenantAsync(tenantId, "MC Auto", slug, TenantTier.Standard, null, CancellationToken.None);
        await DapperTenantRepositoryTestFactory.EnsureActiveBindingForCurrentCatalogAsync(factory, tenantId, CancellationToken.None);
        await sut.CommitSelfServiceTrialAsync(
            tenantId,
            TimeProvider.System.GetUtcNow().AddDays(-1),
            TimeProvider.System.GetUtcNow().AddDays(5),
            3,
            2,
            Guid.NewGuid(),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            CancellationToken.None);

        IReadOnlyList<Guid> ids = await sut.ListTrialLifecycleAutomationTenantIdsAsync(CancellationToken.None);
        ids.Should().Contain(tenantId);
    }

    [SkippableFact]
    public async Task UpdateEntraTenantIdAsync_returns_false_when_tenant_row_missing()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);

        (await sut.UpdateEntraTenantIdAsync(Guid.NewGuid(), Guid.NewGuid(), CancellationToken.None)).Should().BeFalse();
    }

    [SkippableFact]
    public async Task UpdateEntraTenantIdAsync_returns_false_when_entra_already_held_by_other_tenant()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid entra = Guid.NewGuid();
        Guid tenantA = Guid.NewGuid();
        Guid tenantB = Guid.NewGuid();

        await sut.InsertTenantAsync(tenantA, "A", "a-" + Guid.NewGuid().ToString("N")[..8], TenantTier.Standard, null, CancellationToken.None);
        await sut.InsertTenantAsync(tenantB, "B", "b-" + Guid.NewGuid().ToString("N")[..8], TenantTier.Standard, entra, CancellationToken.None);

        (await sut.UpdateEntraTenantIdAsync(tenantA, entra, CancellationToken.None)).Should().BeFalse();
    }

    [SkippableFact]
    public async Task MarkTrialConvertedAsync_preserves_existing_tier_when_newCommercialTier_null()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        string slug = "mcv-" + Guid.NewGuid().ToString("N")[..8];

        await sut.InsertTenantAsync(tenantId, "Tier hold", slug, TenantTier.Standard, null, CancellationToken.None);
        await sut.CommitSelfServiceTrialAsync(
            tenantId,
            TimeProvider.System.GetUtcNow(),
            TimeProvider.System.GetUtcNow().AddDays(2),
            5,
            2,
            Guid.NewGuid(),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            CancellationToken.None);

        await sut.MarkTrialConvertedAsync(tenantId, newCommercialTier: null, CancellationToken.None);

        TenantRecord? row = await sut.GetByIdAsync(tenantId, CancellationToken.None);
        row!.Tier.Should().Be(TenantTier.Standard);
        row.TrialStatus.Should().Be(TrialLifecycleStatus.Converted);
    }

    [SkippableFact]
    public async Task TryIncrementActiveTrialRunAsync_with_supplied_connection_increments_inside_transaction()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        string slug = "ext-" + Guid.NewGuid().ToString("N")[..8];

        await sut.InsertTenantAsync(tenantId, "Ext conn", slug, TenantTier.Standard, null, CancellationToken.None);
        await sut.CommitSelfServiceTrialAsync(
            tenantId,
            TimeProvider.System.GetUtcNow(),
            TimeProvider.System.GetUtcNow().AddDays(3),
            5,
            2,
            Guid.NewGuid(),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            CancellationToken.None);

        await using (SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None))
        {
            await using (SqlTransaction tran = (SqlTransaction)await connection.BeginTransactionAsync(CancellationToken.None))
            {
                await sut.TryIncrementActiveTrialRunAsync(tenantId, CancellationToken.None, connection, tran);
                await tran.CommitAsync(CancellationToken.None);
            }
        }

        (await sut.GetByIdAsync(tenantId, CancellationToken.None))!.TrialRunsUsed.Should().Be(1);
    }

    [SkippableFact]
    public async Task TryIncrementActiveTrialRunAsync_noops_when_tenant_row_missing()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);

        await sut.TryIncrementActiveTrialRunAsync(Guid.NewGuid(), CancellationToken.None);
    }

    [SkippableFact]
    public async Task TryClaimTrialSeatAsync_returns_quietly_when_tenant_not_on_active_trial()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        string slug = "idle-" + Guid.NewGuid().ToString("N")[..8];

        await sut.InsertTenantAsync(tenantId, "No trial", slug, TenantTier.Standard, null, CancellationToken.None);
        await sut.TryClaimTrialSeatAsync(tenantId, "user@contoso.com", CancellationToken.None);
        (await sut.GetByIdAsync(tenantId, CancellationToken.None))!.TrialSeatsUsed.Should().Be(0);
    }

    [SkippableFact]
    public async Task TryClaimTrialSeatAsync_throws_when_trial_window_expired()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        string slug = "exp-" + Guid.NewGuid().ToString("N")[..8];

        await sut.InsertTenantAsync(tenantId, "Expired trial", slug, TenantTier.Standard, null, CancellationToken.None);
        DateTimeOffset start = TimeProvider.System.GetUtcNow().AddDays(-10);
        DateTimeOffset expired = TimeProvider.System.GetUtcNow().AddDays(-1);
        await sut.CommitSelfServiceTrialAsync(
            tenantId,
            start,
            expired,
            5,
            3,
            Guid.NewGuid(),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            CancellationToken.None);

        Func<Task> act = async () => await sut.TryClaimTrialSeatAsync(tenantId, "who@contoso.com", CancellationToken.None);
        (await act.Should().ThrowAsync<TrialLimitExceededException>()).Which.Reason.Should().Be(TrialLimitReason.Expired);
    }

    [SkippableFact]
    public async Task TryClaimTrialSeatAsync_rejects_blank_principal()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);

        Func<Task> act = async () => await sut.TryClaimTrialSeatAsync(Guid.NewGuid(), " ", CancellationToken.None);
        await act.Should().ThrowAsync<ArgumentException>();
    }

    [SkippableFact]
    public async Task TryRecordTrialLifecycleTransitionAsync_rejects_blank_expected_status()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);

        Func<Task> act = async () =>
            await sut.TryRecordTrialLifecycleTransitionAsync(Guid.NewGuid(), "", TrialLifecycleStatus.Expired, "x", CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [SkippableFact]
    public async Task ListTenantIdsPendingTrialArchitecturePreseedAsync_clamps_non_positive_take()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);

        IReadOnlyList<Guid> ids = await sut.ListTenantIdsPendingTrialArchitecturePreseedAsync(0, CancellationToken.None);
        ids.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task TryMarkFirstManifestCommittedAsync_reports_zero_ratio_when_trial_runs_limit_null()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        string slug = "fm-" + Guid.NewGuid().ToString("N")[..8];

        await sut.InsertTenantAsync(tenantId, "First manifest", slug, TenantTier.Standard, null, CancellationToken.None);

        TrialFirstManifestCommitOutcome? outcome = await sut.TryMarkFirstManifestCommittedAsync(
            tenantId,
            TimeProvider.System.GetUtcNow(),
            CancellationToken.None);

        outcome.Should().NotBeNull();
        outcome!.TrialRunUsageRatio.Should().Be(0);
    }

    [SkippableFact]
    public async Task GetFirstWorkspaceAsync_returns_null_when_no_workspace_rows()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        string slug = "nows-" + Guid.NewGuid().ToString("N")[..8];

        await sut.InsertTenantAsync(tenantId, "No workspaces", slug, TenantTier.Standard, null, CancellationToken.None);

        (await sut.GetFirstWorkspaceAsync(tenantId, CancellationToken.None)).Should().BeNull();
    }

    [SkippableFact]
    public async Task TryIncrementActiveTrialRunAsync_throws_expired_when_trial_term_passed()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        string slug = "exp-run-" + Guid.NewGuid().ToString("N")[..8];
        DateTimeOffset start = TimeProvider.System.GetUtcNow().AddDays(-5);
        DateTimeOffset expired = TimeProvider.System.GetUtcNow().AddSeconds(-30);

        await sut.InsertTenantAsync(tenantId, "Expired run gate", slug, TenantTier.Standard, null, CancellationToken.None);
        await sut.CommitSelfServiceTrialAsync(
            tenantId,
            start,
            expired,
            runsLimit: 10,
            seatsLimit: 2,
            Guid.NewGuid(),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            CancellationToken.None);

        Func<Task> act = async () => await sut.TryIncrementActiveTrialRunAsync(tenantId, CancellationToken.None);
        (await act.Should().ThrowAsync<TrialLimitExceededException>()).Which.Reason.Should().Be(TrialLimitReason.Expired);
    }

    [SkippableFact]
    public async Task TryRecordTrialLifecycleTransitionAsync_rejects_blank_next_status()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);

        Func<Task> act = async () =>
            await sut.TryRecordTrialLifecycleTransitionAsync(
                Guid.NewGuid(),
                TrialLifecycleStatus.Active,
                nextStatus: "   ",
                reason: "x",
                CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [SkippableFact]
    public async Task TryMarkFirstManifestCommittedAsync_sets_usage_ratio_from_trial_runs_used_over_limit()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        string slug = "ratio-" + Guid.NewGuid().ToString("N")[..8];

        await sut.InsertTenantAsync(tenantId, "Ratio", slug, TenantTier.Standard, null, CancellationToken.None);
        await sut.CommitSelfServiceTrialAsync(
            tenantId,
            TimeProvider.System.GetUtcNow(),
            TimeProvider.System.GetUtcNow().AddDays(7),
            runsLimit: 10,
            seatsLimit: 2,
            Guid.NewGuid(),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            CancellationToken.None);
        await sut.TryIncrementActiveTrialRunAsync(tenantId, CancellationToken.None);
        await sut.TryIncrementActiveTrialRunAsync(tenantId, CancellationToken.None);
        await sut.TryIncrementActiveTrialRunAsync(tenantId, CancellationToken.None);

        TrialFirstManifestCommitOutcome? outcome = await sut.TryMarkFirstManifestCommittedAsync(
            tenantId,
            TimeProvider.System.GetUtcNow(),
            CancellationToken.None);

        outcome.Should().NotBeNull();
        outcome!.TrialRunUsageRatio.Should().BeApproximately(0.3, 0.0001);
    }

    [SkippableFact]
    public async Task DecrementEnterpriseScimSeatAsync_leaves_usage_at_zero_when_already_zero()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        string slug = "dec0-" + Guid.NewGuid().ToString("N")[..8];

        await sut.InsertTenantAsync(
            tenantId,
            "Dec at zero",
            slug,
            TenantTier.Enterprise,
            null,
            CancellationToken.None,
            enterpriseScimSeatsLimit: 5);

        await sut.DecrementEnterpriseScimSeatAsync(tenantId, CancellationToken.None);
        (await sut.GetByIdAsync(tenantId, CancellationToken.None))!.EnterpriseSeatsUsed.Should().Be(0);
    }

    [SkippableFact]
    public async Task EnqueueTrialArchitecturePreseedAsync_does_not_reschedule_after_welcome_run_recorded()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        string slug = "pre2-" + Guid.NewGuid().ToString("N")[..8];

        await sut.InsertTenantAsync(tenantId, "Pre idem", slug, TenantTier.Standard, null, CancellationToken.None);
        await sut.CommitSelfServiceTrialAsync(
            tenantId,
            TimeProvider.System.GetUtcNow(),
            TimeProvider.System.GetUtcNow().AddDays(4),
            3,
            2,
            Guid.NewGuid(),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            CancellationToken.None);

        await sut.EnqueueTrialArchitecturePreseedAsync(tenantId, CancellationToken.None);
        DateTimeOffset? firstEnqueue = (await sut.GetByIdAsync(tenantId, CancellationToken.None))!
            .TrialArchitecturePreseedEnqueuedUtc;
        firstEnqueue.Should().NotBeNull();

        await sut.MarkTrialArchitecturePreseedCompletedAsync(tenantId, Guid.NewGuid(), CancellationToken.None);
        await sut.EnqueueTrialArchitecturePreseedAsync(tenantId, CancellationToken.None);

        (await sut.GetByIdAsync(tenantId, CancellationToken.None))!.TrialArchitecturePreseedEnqueuedUtc.Should().Be(firstEnqueue);
    }

    [SkippableFact]
    public async Task MarkTrialConvertedAsync_updates_zero_rows_when_trial_not_active()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository sut = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        Guid tenantId = Guid.NewGuid();
        string slug = "macv0-" + Guid.NewGuid().ToString("N")[..8];

        await sut.InsertTenantAsync(tenantId, "No trial yet", slug, TenantTier.Standard, null, CancellationToken.None);
        await sut.MarkTrialConvertedAsync(tenantId, TenantTier.Enterprise, CancellationToken.None);

        TenantRecord? row = await sut.GetByIdAsync(tenantId, CancellationToken.None);
        row!.Tier.Should().Be(TenantTier.Standard);
        row.TrialStatus.Should().BeNull();
    }
}
