using ArchLucid.Application;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.Resolution;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Repositories;
using ArchLucid.Decisioning.Validation;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PreCommitGovernanceGateTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [SkippableFact]
    public async Task EvaluateAsync_blocks_when_critical_findings_and_assignment_enforces()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("N");
        Guid snapshotId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ProjectId = "default",
                ArchitectureRequestId = "req-1",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = snapshotId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        InMemoryFindingsSnapshotRepository findings = new();
        await findings.SaveAsync(
            new FindingsSnapshot
            {
                FindingsSnapshotId = snapshotId,
                RunId = runGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                Findings =
                [
                    new Finding
                    {
                        FindingId = "f-critical",
                        FindingType = "Compliance",
                        Category = "c",
                        EngineType = "e",
                        Severity = FindingSeverity.Critical,
                        Title = "t",
                        Rationale = "r",
                    },
                ],
            },
            CancellationToken.None);

        InMemoryPolicyPackAssignmentRepository assignments = new();
        await assignments.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ProjectId = TestScope.ProjectId,
                ScopeLevel = GovernanceScopeLevel.Project,
                PolicyPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                PolicyPackVersion = "1.0.0",
                IsEnabled = true,
                BlockCommitOnCritical = true,
            },
            CancellationToken.None);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        PreCommitGovernanceGate sut = CreateGate(
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            scopeProvider.Object,
            runs,
            findings,
            assignments);

        PreCommitGateResult r = await sut.EvaluateAsync(runId, CancellationToken.None);

        r.Blocked.Should().BeTrue();
        r.BlockingFindingIds.Should().ContainSingle().Which.Should().Be("f-critical");
    }

    [SkippableFact]
    public async Task EvaluateAsync_allows_when_no_critical_findings()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("N");
        Guid snapshotId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ProjectId = "default",
                ArchitectureRequestId = "req-1",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = snapshotId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        InMemoryFindingsSnapshotRepository findings = new();
        await findings.SaveAsync(
            new FindingsSnapshot
            {
                FindingsSnapshotId = snapshotId,
                RunId = runGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                Findings =
                [
                    new Finding
                    {
                        FindingId = "f-warn",
                        FindingType = "Compliance",
                        Category = "c",
                        EngineType = "e",
                        Severity = FindingSeverity.Warning,
                        Title = "t",
                        Rationale = "r",
                    },
                ],
            },
            CancellationToken.None);

        InMemoryPolicyPackAssignmentRepository assignments = new();
        await assignments.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ProjectId = TestScope.ProjectId,
                ScopeLevel = GovernanceScopeLevel.Project,
                PolicyPackId = Guid.NewGuid(),
                PolicyPackVersion = "1.0.0",
                IsEnabled = true,
                BlockCommitOnCritical = true,
            },
            CancellationToken.None);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        PreCommitGovernanceGate sut = CreateGate(
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            scopeProvider.Object,
            runs,
            findings,
            assignments);

        PreCommitGateResult r = await sut.EvaluateAsync(runId, CancellationToken.None);

        r.Blocked.Should().BeFalse();
    }

    [SkippableFact]
    public async Task EvaluateAsync_allows_when_gate_disabled_in_options()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        PreCommitGovernanceGate sut = CreateGate(
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = false }),
            scopeProvider.Object,
            new InMemoryRunRepository(),
            new InMemoryFindingsSnapshotRepository(),
            new InMemoryPolicyPackAssignmentRepository());

        PreCommitGateResult r = await sut.EvaluateAsync(Guid.NewGuid().ToString("N"), CancellationToken.None);

        r.Blocked.Should().BeFalse();
        scopeProvider.Verify(s => s.GetCurrentScope(), Times.Never);
    }

    [SkippableFact]
    public async Task EvaluateAsync_allows_when_runId_is_not_parseable_guid()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        PreCommitGovernanceGate sut = CreateGate(
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            scopeProvider.Object,
            new InMemoryRunRepository(),
            new InMemoryFindingsSnapshotRepository(),
            new InMemoryPolicyPackAssignmentRepository());

        PreCommitGateResult r = await sut.EvaluateAsync("not-a-guid", CancellationToken.None);

        r.Blocked.Should().BeFalse();
        scopeProvider.Verify(s => s.GetCurrentScope(), Times.Never);
    }

    [SkippableFact]
    public async Task EvaluateAsync_allows_when_run_has_no_findings_snapshot_id()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("N");
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ProjectId = "default",
                ArchitectureRequestId = "req-1",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = null,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        InMemoryPolicyPackAssignmentRepository assignments = new();
        await assignments.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ProjectId = TestScope.ProjectId,
                ScopeLevel = GovernanceScopeLevel.Project,
                PolicyPackId = Guid.NewGuid(),
                PolicyPackVersion = "1.0.0",
                IsEnabled = true,
                BlockCommitOnCritical = true,
            },
            CancellationToken.None);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        PreCommitGovernanceGate sut = CreateGate(
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            scopeProvider.Object,
            runs,
            new InMemoryFindingsSnapshotRepository(),
            assignments);

        PreCommitGateResult r = await sut.EvaluateAsync(runId, CancellationToken.None);

        r.Blocked.Should().BeFalse();
    }

    [SkippableFact]
    public async Task EvaluateAsync_allows_when_assignment_exists_but_BlockCommitOnCritical_is_false()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("N");
        Guid snapshotId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ProjectId = "default",
                ArchitectureRequestId = "req-1",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = snapshotId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        InMemoryFindingsSnapshotRepository findings = new();
        await findings.SaveAsync(
            new FindingsSnapshot
            {
                FindingsSnapshotId = snapshotId,
                RunId = runGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                Findings =
                [
                    new Finding
                    {
                        FindingId = "f-critical",
                        FindingType = "Compliance",
                        Category = "c",
                        EngineType = "e",
                        Severity = FindingSeverity.Critical,
                        Title = "t",
                        Rationale = "r",
                    },
                ],
            },
            CancellationToken.None);

        InMemoryPolicyPackAssignmentRepository assignments = new();
        await assignments.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ProjectId = TestScope.ProjectId,
                ScopeLevel = GovernanceScopeLevel.Project,
                PolicyPackId = Guid.NewGuid(),
                PolicyPackVersion = "1.0.0",
                IsEnabled = true,
                BlockCommitOnCritical = false,
            },
            CancellationToken.None);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        PreCommitGovernanceGate sut = CreateGate(
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            scopeProvider.Object,
            runs,
            findings,
            assignments);

        PreCommitGateResult r = await sut.EvaluateAsync(runId, CancellationToken.None);

        r.Blocked.Should().BeFalse();
    }

    [SkippableFact]
    public async Task EvaluateAsync_allows_when_assignment_is_disabled()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("N");
        Guid snapshotId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ProjectId = "default",
                ArchitectureRequestId = "req-1",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = snapshotId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        InMemoryFindingsSnapshotRepository findings = new();
        await findings.SaveAsync(
            new FindingsSnapshot
            {
                FindingsSnapshotId = snapshotId,
                RunId = runGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                Findings =
                [
                    new Finding
                    {
                        FindingId = "f-critical",
                        FindingType = "Compliance",
                        Category = "c",
                        EngineType = "e",
                        Severity = FindingSeverity.Critical,
                        Title = "t",
                        Rationale = "r",
                    },
                ],
            },
            CancellationToken.None);

        InMemoryPolicyPackAssignmentRepository assignments = new();
        await assignments.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ProjectId = TestScope.ProjectId,
                ScopeLevel = GovernanceScopeLevel.Project,
                PolicyPackId = Guid.NewGuid(),
                PolicyPackVersion = "1.0.0",
                IsEnabled = false,
                BlockCommitOnCritical = true,
            },
            CancellationToken.None);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        PreCommitGovernanceGate sut = CreateGate(
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            scopeProvider.Object,
            runs,
            findings,
            assignments);

        PreCommitGateResult r = await sut.EvaluateAsync(runId, CancellationToken.None);

        r.Blocked.Should().BeFalse();
    }

    [SkippableFact]
    public async Task EvaluateAsync_allows_when_snapshot_not_found_despite_id_being_set()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("N");
        Guid snapshotId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ProjectId = "default",
                ArchitectureRequestId = "req-1",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = snapshotId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        InMemoryPolicyPackAssignmentRepository assignments = new();
        await assignments.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ProjectId = TestScope.ProjectId,
                ScopeLevel = GovernanceScopeLevel.Project,
                PolicyPackId = Guid.NewGuid(),
                PolicyPackVersion = "1.0.0",
                IsEnabled = true,
                BlockCommitOnCritical = true,
            },
            CancellationToken.None);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        PreCommitGovernanceGate sut = CreateGate(
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            scopeProvider.Object,
            runs,
            new InMemoryFindingsSnapshotRepository(),
            assignments);

        PreCommitGateResult r = await sut.EvaluateAsync(runId, CancellationToken.None);

        r.Blocked.Should().BeFalse();
    }

    [SkippableFact]
    public async Task EvaluateAsync_blocks_with_multiple_critical_findings_reports_all_ids()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("N");
        Guid snapshotId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ProjectId = "default",
                ArchitectureRequestId = "req-1",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = snapshotId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        InMemoryFindingsSnapshotRepository findings = new();
        await findings.SaveAsync(
            new FindingsSnapshot
            {
                FindingsSnapshotId = snapshotId,
                RunId = runGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                Findings =
                [
                    new Finding
                    {
                        FindingId = "f-1",
                        FindingType = "Compliance",
                        Category = "c",
                        EngineType = "e",
                        Severity = FindingSeverity.Critical,
                        Title = "t1",
                        Rationale = "r",
                    },
                    new Finding
                    {
                        FindingId = "f-2",
                        FindingType = "Compliance",
                        Category = "c",
                        EngineType = "e",
                        Severity = FindingSeverity.Critical,
                        Title = "t2",
                        Rationale = "r",
                    },
                    new Finding
                    {
                        FindingId = "f-3",
                        FindingType = "Compliance",
                        Category = "c",
                        EngineType = "e",
                        Severity = FindingSeverity.Critical,
                        Title = "t3",
                        Rationale = "r",
                    },
                ],
            },
            CancellationToken.None);

        InMemoryPolicyPackAssignmentRepository assignments = new();
        await assignments.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ProjectId = TestScope.ProjectId,
                ScopeLevel = GovernanceScopeLevel.Project,
                PolicyPackId = Guid.NewGuid(),
                PolicyPackVersion = "1.0.0",
                IsEnabled = true,
                BlockCommitOnCritical = true,
            },
            CancellationToken.None);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        PreCommitGovernanceGate sut = CreateGate(
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            scopeProvider.Object,
            runs,
            findings,
            assignments);

        PreCommitGateResult r = await sut.EvaluateAsync(runId, CancellationToken.None);

        r.Blocked.Should().BeTrue();
        r.BlockingFindingIds.Should().BeEquivalentTo("f-1", "f-2", "f-3");
        r.Reason.Should().Contain("3 Critical+");
    }

    [SkippableFact]
    public async Task EvaluateAsync_selects_most_recent_enforcing_assignment()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("N");
        Guid snapshotId = Guid.NewGuid();
        Guid olderPackId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid newerPackId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ProjectId = "default",
                ArchitectureRequestId = "req-1",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = snapshotId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        InMemoryFindingsSnapshotRepository findings = new();
        await findings.SaveAsync(
            new FindingsSnapshot
            {
                FindingsSnapshotId = snapshotId,
                RunId = runGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                Findings =
                [
                    new Finding
                    {
                        FindingId = "f-critical",
                        FindingType = "Compliance",
                        Category = "c",
                        EngineType = "e",
                        Severity = FindingSeverity.Critical,
                        Title = "t",
                        Rationale = "r",
                    },
                ],
            },
            CancellationToken.None);

        InMemoryPolicyPackAssignmentRepository assignments = new();
        await assignments.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ProjectId = TestScope.ProjectId,
                ScopeLevel = GovernanceScopeLevel.Project,
                PolicyPackId = olderPackId,
                PolicyPackVersion = "1.0.0",
                IsEnabled = true,
                BlockCommitOnCritical = true,
                AssignedUtc = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            },
            CancellationToken.None);

        await assignments.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ProjectId = TestScope.ProjectId,
                ScopeLevel = GovernanceScopeLevel.Project,
                PolicyPackId = newerPackId,
                PolicyPackVersion = "1.0.0",
                IsEnabled = true,
                BlockCommitOnCritical = true,
                AssignedUtc = new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            },
            CancellationToken.None);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        PreCommitGovernanceGate sut = CreateGate(
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            scopeProvider.Object,
            runs,
            findings,
            assignments);

        PreCommitGateResult r = await sut.EvaluateAsync(runId, CancellationToken.None);

        r.Blocked.Should().BeTrue();
        r.PolicyPackId.Should().Be(newerPackId.ToString("N"));
    }

    [SkippableFact]
    public async Task EvaluateAsync_blocks_when_older_assignment_non_enforcing_and_newer_enforces()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("N");
        Guid snapshotId = Guid.NewGuid();
        Guid newerPackId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ProjectId = "default",
                ArchitectureRequestId = "req-1",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = snapshotId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        InMemoryFindingsSnapshotRepository findings = new();
        await findings.SaveAsync(
            new FindingsSnapshot
            {
                FindingsSnapshotId = snapshotId,
                RunId = runGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                Findings =
                [
                    new Finding
                    {
                        FindingId = "f-critical",
                        FindingType = "Compliance",
                        Category = "c",
                        EngineType = "e",
                        Severity = FindingSeverity.Critical,
                        Title = "t",
                        Rationale = "r",
                    },
                ],
            },
            CancellationToken.None);

        InMemoryPolicyPackAssignmentRepository assignments = new();
        await assignments.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ProjectId = TestScope.ProjectId,
                ScopeLevel = GovernanceScopeLevel.Project,
                PolicyPackId = Guid.NewGuid(),
                PolicyPackVersion = "1.0.0",
                IsEnabled = true,
                BlockCommitOnCritical = false,
                AssignedUtc = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            },
            CancellationToken.None);

        await assignments.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ProjectId = TestScope.ProjectId,
                ScopeLevel = GovernanceScopeLevel.Project,
                PolicyPackId = newerPackId,
                PolicyPackVersion = "1.0.0",
                IsEnabled = true,
                BlockCommitOnCritical = true,
                AssignedUtc = new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            },
            CancellationToken.None);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        PreCommitGovernanceGate sut = CreateGate(
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            scopeProvider.Object,
            runs,
            findings,
            assignments);

        PreCommitGateResult r = await sut.EvaluateAsync(runId, CancellationToken.None);

        r.Blocked.Should().BeTrue();
        r.PolicyPackId.Should().Be(newerPackId.ToString("N"));
    }

    [SkippableFact]
    public async Task EvaluateAsync_blocks_when_BlockCommitMinimumSeverity_matches_error_findings()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("N");
        Guid snapshotId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ProjectId = "default",
                ArchitectureRequestId = "req-1",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = snapshotId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        InMemoryFindingsSnapshotRepository findings = new();
        await findings.SaveAsync(
            new FindingsSnapshot
            {
                FindingsSnapshotId = snapshotId,
                RunId = runGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                Findings =
                [
                    new Finding
                    {
                        FindingId = "f-error",
                        FindingType = "Compliance",
                        Category = "c",
                        EngineType = "e",
                        Severity = FindingSeverity.Error,
                        Title = "t",
                        Rationale = "r",
                    },
                ],
            },
            CancellationToken.None);

        InMemoryPolicyPackAssignmentRepository assignments = new();
        await assignments.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ProjectId = TestScope.ProjectId,
                ScopeLevel = GovernanceScopeLevel.Project,
                PolicyPackId = Guid.NewGuid(),
                PolicyPackVersion = "1.0.0",
                IsEnabled = true,
                BlockCommitOnCritical = false,
                BlockCommitMinimumSeverity = (int)FindingSeverity.Error,
            },
            CancellationToken.None);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        PreCommitGovernanceGate sut = CreateGate(
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            scopeProvider.Object,
            runs,
            findings,
            assignments);

        PreCommitGateResult r = await sut.EvaluateAsync(runId, CancellationToken.None);

        r.Blocked.Should().BeTrue();
        r.BlockingFindingIds.Should().ContainSingle().Which.Should().Be("f-error");
        r.MinimumBlockingSeverity.Should().Be((int)FindingSeverity.Error);
        r.Reason.Should().Contain("Error+");
    }

    [SkippableFact]
    public async Task EvaluateAsync_allows_when_BlockCommitMinimumSeverity_is_error_but_only_warnings_exist()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("N");
        Guid snapshotId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ProjectId = "default",
                ArchitectureRequestId = "req-1",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = snapshotId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        InMemoryFindingsSnapshotRepository findings = new();
        await findings.SaveAsync(
            new FindingsSnapshot
            {
                FindingsSnapshotId = snapshotId,
                RunId = runGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                Findings =
                [
                    new Finding
                    {
                        FindingId = "f-warn",
                        FindingType = "Compliance",
                        Category = "c",
                        EngineType = "e",
                        Severity = FindingSeverity.Warning,
                        Title = "t",
                        Rationale = "r",
                    },
                ],
            },
            CancellationToken.None);

        InMemoryPolicyPackAssignmentRepository assignments = new();
        await assignments.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ProjectId = TestScope.ProjectId,
                ScopeLevel = GovernanceScopeLevel.Project,
                PolicyPackId = Guid.NewGuid(),
                PolicyPackVersion = "1.0.0",
                IsEnabled = true,
                BlockCommitOnCritical = false,
                BlockCommitMinimumSeverity = (int)FindingSeverity.Error,
            },
            CancellationToken.None);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        PreCommitGovernanceGate sut = CreateGate(
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            scopeProvider.Object,
            runs,
            findings,
            assignments);

        PreCommitGateResult r = await sut.EvaluateAsync(runId, CancellationToken.None);

        r.Blocked.Should().BeFalse();
    }

    [SkippableFact]
    public async Task EvaluateAsync_blocks_on_critical_only_when_null_minimum_severity_and_BlockCommitOnCritical_true()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("N");
        Guid snapshotId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ProjectId = "default",
                ArchitectureRequestId = "req-1",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = snapshotId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        InMemoryFindingsSnapshotRepository findings = new();
        await findings.SaveAsync(
            new FindingsSnapshot
            {
                FindingsSnapshotId = snapshotId,
                RunId = runGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                Findings =
                [
                    new Finding
                    {
                        FindingId = "f-error",
                        FindingType = "Compliance",
                        Category = "c",
                        EngineType = "e",
                        Severity = FindingSeverity.Error,
                        Title = "t",
                        Rationale = "r",
                    },
                    new Finding
                    {
                        FindingId = "f-critical",
                        FindingType = "Compliance",
                        Category = "c",
                        EngineType = "e",
                        Severity = FindingSeverity.Critical,
                        Title = "t",
                        Rationale = "r",
                    },
                ],
            },
            CancellationToken.None);

        InMemoryPolicyPackAssignmentRepository assignments = new();
        await assignments.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ProjectId = TestScope.ProjectId,
                ScopeLevel = GovernanceScopeLevel.Project,
                PolicyPackId = Guid.NewGuid(),
                PolicyPackVersion = "1.0.0",
                IsEnabled = true,
                BlockCommitOnCritical = true,
                BlockCommitMinimumSeverity = null,
            },
            CancellationToken.None);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        PreCommitGovernanceGate sut = CreateGate(
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            scopeProvider.Object,
            runs,
            findings,
            assignments);

        PreCommitGateResult r = await sut.EvaluateAsync(runId, CancellationToken.None);

        r.Blocked.Should().BeTrue();
        r.BlockingFindingIds.Should().Contain("f-critical");
        r.MinimumBlockingSeverity.Should().Be((int)FindingSeverity.Critical);
    }

    [SkippableFact]
    public async Task EvaluateAsync_warns_only_when_severity_is_in_WarnOnlySeverities()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("N");
        Guid snapshotId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ProjectId = "default",
                ArchitectureRequestId = "req-1",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = snapshotId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        InMemoryFindingsSnapshotRepository findings = new();
        await findings.SaveAsync(
            new FindingsSnapshot
            {
                FindingsSnapshotId = snapshotId,
                RunId = runGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                Findings =
                [
                    new Finding
                    {
                        FindingId = "f-error",
                        FindingType = "Compliance",
                        Category = "c",
                        EngineType = "e",
                        Severity = FindingSeverity.Error,
                        Title = "t",
                        Rationale = "r",
                    },
                ],
            },
            CancellationToken.None);

        InMemoryPolicyPackAssignmentRepository assignments = new();
        await assignments.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ProjectId = TestScope.ProjectId,
                ScopeLevel = GovernanceScopeLevel.Project,
                PolicyPackId = Guid.NewGuid(),
                PolicyPackVersion = "1.0.0",
                IsEnabled = true,
                BlockCommitOnCritical = false,
                BlockCommitMinimumSeverity = (int)FindingSeverity.Error,
            },
            CancellationToken.None);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        PreCommitGovernanceGateOptions opts = new() { PreCommitGateEnabled = true, WarnOnlySeverities = ["Error"], };

        PreCommitGovernanceGate sut = CreateGate(
            Options.Create(opts),
            scopeProvider.Object,
            runs,
            findings,
            assignments);

        PreCommitGateResult r = await sut.EvaluateAsync(runId, CancellationToken.None);

        r.Blocked.Should().BeFalse();
        r.WarnOnly.Should().BeTrue();
        r.Warnings.Should().NotBeEmpty();
        r.BlockingFindingIds.Should().ContainSingle().Which.Should().Be("f-error");
        r.MinimumBlockingSeverity.Should().Be((int)FindingSeverity.Error);
    }

    [Fact]
    public async Task EvaluateAsync_with_manifest_wire_throws_schema_validation_before_loading_policy_assignments()
    {
        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .Setup(a => a.ListByScopeAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("ListByScopeAsync should not run when schema fails."));

        Mock<ISchemaValidationService> schema = new();
        schema
            .Setup(s => s.ValidateGoldenManifestJson(It.IsAny<string>()))
            .Returns(
                new SchemaValidationResult { Errors = ["GoldenManifest schema error at '(root)': unit-test violation"], });

        PreCommitGovernanceGate sut = CreateGate(
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true, }),
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IFindingsSnapshotRepository>(),
            assignments.Object,
            schema.Object,
            Options.Create(new AuthorityCommitSchemaValidationOptions { ValidateGoldenManifestSchema = true }));

        string runId = Guid.NewGuid().ToString("N");
        Func<Task> act = () => sut.EvaluateAsync(runId, "{}", CancellationToken.None);

        await act.Should().ThrowAsync<GoldenManifestSchemaValidationException>();
        assignments.Verify(
            a => a.ListByScopeAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task EvaluateAsync_with_manifest_wire_skips_schema_service_when_validation_disabled()
    {
        Mock<ISchemaValidationService> schema = new();
        schema
            .Setup(s => s.ValidateGoldenManifestJson(It.IsAny<string>()))
            .Throws(new InvalidOperationException("schema should not be invoked"));

        PreCommitGovernanceGate sut = CreateGate(
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = false, }),
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IFindingsSnapshotRepository>(),
            Mock.Of<IPolicyPackAssignmentRepository>(),
            schema.Object,
            Options.Create(new AuthorityCommitSchemaValidationOptions { ValidateGoldenManifestSchema = false }));

        PreCommitGateResult r = await sut.EvaluateAsync(Guid.NewGuid().ToString("N"), "{}", CancellationToken.None);

        r.Blocked.Should().BeFalse();
        schema.Verify(s => s.ValidateGoldenManifestJson(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task EvaluateAsync_uses_global_pre_commit_threshold_when_no_enforcing_assignment()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("N");
        Guid snapshotId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ProjectId = "default",
                ArchitectureRequestId = "req-global",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = snapshotId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        InMemoryFindingsSnapshotRepository findings = new();
        await findings.SaveAsync(
            new FindingsSnapshot
            {
                FindingsSnapshotId = snapshotId,
                RunId = runGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                Findings =
                [
                    new Finding
                    {
                        FindingId = "f-error",
                        FindingType = "Compliance",
                        Category = "c",
                        EngineType = "e",
                        Severity = FindingSeverity.Error,
                        Title = "t",
                        Rationale = "r",
                    },
                ],
            },
            CancellationToken.None);

        InMemoryPolicyPackAssignmentRepository assignments = new();

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        PreCommitGovernanceGate sut = CreateGate(
            Options.Create(new PreCommitGovernanceGateOptions
            {
                PreCommitGateEnabled = true,
                PreCommitGateThreshold = "Error"
            }),
            scopeProvider.Object,
            runs,
            findings,
            assignments);

        PreCommitGateResult result = await sut.EvaluateAsync(runId, CancellationToken.None);

        result.Blocked.Should().BeTrue();
        result.BlockingFindingIds.Should().ContainSingle().Which.Should().Be("f-error");
    }

    [SkippableFact]
    public async Task EvaluateAsync_with_preloaded_data_skips_run_and_findings_repository_reads()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("N");
        Mock<IRunRepository> runs = new();
        Mock<IFindingsSnapshotRepository> findings = new();
        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .Setup(r => r.ListByScopeAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<PolicyPackAssignment>());

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        PreCommitGovernanceGate sut = CreateGate(
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            scopeProvider.Object,
            runs.Object,
            findings.Object,
            assignments.Object);

        PreCommitGateResult result = await sut.EvaluateAsync(
            runId,
            "{}",
            new PreCommitGovernancePreloadedData
            {
                FindingsSnapshotFindings = [],
                ScopePolicyPackAssignments = []
            },
            CancellationToken.None);

        result.Blocked.Should().BeFalse();
        runs.Verify(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
        findings.Verify(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
        assignments.Verify(
            r => r.ListByScopeAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task EvaluateAsync_appends_ledger_consistency_findings_warn_only_without_blocking()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("N");
        Guid snapshotId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ProjectId = "default",
                ArchitectureRequestId = "req-tech",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = snapshotId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        InMemoryFindingsSnapshotRepository findings = new();
        await findings.SaveAsync(
            new FindingsSnapshot
            {
                FindingsSnapshotId = snapshotId,
                RunId = runGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                Findings = [],
            },
            CancellationToken.None);

        InMemoryPolicyPackAssignmentRepository assignments = new();
        await assignments.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ProjectId = TestScope.ProjectId,
                ScopeLevel = GovernanceScopeLevel.Project,
                PolicyPackId = Guid.NewGuid(),
                PolicyPackVersion = "1.0.0",
                IsEnabled = true,
                BlockCommitOnCritical = false,
                BlockCommitMinimumSeverity = (int)FindingSeverity.Error,
            },
            CancellationToken.None);

        InMemoryTechnologyLedgerRepository ledgerRepository = new();
        await ledgerRepository.AddAsync(
            new TechnologyLedgerEntry
            {
                RunId = runId,
                Role = TechnologyLedgerRole.CloudPlatform,
                TechnologyName = "Microsoft Azure",
                ProviderFamily = CloudProvider.Azure,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.User,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);
        await ledgerRepository.AddAsync(
            new TechnologyLedgerEntry
            {
                RunId = runId,
                Role = TechnologyLedgerRole.PrimaryDatastore,
                TechnologyName = "Amazon RDS",
                ProviderFamily = CloudProvider.Aws,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.User,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        PreCommitGovernanceGate sut = CreateGate(
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            scopeProvider.Object,
            runs,
            findings,
            assignments,
            ledgerRepository: ledgerRepository,
            consistencyOptions: Options.Create(new TechnologyConsistencyFindingEngineOptions
            {
                Enabled = true,
                Mode = TechnologyConsistencyFindingEngineMode.WarnOnly,
            }));

        PreCommitGateResult result = await sut.EvaluateAsync(runId, CancellationToken.None);

        result.Blocked.Should().BeFalse();
    }

    [Fact]
    public async Task EvaluateAsync_blocks_on_ledger_consistency_when_enforcing_and_global_threshold_error()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("N");
        Guid snapshotId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ProjectId = "default",
                ArchitectureRequestId = "req-tech-enforce",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = snapshotId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        InMemoryFindingsSnapshotRepository findings = new();
        await findings.SaveAsync(
            new FindingsSnapshot
            {
                FindingsSnapshotId = snapshotId,
                RunId = runGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                Findings = [],
            },
            CancellationToken.None);

        InMemoryPolicyPackAssignmentRepository assignments = new();

        InMemoryTechnologyLedgerRepository ledgerRepository = new();
        await ledgerRepository.AddAsync(
            new TechnologyLedgerEntry
            {
                RunId = runId,
                Role = TechnologyLedgerRole.CloudPlatform,
                TechnologyName = "Microsoft Azure",
                ProviderFamily = CloudProvider.Azure,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.User,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);
        await ledgerRepository.AddAsync(
            new TechnologyLedgerEntry
            {
                RunId = runId,
                Role = TechnologyLedgerRole.PrimaryDatastore,
                TechnologyName = "Amazon RDS",
                ProviderFamily = CloudProvider.Aws,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.User,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        PreCommitGovernanceGate sut = CreateGate(
            Options.Create(new PreCommitGovernanceGateOptions
            {
                PreCommitGateEnabled = true,
                PreCommitGateThreshold = "Error",
            }),
            scopeProvider.Object,
            runs,
            findings,
            assignments,
            ledgerRepository: ledgerRepository,
            consistencyOptions: Options.Create(new TechnologyConsistencyFindingEngineOptions
            {
                Enabled = true,
                Mode = TechnologyConsistencyFindingEngineMode.Enforcing,
            }));

        PreCommitGateResult result = await sut.EvaluateAsync(runId, CancellationToken.None);

        result.Blocked.Should().BeTrue();
        result.BlockingFindingIds.Should().Contain(id => id.StartsWith("tech-consistency-ConflictingChosenProviderFamily", StringComparison.Ordinal));
    }

    [Fact]
    public async Task SimulateSyntheticFindingsAsync_throws_when_run_is_not_in_current_scope()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);
        PreCommitGovernanceGate sut = CreateGate(
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            scopeProvider.Object,
            new InMemoryRunRepository(),
            new InMemoryFindingsSnapshotRepository(),
            new InMemoryPolicyPackAssignmentRepository());
        string runId = Guid.NewGuid().ToString("N");

        Func<Task> act = () => sut.SimulateSyntheticFindingsAsync(
            runId,
            FindingSeverity.Critical,
            syntheticCount: 1,
            CancellationToken.None);

        await act.Should().ThrowAsync<RunNotFoundException>()
            .WithMessage($"Run '{runId}' was not found.");
    }

    private static PreCommitGovernanceGate CreateGate(
        IOptions<PreCommitGovernanceGateOptions> gateOptions,
        IScopeContextProvider scopeProvider,
        IRunRepository runs,
        IFindingsSnapshotRepository findings,
        IPolicyPackAssignmentRepository assignments,
        ISchemaValidationService? schemaValidationService = null,
        IOptions<AuthorityCommitSchemaValidationOptions>? authoritySchemaOptions = null,
        ITechnologyLedgerRepository? ledgerRepository = null,
        IOptions<TechnologyConsistencyFindingEngineOptions>? consistencyOptions = null,
        ITechnologyConsistencyFindingEngine? consistencyEngine = null,
        IFindingEvidenceLinkageFindingEngine? linkageEngine = null,
        IOptions<FindingEvidenceLinkageFindingEngineOptions>? linkageOptions = null)
    {
        return new PreCommitGovernanceGate(
            gateOptions,
            scopeProvider,
            runs,
            findings,
            assignments,
            schemaValidationService ?? new PassthroughSchemaValidationService(),
            authoritySchemaOptions
            ?? Options.Create(new AuthorityCommitSchemaValidationOptions { ValidateGoldenManifestSchema = false }),
            ledgerRepository ?? new InMemoryTechnologyLedgerRepository(),
            consistencyEngine ?? new TechnologyConsistencyFindingEngine(),
            consistencyOptions ?? Options.Create(new TechnologyConsistencyFindingEngineOptions { Enabled = false }),
            linkageEngine ?? new FindingEvidenceLinkageFindingEngine(),
            linkageOptions ?? Options.Create(new FindingEvidenceLinkageFindingEngineOptions { Enabled = false }));
    }
}
