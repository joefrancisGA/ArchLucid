using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Host.Core.Services;
using ArchLucid.Persistence.Governance;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PolicyPackWorkflowFacadeTests
{
    private static readonly ScopeContext CallerScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task TryPublishVersionAsync_returns_null_when_pack_is_out_of_scope()
    {
        Guid foreignPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(foreignPackId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPack
                {
                    PolicyPackId = foreignPackId,
                    TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    Name = "foreign-pack",
                    CurrentVersion = "1.0.0",
                    IsDeleted = false,
                });

        Mock<IPolicyPacksAppService> appService = new(MockBehavior.Strict);

        PolicyPackWorkflowFacade sut = CreateSut(packs.Object, appService: appService.Object);

        PolicyPackVersion? result = await sut.TryPublishVersionAsync(
            foreignPackId,
            "2.0.0",
            """{"complianceRuleIds":[]}""",
            CancellationToken.None);

        result.Should().BeNull();
        appService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task TryAssignAsync_returns_pack_not_found_when_pack_is_out_of_scope()
    {
        Guid foreignPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(foreignPackId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPack
                {
                    PolicyPackId = foreignPackId,
                    TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    Name = "foreign-pack",
                    CurrentVersion = "1.0.0",
                    IsDeleted = false,
                });

        PolicyPackWorkflowFacade sut = CreateSut(packs.Object);

        PolicyPackAssignWorkflowResult result = await sut.TryAssignAsync(
            foreignPackId,
            "1.0.0",
            "Project",
            false,
            false,
            CancellationToken.None);

        result.Outcome.Should().Be(PolicyPackAssignOutcome.PackNotFound);
        result.Assignment.Should().BeNull();
    }

    [Fact]
    public async Task TryDuplicatePackAsync_returns_null_when_pack_is_out_of_scope()
    {
        Guid foreignPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(foreignPackId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPack
                {
                    PolicyPackId = foreignPackId,
                    TenantId = CallerScope.TenantId,
                    WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    Name = "foreign-workspace-pack",
                    CurrentVersion = "1.0.0",
                    IsDeleted = false,
                });

        Mock<IPolicyPacksAppService> appService = new(MockBehavior.Strict);

        PolicyPackWorkflowFacade sut = CreateSut(packs.Object, appService: appService.Object);

        PolicyPack? result = await sut.TryDuplicatePackAsync(foreignPackId, CancellationToken.None);

        result.Should().BeNull();
        appService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task TrySoftDeletePackAsync_returns_false_when_pack_is_out_of_scope()
    {
        Guid foreignPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(foreignPackId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPack
                {
                    PolicyPackId = foreignPackId,
                    TenantId = CallerScope.TenantId,
                    WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    Name = "foreign-workspace-pack",
                    CurrentVersion = "1.0.0",
                    IsDeleted = false,
                });

        Mock<IPolicyPacksAppService> appService = new(MockBehavior.Strict);

        PolicyPackWorkflowFacade sut = CreateSut(packs.Object, appService: appService.Object);

        bool result = await sut.TrySoftDeletePackAsync(foreignPackId, CancellationToken.None);

        result.Should().BeFalse();
        appService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task TryArchiveAssignmentAsync_returns_false_when_assignment_is_out_of_scope()
    {
        Guid assignmentId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .Setup(r => r.GetByTenantAndAssignmentIdAsync(CallerScope.TenantId, assignmentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPackAssignment
                {
                    AssignmentId = assignmentId,
                    TenantId = CallerScope.TenantId,
                    WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    PolicyPackId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                    PolicyPackVersion = "1.0.0",
                });

        Mock<IPolicyPacksAppService> appService = new(MockBehavior.Strict);

        PolicyPackWorkflowFacade sut = CreateSut(
            Mock.Of<IPolicyPackRepository>(),
            assignments: assignments.Object,
            appService: appService.Object);

        bool result = await sut.TryArchiveAssignmentAsync(assignmentId, CancellationToken.None);

        result.Should().BeFalse();
        appService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task TryArchiveAssignmentAsync_returns_false_when_assignment_is_organization_required()
    {
        Guid assignmentId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .Setup(r => r.GetByTenantAndAssignmentIdAsync(CallerScope.TenantId, assignmentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPackAssignment
                {
                    AssignmentId = assignmentId,
                    TenantId = CallerScope.TenantId,
                    WorkspaceId = CallerScope.WorkspaceId,
                    ProjectId = CallerScope.ProjectId,
                    PolicyPackId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                    PolicyPackVersion = "1.0.0",
                    IsOrganizationRequired = true,
                });

        Mock<IPolicyPacksAppService> appService = new(MockBehavior.Strict);

        PolicyPackWorkflowFacade sut = CreateSut(
            Mock.Of<IPolicyPackRepository>(),
            assignments: assignments.Object,
            appService: appService.Object);

        bool result = await sut.TryArchiveAssignmentAsync(assignmentId, CancellationToken.None);

        result.Should().BeFalse();
        appService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task TrySimulateBulkAsync_reports_distinct_requested_run_count_when_run_ids_are_duplicated()
    {
        Guid packId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        PolicyPack pack = CreateInScopePack(packId);
        PolicyPackVersion version = new()
        {
            PolicyPackId = packId,
            Version = "1.0.0",
            ContentJson = """{"complianceRuleIds":[]}""",
        };

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pack);

        Mock<IPolicyPackVersionRepository> versions = new();
        versions
            .Setup(r => r.GetByPackAndVersionAsync(packId, "1.0.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(version);

        Mock<IPolicyPackGovernanceDryRunService> dryRun = new();
        dryRun
            .Setup(s => s.EvaluateAsync(
                version.ContentJson,
                "run-1",
                null,
                It.IsAny<bool?>(),
                It.IsAny<int?>(),
                packId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPackGovernanceDryRunResult
                {
                    ResolvedRunId = "run-1",
                    GateResult = new PreCommitGateResult { Blocked = false },
                });

        PolicyPackWorkflowFacade sut = CreateSut(
            packs.Object,
            versions: versions.Object,
            dryRun: dryRun.Object);

        PolicyPackSimulateBulkSummary? summary = await sut.TrySimulateBulkAsync(
            packId,
            ["run-1", "run-1", "RUN-1"],
            blockCommitOnCritical: null,
            blockCommitMinimumSeverity: null,
            CancellationToken.None);

        summary.Should().NotBeNull();
        summary!.RequestedRunCount.Should().Be(1);
        summary.EvaluatedRunCount.Should().Be(1);
        summary.Results.Should().ContainSingle(result => result.RunId == "run-1");

        dryRun.Verify(
            s => s.EvaluateAsync(
                version.ContentJson,
                "run-1",
                null,
                It.IsAny<bool?>(),
                It.IsAny<int?>(),
                packId,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TrySimulateBulkAsync_deduplicates_padded_run_ids_before_evaluation()
    {
        Guid packId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        PolicyPack pack = CreateInScopePack(packId);
        PolicyPackVersion version = new()
        {
            PolicyPackId = packId,
            Version = "1.0.0",
            ContentJson = """{"complianceRuleIds":[]}""",
        };

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pack);

        Mock<IPolicyPackVersionRepository> versions = new();
        versions
            .Setup(r => r.GetByPackAndVersionAsync(packId, "1.0.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(version);

        Mock<IPolicyPackGovernanceDryRunService> dryRun = new();
        dryRun
            .Setup(s => s.EvaluateAsync(
                version.ContentJson,
                "run-1",
                null,
                It.IsAny<bool?>(),
                It.IsAny<int?>(),
                packId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPackGovernanceDryRunResult
                {
                    ResolvedRunId = "run-1",
                    GateResult = new PreCommitGateResult { Blocked = false },
                });

        PolicyPackWorkflowFacade sut = CreateSut(
            packs.Object,
            versions: versions.Object,
            dryRun: dryRun.Object);

        PolicyPackSimulateBulkSummary? summary = await sut.TrySimulateBulkAsync(
            packId,
            [" run-1 ", "run-1"],
            blockCommitOnCritical: null,
            blockCommitMinimumSeverity: null,
            CancellationToken.None);

        summary.Should().NotBeNull();
        summary!.RequestedRunCount.Should().Be(1);
        summary.EvaluatedRunCount.Should().Be(1);
        summary.Results.Should().ContainSingle(result => result.RunId == "run-1");

        dryRun.Verify(
            s => s.EvaluateAsync(
                version.ContentJson,
                "run-1",
                null,
                It.IsAny<bool?>(),
                It.IsAny<int?>(),
                packId,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TrySimulateBulkAsync_returns_null_when_pack_has_no_versions()
    {
        Guid packId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        PolicyPack pack = CreateInScopePack(packId);

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pack);

        Mock<IPolicyPackVersionRepository> versions = new();
        versions
            .Setup(r => r.GetByPackAndVersionAsync(packId, "1.0.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyPackVersion?)null);
        versions
            .Setup(r => r.ListByPackAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IPolicyPackGovernanceDryRunService> dryRun = new(MockBehavior.Strict);

        PolicyPackWorkflowFacade sut = CreateSut(
            packs.Object,
            versions: versions.Object,
            dryRun: dryRun.Object);

        PolicyPackSimulateBulkSummary? summary = await sut.TrySimulateBulkAsync(
            packId,
            ["run-1"],
            blockCommitOnCritical: null,
            blockCommitMinimumSeverity: null,
            CancellationToken.None);

        summary.Should().BeNull();
        dryRun.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ListVisiblePacksAsync_filters_deleted_and_inactive_platform_packs()
    {
        Guid activePackId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid deletedPackId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid inactivePackId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.ListByScopeAsync(
                CallerScope.TenantId,
                CallerScope.WorkspaceId,
                CallerScope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                CreateInScopePack(activePackId),
                new PolicyPack
                {
                    PolicyPackId = deletedPackId,
                    TenantId = CallerScope.TenantId,
                    WorkspaceId = CallerScope.WorkspaceId,
                    ProjectId = CallerScope.ProjectId,
                    Name = "deleted-pack",
                    CurrentVersion = "1.0.0",
                    IsDeleted = true,
                },
                new PolicyPack
                {
                    PolicyPackId = inactivePackId,
                    TenantId = CallerScope.TenantId,
                    WorkspaceId = CallerScope.WorkspaceId,
                    ProjectId = CallerScope.ProjectId,
                    Name = "inactive-pack",
                    CurrentVersion = "1.0.0",
                    IsDeleted = false,
                },
            ]);

        Mock<IPlatformBundledPolicyPackAvailability> platformAvailability = new();
        platformAvailability
            .Setup(p => p.IsGloballyActiveAsync(It.IsAny<PolicyPack>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        platformAvailability
            .Setup(p => p.IsGloballyActiveAsync(
                It.Is<PolicyPack>(pack => pack.PolicyPackId == inactivePackId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        PolicyPackWorkflowFacade sut = CreateSut(
            packs.Object,
            platformAvailability: platformAvailability.Object);

        IReadOnlyList<PolicyPack> visible = await sut.ListVisiblePacksAsync(CancellationToken.None);

        visible.Should().ContainSingle(pack => pack.PolicyPackId == activePackId);
    }

    [Fact]
    public async Task TryDemoteCatalogEntryAsync_returns_false_when_source_pack_is_out_of_scope()
    {
        Guid foreignSourcePackId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        InMemoryPolicyPackCatalogRepository catalog = new();
        PolicyPackCatalogEntryDetail promoted = await catalog.UpsertPromotedFromSnapshotAsync(
            foreignSourcePackId,
            "Foreign",
            "desc",
            PolicyPackType.ProjectCustom,
            "1.0.0",
            """{"complianceRuleKeys":["k"],"complianceRuleIds":[],"alertRuleIds":[],"compositeAlertRuleIds":[],"advisoryDefaults":{},"metadata":{}}""",
            CancellationToken.None);

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(foreignSourcePackId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPack
            {
                PolicyPackId = foreignSourcePackId,
                TenantId = Guid.Parse("99999999-9999-9999-9999-999999999999"),
                WorkspaceId = Guid.Parse("88888888-8888-8888-8888-888888888888"),
                ProjectId = Guid.Parse("77777777-7777-7777-7777-777777777777"),
                Name = "foreign-pack",
                CurrentVersion = "1.0.0",
                IsDeleted = false,
            });

        PolicyPackCatalogAdminService catalogAdmin = new(
            packs.Object,
            Mock.Of<IPolicyPackVersionRepository>(),
            catalog);

        PolicyPackWorkflowFacade sut = CreateCatalogDemoteSut(catalog, catalogAdmin, Mock.Of<IAuditService>(), packs.Object);

        bool demoted = await sut.TryDemoteCatalogEntryAsync(promoted.PolicyPackCatalogEntryId, CancellationToken.None);

        demoted.Should().BeFalse();
        (await catalog.GetPromotedDetailByIdAsync(promoted.PolicyPackCatalogEntryId, CancellationToken.None))
            .Should()
            .NotBeNull();
    }

    [Fact]
    public async Task TryDemoteCatalogEntryAsync_skips_duplicate_audit_when_already_demoted_retry()
    {
        InMemoryPolicyPackCatalogRepository catalog = new();
        PolicyPackCatalogEntryDetail promoted = await catalog.UpsertPromotedFromSnapshotAsync(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            "Demo",
            "desc",
            PolicyPackType.ProjectCustom,
            "1.0.0",
            """{"complianceRuleKeys":["k"],"complianceRuleIds":[],"alertRuleIds":[],"compositeAlertRuleIds":[],"advisoryDefaults":{},"metadata":{}}""",
            CancellationToken.None);

        PolicyPackCatalogAdminService catalogAdmin = new(
            Mock.Of<IPolicyPackRepository>(),
            Mock.Of<IPolicyPackVersionRepository>(),
            catalog);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        PolicyPackWorkflowFacade sut = CreateCatalogDemoteSut(catalog, catalogAdmin, audit.Object, packs: null);

        bool first = await sut.TryDemoteCatalogEntryAsync(promoted.PolicyPackCatalogEntryId, CancellationToken.None);
        bool second = await sut.TryDemoteCatalogEntryAsync(promoted.PolicyPackCatalogEntryId, CancellationToken.None);

        first.Should().BeTrue();
        second.Should().BeTrue();
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.PolicyPackCatalogDemoted),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TrySetAssignmentEnabledAsync_skips_duplicate_audit_when_value_unchanged_retry()
    {
        Guid assignmentId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid packId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        PolicyPackAssignment assignment = new()
        {
            AssignmentId = assignmentId,
            TenantId = CallerScope.TenantId,
            WorkspaceId = CallerScope.WorkspaceId,
            ProjectId = CallerScope.ProjectId,
            PolicyPackId = packId,
            PolicyPackVersion = "1.0.0",
            IsEnabled = true,
            IsOrganizationRequired = false,
        };

        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .Setup(r => r.GetByTenantAndAssignmentIdAsync(CallerScope.TenantId, assignmentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(assignment);

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateInScopePack(packId));

        Mock<IPlatformBundledPolicyPackAvailability> platform = new();
        platform
            .Setup(p => p.IsGloballyActiveAsync(It.IsAny<PolicyPack>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        PolicyPackWorkflowFacade sut = CreateAssignmentToggleSut(
            packs.Object,
            assignments.Object,
            platform.Object,
            audit.Object);

        bool first = await sut.TrySetAssignmentEnabledAsync(assignmentId, true, CancellationToken.None);
        bool second = await sut.TrySetAssignmentEnabledAsync(assignmentId, true, CancellationToken.None);

        first.Should().BeTrue();
        second.Should().BeTrue();
        assignments.Verify(
            r => r.UpdateAsync(It.IsAny<PolicyPackAssignment>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.PolicyPackAssignmentEnabledChanged),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TrySetAssignmentOrganizationRequiredAsync_skips_duplicate_audit_when_value_unchanged_retry()
    {
        Guid assignmentId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid packId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        PolicyPackAssignment assignment = new()
        {
            AssignmentId = assignmentId,
            TenantId = CallerScope.TenantId,
            WorkspaceId = CallerScope.WorkspaceId,
            ProjectId = CallerScope.ProjectId,
            PolicyPackId = packId,
            PolicyPackVersion = "1.0.0",
            IsEnabled = true,
            IsOrganizationRequired = true,
        };

        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .Setup(r => r.GetByTenantAndAssignmentIdAsync(CallerScope.TenantId, assignmentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(assignment);

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateInScopePack(packId));

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        PolicyPackWorkflowFacade sut = CreateAssignmentToggleSut(
            packs.Object,
            assignments.Object,
            Mock.Of<IPlatformBundledPolicyPackAvailability>(),
            audit.Object);

        bool first = await sut.TrySetAssignmentOrganizationRequiredAsync(assignmentId, true, CancellationToken.None);
        bool second = await sut.TrySetAssignmentOrganizationRequiredAsync(assignmentId, true, CancellationToken.None);

        first.Should().BeTrue();
        second.Should().BeTrue();
        assignments.Verify(
            r => r.UpdateAsync(It.IsAny<PolicyPackAssignment>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.PolicyPackAssignmentOrganizationRequiredChanged),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryPromoteCatalogEntryAsync_skips_duplicate_audit_when_identical_promote_retry()
    {
        Guid sourcePackId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        const string version = "1.0.0";
        const string contentJson = """{"complianceRuleKeys":["k"],"complianceRuleIds":[],"alertRuleIds":[],"compositeAlertRuleIds":[],"advisoryDefaults":{},"metadata":{}}""";

        PolicyPack pack = CreateInScopePack(sourcePackId);
        pack.PackType = PolicyPackType.BuiltIn;
        pack.DistributionScope = PolicyPackDistributionScope.Platform;
        pack.CurrentVersion = version;
        pack.Description = "desc";

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(sourcePackId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pack);

        Mock<IPolicyPackVersionRepository> versions = new();
        versions
            .Setup(v => v.GetByPackAndVersionAsync(sourcePackId, version, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackVersion { PolicyPackId = sourcePackId, Version = version, ContentJson = contentJson });

        InMemoryPolicyPackCatalogRepository catalog = new();
        PolicyPackCatalogAdminService catalogAdmin = new(packs.Object, versions.Object, catalog);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        PolicyPackWorkflowFacade sut = CreateCatalogPromoteSut(catalog, catalogAdmin, audit.Object);

        PolicyPackCatalogEntryDetail? first = await sut.TryPromoteCatalogEntryAsync(sourcePackId, version, CancellationToken.None);
        PolicyPackCatalogEntryDetail? second = await sut.TryPromoteCatalogEntryAsync(sourcePackId, version, CancellationToken.None);

        first.Should().NotBeNull();
        second.Should().NotBeNull();
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.PolicyPackCatalogPromoted),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TryPromoteCatalogEntryAsync_skips_duplicate_audit_when_snapshot_version_differs_only_by_casing()
    {
        Guid sourcePackId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        const string storedVersion = "V1.0.0";
        const string retryVersion = "v1.0.0";
        const string contentJson = """{"complianceRuleKeys":["k"],"complianceRuleIds":[],"alertRuleIds":[],"compositeAlertRuleIds":[],"advisoryDefaults":{},"metadata":{}}""";

        PolicyPack pack = CreateInScopePack(sourcePackId);
        pack.PackType = PolicyPackType.BuiltIn;
        pack.DistributionScope = PolicyPackDistributionScope.Platform;
        pack.CurrentVersion = storedVersion;
        pack.Description = "desc";

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(sourcePackId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pack);

        Mock<IPolicyPackVersionRepository> versions = new();
        versions
            .Setup(v => v.GetByPackAndVersionAsync(sourcePackId, storedVersion, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackVersion { PolicyPackId = sourcePackId, Version = storedVersion, ContentJson = contentJson });
        versions
            .Setup(v => v.GetByPackAndVersionAsync(sourcePackId, retryVersion, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackVersion { PolicyPackId = sourcePackId, Version = storedVersion, ContentJson = contentJson });

        InMemoryPolicyPackCatalogRepository catalog = new();
        PolicyPackCatalogAdminService catalogAdmin = new(packs.Object, versions.Object, catalog);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        PolicyPackWorkflowFacade sut = CreateCatalogPromoteSut(catalog, catalogAdmin, audit.Object);

        await sut.TryPromoteCatalogEntryAsync(sourcePackId, storedVersion, CancellationToken.None);
        await sut.TryPromoteCatalogEntryAsync(sourcePackId, retryVersion, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.PolicyPackCatalogPromoted),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static PolicyPack CreateInScopePack(Guid packId) =>
        new()
        {
            PolicyPackId = packId,
            TenantId = CallerScope.TenantId,
            WorkspaceId = CallerScope.WorkspaceId,
            ProjectId = CallerScope.ProjectId,
            Name = "in-scope-pack",
            CurrentVersion = "1.0.0",
            IsDeleted = false,
        };

    private static PolicyPackWorkflowFacade CreateSut(
        IPolicyPackRepository packRepository,
        IPolicyPackVersionRepository? versions = null,
        IPolicyPacksAppService? appService = null,
        IPolicyPackGovernanceDryRunService? dryRun = null,
        IPlatformBundledPolicyPackAvailability? platformAvailability = null,
        IPolicyPackAssignmentRepository? assignments = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(CallerScope);

        return new PolicyPackWorkflowFacade(
            scopeProvider.Object,
            packRepository,
            assignments ?? Mock.Of<IPolicyPackAssignmentRepository>(),
            versions ?? Mock.Of<IPolicyPackVersionRepository>(),
            Mock.Of<IPolicyPackCatalogRepository>(),
            Mock.Of<ArchLucid.Decisioning.Governance.PolicyPacks.IPolicyPackResolver>(),
            Mock.Of<ArchLucid.Decisioning.Governance.PolicyPacks.IEffectiveGovernanceLoader>(),
            appService ?? Mock.Of<IPolicyPacksAppService>(),
            Mock.Of<IPolicyPackCatalogAdminService>(),
            dryRun ?? Mock.Of<IPolicyPackGovernanceDryRunService>(),
            Mock.Of<IPolicyPackMarkdownExplainService>(),
            Mock.Of<IPolicyPackRuleTemplatesService>(),
            Mock.Of<IPolicyPackContentAuthoringValidationService>(),
            new PolicyPackWorkspaceSelectionService(
                packRepository,
                assignments ?? Mock.Of<IPolicyPackAssignmentRepository>(),
                platformAvailability ?? Mock.Of<IPlatformBundledPolicyPackAvailability>(),
                Mock.Of<IPolicyPackResolverCacheInvalidator>()),
            platformAvailability ?? Mock.Of<IPlatformBundledPolicyPackAvailability>(),
            Mock.Of<IAuditService>());
    }

    private static PolicyPackWorkflowFacade CreateCatalogDemoteSut(
        IPolicyPackCatalogRepository catalogRepository,
        IPolicyPackCatalogAdminService catalogAdminService,
        IAuditService auditService,
        IPolicyPackRepository? packs = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(CallerScope);

        IPolicyPackRepository packRepository = packs ?? CreateInScopePackRepository();

        return new PolicyPackWorkflowFacade(
            scopeProvider.Object,
            packRepository,
            Mock.Of<IPolicyPackAssignmentRepository>(),
            Mock.Of<IPolicyPackVersionRepository>(),
            catalogRepository,
            Mock.Of<ArchLucid.Decisioning.Governance.PolicyPacks.IPolicyPackResolver>(),
            Mock.Of<ArchLucid.Decisioning.Governance.PolicyPacks.IEffectiveGovernanceLoader>(),
            Mock.Of<IPolicyPacksAppService>(),
            catalogAdminService,
            Mock.Of<IPolicyPackGovernanceDryRunService>(),
            Mock.Of<IPolicyPackMarkdownExplainService>(),
            Mock.Of<IPolicyPackRuleTemplatesService>(),
            Mock.Of<IPolicyPackContentAuthoringValidationService>(),
            new PolicyPackWorkspaceSelectionService(
                Mock.Of<IPolicyPackRepository>(),
                Mock.Of<IPolicyPackAssignmentRepository>(),
                Mock.Of<IPlatformBundledPolicyPackAvailability>(),
                Mock.Of<IPolicyPackResolverCacheInvalidator>()),
            Mock.Of<IPlatformBundledPolicyPackAvailability>(),
            auditService);
    }

    private static IPolicyPackRepository CreateInScopePackRepository()
    {
        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid packId, CancellationToken _) => CreateInScopePack(packId));

        return packs.Object;
    }

    private static PolicyPackWorkflowFacade CreateAssignmentToggleSut(
        IPolicyPackRepository packRepository,
        IPolicyPackAssignmentRepository assignmentRepository,
        IPlatformBundledPolicyPackAvailability platformAvailability,
        IAuditService auditService)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(CallerScope);

        return new PolicyPackWorkflowFacade(
            scopeProvider.Object,
            packRepository,
            assignmentRepository,
            Mock.Of<IPolicyPackVersionRepository>(),
            Mock.Of<IPolicyPackCatalogRepository>(),
            Mock.Of<ArchLucid.Decisioning.Governance.PolicyPacks.IPolicyPackResolver>(),
            Mock.Of<ArchLucid.Decisioning.Governance.PolicyPacks.IEffectiveGovernanceLoader>(),
            Mock.Of<IPolicyPacksAppService>(),
            Mock.Of<IPolicyPackCatalogAdminService>(),
            Mock.Of<IPolicyPackGovernanceDryRunService>(),
            Mock.Of<IPolicyPackMarkdownExplainService>(),
            Mock.Of<IPolicyPackRuleTemplatesService>(),
            Mock.Of<IPolicyPackContentAuthoringValidationService>(),
            new PolicyPackWorkspaceSelectionService(
                packRepository,
                assignmentRepository,
                platformAvailability,
                Mock.Of<IPolicyPackResolverCacheInvalidator>()),
            platformAvailability,
            auditService);
    }

    private static PolicyPackWorkflowFacade CreateCatalogPromoteSut(
        IPolicyPackCatalogRepository catalogRepository,
        IPolicyPackCatalogAdminService catalogAdminService,
        IAuditService auditService)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(CallerScope);

        return new PolicyPackWorkflowFacade(
            scopeProvider.Object,
            Mock.Of<IPolicyPackRepository>(),
            Mock.Of<IPolicyPackAssignmentRepository>(),
            Mock.Of<IPolicyPackVersionRepository>(),
            catalogRepository,
            Mock.Of<ArchLucid.Decisioning.Governance.PolicyPacks.IPolicyPackResolver>(),
            Mock.Of<ArchLucid.Decisioning.Governance.PolicyPacks.IEffectiveGovernanceLoader>(),
            Mock.Of<IPolicyPacksAppService>(),
            catalogAdminService,
            Mock.Of<IPolicyPackGovernanceDryRunService>(),
            Mock.Of<IPolicyPackMarkdownExplainService>(),
            Mock.Of<IPolicyPackRuleTemplatesService>(),
            Mock.Of<IPolicyPackContentAuthoringValidationService>(),
            new PolicyPackWorkspaceSelectionService(
                Mock.Of<IPolicyPackRepository>(),
                Mock.Of<IPolicyPackAssignmentRepository>(),
                Mock.Of<IPlatformBundledPolicyPackAvailability>(),
                Mock.Of<IPolicyPackResolverCacheInvalidator>()),
            Mock.Of<IPlatformBundledPolicyPackAvailability>(),
            auditService);
    }
}
