using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryTenantRepositoryErasureCoverageTests
{
    [Fact]
    public async Task GetByNormalizedOrganizationName_and_control_plane_aliases_resolve_inserted_tenant()
    {
        InMemoryTenantRepository sut = new();
        Guid id = Guid.NewGuid();
        string slug = "erase-org-" + Guid.NewGuid().ToString("N")[..8];
        await sut.InsertTenantAsync(
            id,
            "Erase Org Alpha",
            slug,
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        (await sut.GetByNormalizedOrganizationNameAsync("ERASE ORG ALPHA", CancellationToken.None))!.Id
            .Should()
            .Be(id);
        (await sut.GetByIdFromControlPlaneCatalogAsync(id, CancellationToken.None))!.Id.Should().Be(id);
        (await sut.GetBySlugFromControlPlaneCatalogAsync(slug, CancellationToken.None))!.Id.Should().Be(id);
    }

    [Fact]
    public async Task Erasure_offboard_approve_legal_hold_restore_and_list_paths_round_trip()
    {
        InMemoryTenantRepository sut = new();
        Guid id = Guid.NewGuid();
        await sut.InsertTenantAsync(
            id,
            "Erase Flow",
            "erase-flow-" + Guid.NewGuid().ToString("N")[..8],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        DateTimeOffset offboarded = now.AddMinutes(-5);
        DateTimeOffset eligible = now.AddDays(-1);

        (await sut.TryStartTenantErasureOffboardAsync(id, offboarded, eligible, CancellationToken.None))
            .Should()
            .BeTrue();
        (await sut.TryStartTenantErasureOffboardAsync(id, offboarded, eligible, CancellationToken.None))
            .Should()
            .BeFalse();

        (await sut.TryApproveTenantErasureAsync(id, now, "admin@example.com", CancellationToken.None))
            .Should()
            .BeTrue();
        (await sut.TryApproveTenantErasureAsync(id, now, "admin@example.com", CancellationToken.None))
            .Should()
            .BeFalse();

        (await sut.TrySetTenantErasureLegalHoldAsync(
                id,
                legalHoldUntilUtc: now.AddDays(2),
                utcNow: now,
                reason: "litigation",
                legalHoldSetByUserId: "counsel",
                CancellationToken.None))
            .Should()
            .BeTrue();
        (await sut.TrySetTenantErasureLegalHoldAsync(
                id,
                legalHoldUntilUtc: now.AddMinutes(-1),
                utcNow: now,
                reason: "stale",
                legalHoldSetByUserId: "counsel",
                CancellationToken.None))
            .Should()
            .BeFalse();

        TenantRecord held = (await sut.GetByIdAsync(id, CancellationToken.None))!;
        held.LegalHoldUntilUtc.Should().NotBeNull();
        held.LegalHoldReason.Should().Be("litigation");

        (await sut.TryClearTenantErasureLegalHoldAsync(id, CancellationToken.None)).Should().BeTrue();
        (await sut.TryClearTenantErasureLegalHoldAsync(id, CancellationToken.None)).Should().BeFalse();

        IReadOnlyList<Guid> purgeEligible =
            await sut.ListTenantIdsEligibleForScheduledHardPurgeAsync(now.AddDays(1), take: 10, CancellationToken.None);
        purgeEligible.Should().Contain(id);

        IReadOnlyList<Guid> orphanCleanup =
            await sut.ListTenantIdsForOrphanedCatalogCleanupAsync(
                utcNow: now.AddDays(1),
                erasureRequestedOnOrBefore: now.AddDays(1),
                take: 10,
                CancellationToken.None);
        orphanCleanup.Should().Contain(id);

        (await sut.TryRestoreTenantErasureQuarantineAsync(id, CancellationToken.None)).Should().BeTrue();
        (await sut.GetByIdAsync(id, CancellationToken.None))!.OffboardedUtc.Should().BeNull();
        (await sut.TryRestoreTenantErasureQuarantineAsync(id, CancellationToken.None)).Should().BeFalse();
    }

    [Fact]
    public async Task ListWorkspaces_after_insert_returns_workspace_link()
    {
        InMemoryTenantRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        await sut.InsertTenantAsync(
            tenantId,
            "WS Org",
            "ws-org-" + Guid.NewGuid().ToString("N")[..8],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);
        await sut.InsertWorkspaceAsync(workspaceId, tenantId, "Default", projectId, CancellationToken.None);

        TenantWorkspaceLink? first = await sut.GetFirstWorkspaceAsync(tenantId, CancellationToken.None);
        first.Should().NotBeNull();
        first!.WorkspaceId.Should().Be(workspaceId);
        first.DefaultProjectId.Should().Be(projectId);

        IReadOnlyList<TenantWorkspaceListItem> listed =
            await sut.ListWorkspacesAsync(tenantId, CancellationToken.None);
        listed.Should().ContainSingle(w => w.WorkspaceId == workspaceId && w.Name == "Default");
    }

    [Fact]
    public async Task TryIncrementActiveTrialRun_and_lifecycle_transition_cover_active_trial_branches()
    {
        InMemoryTenantRepository sut = new();
        Guid id = Guid.NewGuid();
        await sut.InsertTenantAsync(
            id,
            "Trial Runs",
            "trial-runs-" + Guid.NewGuid().ToString("N")[..8],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        DateTimeOffset start = TimeProvider.System.GetUtcNow();
        await sut.CommitSelfServiceTrialAsync(
            id,
            start,
            start.AddDays(14),
            runsLimit: 2,
            seatsLimit: 2,
            sampleRunId: Guid.NewGuid(),
            baselineReviewCycleHours: null,
            baselineReviewCycleSource: null,
            baselineReviewCycleCapturedUtc: null,
            companySize: null,
            architectureTeamSize: null,
            industryVertical: null,
            industryVerticalOther: null,
            CancellationToken.None);

        await sut.TryIncrementActiveTrialRunAsync(id, CancellationToken.None);
        (await sut.GetByIdAsync(id, CancellationToken.None))!.TrialRunsUsed.Should().Be(1);

        (await sut.TryRecordTrialLifecycleTransitionAsync(
                id,
                expectedCurrentStatus: TrialLifecycleStatus.Active,
                nextStatus: TrialLifecycleStatus.Expired,
                reason: "window-ended",
                CancellationToken.None))
            .Should()
            .BeTrue();

        IReadOnlyList<Guid> automationIds =
            await sut.ListTrialLifecycleAutomationTenantIdsAsync(CancellationToken.None);
        automationIds.Should().Contain(id);

        TrialFirstManifestCommitOutcome? first =
            await sut.TryMarkFirstManifestCommittedAsync(id, start.AddHours(2), CancellationToken.None);
        first.Should().NotBeNull();
        first!.SignupToCommitSeconds.Should().BeGreaterThan(0);
        (await sut.TryMarkFirstManifestCommittedAsync(id, start.AddHours(3), CancellationToken.None))
            .Should()
            .BeNull();
    }
}
